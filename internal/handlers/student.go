package handlers

import (
	"log"
	"mitsui-jpy-quiz/internal/database"
	"mitsui-jpy-quiz/internal/models"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type StudentHandler struct{}

func NewStudentHandler() *StudentHandler {
	return &StudentHandler{}
}

type StartQuizRequest struct {
	CourseID      uint `json:"course_id" binding:"required"`
	QuizPackageID uint `json:"quiz_package_id" binding:"required"`
}

type SubmitAnswerRequest struct {
	AttemptID     uint   `json:"attempt_id" binding:"required"`
	QuestionID    uint   `json:"question_id" binding:"required"`
	StudentAnswer string `json:"student_answer" binding:"required"`
}

// Start Quiz Attempt
func (h *StudentHandler) StartQuiz(c *gin.Context) {
	userID, _ := c.Get("user_id")
	studentID := userID.(uint)

	var req StartQuizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if course exists and get retry count
	var course models.Course
	if err := database.DB.First(&course, req.CourseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	// Check quiz package exists
	var quizPackage models.QuizPackage
	if err := database.DB.First(&quizPackage, req.QuizPackageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz package not found"})
		return
	}

	// Count previous attempts
	var attemptCount int64
	database.DB.Model(&models.Attempt{}).Where(
		"student_id = ? AND course_id = ? AND quiz_package_id = ?",
		studentID, req.CourseID, req.QuizPackageID,
	).Count(&attemptCount)

	if int(attemptCount) >= course.RetryCount {
		c.JSON(http.StatusForbidden, gin.H{"error": "Maximum retry count reached"})
		return
	}

	// Get total points for this quiz
	var totalPoints int64
	database.DB.Model(&models.Question{}).
		Where("quiz_package_id = ?", req.QuizPackageID).
		Select("COALESCE(SUM(points), 0)").
		Scan(&totalPoints)

	// Create new attempt
	attempt := models.Attempt{
		StudentID:     studentID,
		CourseID:      req.CourseID,
		QuizPackageID: req.QuizPackageID,
		Status:        models.StatusInProgress,
		StartTime:     time.Now(),
		AttemptCount:  int(attemptCount) + 1,
		TotalPoints:   int(totalPoints),
	}

	if err := database.DB.Create(&attempt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start quiz"})
		return
	}

	// Get questions for this quiz
	var questions []models.Question
	database.DB.Where("quiz_package_id = ? AND is_active = ?", req.QuizPackageID, true).
		Order("order_number ASC").
		Find(&questions)

	c.JSON(http.StatusCreated, gin.H{
		"attempt":   attempt,
		"questions": questions,
		"exam_time": course.ExamTime,
	})
}

// Submit Answer
func (h *StudentHandler) SubmitAnswer(c *gin.Context) {
	userID, _ := c.Get("user_id")
	studentID := userID.(uint)

	var req SubmitAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify attempt belongs to student and is in progress
	var attempt models.Attempt
	if err := database.DB.Where("id = ? AND student_id = ? AND status = ?",
		req.AttemptID, studentID, models.StatusInProgress).First(&attempt).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attempt"})
		return
	}

	// Get question
	var question models.Question
	if err := database.DB.First(&question, req.QuestionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	}

	// Check if answer already exists (update) or create new
	var answer models.Answer
	isCorrect := strings.TrimSpace(strings.ToLower(req.StudentAnswer)) ==
		strings.TrimSpace(strings.ToLower(question.CorrectAnswer))

	pointsEarned := 0
	if isCorrect {
		pointsEarned = question.Points
	}

	err := database.DB.Where("attempt_id = ? AND question_id = ?", req.AttemptID, req.QuestionID).
		First(&answer).Error

	if err != nil {
		// Create new answer
		answer = models.Answer{
			AttemptID:     req.AttemptID,
			QuestionID:    req.QuestionID,
			StudentAnswer: req.StudentAnswer,
			IsCorrect:     isCorrect,
			PointsEarned:  pointsEarned,
		}
		database.DB.Create(&answer)
	} else {
		// Update existing answer
		answer.StudentAnswer = req.StudentAnswer
		answer.IsCorrect = isCorrect
		answer.PointsEarned = pointsEarned
		database.DB.Save(&answer)
	}

	c.JSON(http.StatusOK, gin.H{
		"answer":        answer,
		"is_correct":    isCorrect,
		"points_earned": pointsEarned,
	})
}

// Complete Quiz
func (h *StudentHandler) CompleteQuiz(c *gin.Context) {
	userID, _ := c.Get("user_id")
	studentID := userID.(uint)
	attemptID, _ := strconv.Atoi(c.Param("attemptId"))

	// Verify attempt belongs to student
	var attempt models.Attempt
	if err := database.DB.Where("id = ? AND student_id = ?", attemptID, studentID).
		First(&attempt).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		return
	}

	// Calculate total score
	var totalScore int64
	database.DB.Model(&models.Answer{}).
		Where("attempt_id = ?", attemptID).
		Select("COALESCE(SUM(points_earned), 0)").
		Scan(&totalScore)

	// Update attempt
	now := time.Now()
	attempt.Status = models.StatusCompleted
	attempt.EndTime = &now
	attempt.Score = int(totalScore)

	if err := database.DB.Save(&attempt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete quiz"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"attempt":      attempt,
		"score":        attempt.Score,
		"total_points": attempt.TotalPoints,
		"percentage":   float64(attempt.Score) / float64(attempt.TotalPoints) * 100,
	})
}

// Get Student Attempts
func (h *StudentHandler) GetMyAttempts(c *gin.Context) {
	userID, _ := c.Get("user_id")
	studentID := userID.(uint)

	var attempts []models.Attempt
	database.DB.Where("student_id = ?", studentID).
		Order("created_at DESC").
		Find(&attempts)

	c.JSON(http.StatusOK, attempts)
}

// Get Attempt Detail with Answers
func (h *StudentHandler) GetAttemptDetail(c *gin.Context) {
	userID, _ := c.Get("user_id")
	studentID := userID.(uint)
	attemptID, _ := strconv.Atoi(c.Param("attemptId"))

	var attempt models.Attempt
	if err := database.DB.Preload("Answers").
		Where("id = ? AND student_id = ?", attemptID, studentID).
		First(&attempt).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		return
	}

	c.JSON(http.StatusOK, attempt)
}

// Public Quiz Submission (No Authentication Required)
type PublicQuizSubmission struct {
	StudentName   string `json:"student_name" binding:"required"`
	CourseID      uint   `json:"course_id" binding:"required"`
	QuizPackageID uint   `json:"quiz_package_id" binding:"required"`
	DeviceID      string `json:"device_id"`
	Score         int    `json:"score"`
	TotalPoints   int    `json:"total_points"`
	TimeTaken     int    `json:"time_taken"`
	Answers       []struct {
		QuestionID   uint   `json:"question_id"`
		UserAnswer   string `json:"user_answer"`
		IsCorrect    bool   `json:"is_correct"`
		PointsEarned int    `json:"points_earned"`
	} `json:"answers"`
}

func (h *StudentHandler) SubmitPublicQuiz(c *gin.Context) {
	var req PublicQuizSubmission
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Validation error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Received quiz submission: Name=%s, CourseID=%d, QuizPackageID=%d, DeviceID=%s, Score=%d, Answers=%d",
		req.StudentName, req.CourseID, req.QuizPackageID, req.DeviceID, req.Score, len(req.Answers))

	// Validate course and quiz package exist
	var course models.Course
	if err := database.DB.First(&course, req.CourseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	var quizPackage models.QuizPackage
	if err := database.DB.First(&quizPackage, req.QuizPackageID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz package not found"})
		return
	}

	// Check retry limit (3 attempts max per device per quiz package)
	if req.DeviceID != "" {
		var attemptCount int64
		database.DB.Model(&models.Attempt{}).Where(
			"device_id = ? AND quiz_package_id = ? AND status = ?",
			req.DeviceID, req.QuizPackageID, models.StatusCompleted,
		).Count(&attemptCount)

		if attemptCount >= 3 {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Maximum retry limit reached",
				"message": "You have already taken this quiz 3 times. No more attempts allowed.",
			})
			return
		}
	}

	// Create or find a guest user for this student name
	var guestUser models.User
	email := "guest_" + strings.ToLower(strings.ReplaceAll(req.StudentName, " ", "_")) + "@guest.local"

	result := database.DB.Where("email = ?", email).First(&guestUser)
	if result.Error != nil {
		// Create new guest user
		guestUser = models.User{
			Email:    email,
			Password: "no-password-guest-user", // Guest users can't login
			Name:     req.StudentName,
			Role:     models.RoleStudent,
		}
		if err := database.DB.Create(&guestUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create guest user"})
			return
		}
	}

	// Create attempt record
	now := time.Now()
	endTime := now.Add(time.Duration(req.TimeTaken) * time.Second)

	attempt := models.Attempt{
		StudentID:     guestUser.ID,
		CourseID:      req.CourseID,
		QuizPackageID: req.QuizPackageID,
		DeviceID:      req.DeviceID,
		Status:        models.StatusCompleted,
		StartTime:     now,
		EndTime:       &endTime,
		Score:         req.Score,
		TotalPoints:   req.TotalPoints,
		AttemptCount:  1,
	}

	if err := database.DB.Create(&attempt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create attempt record"})
		return
	}

	// Save answers
	for _, ans := range req.Answers {
		answer := models.Answer{
			AttemptID:     attempt.ID,
			QuestionID:    ans.QuestionID,
			StudentAnswer: ans.UserAnswer,
			IsCorrect:     ans.IsCorrect,
			PointsEarned:  ans.PointsEarned,
		}
		database.DB.Create(&answer)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Quiz submitted successfully",
		"attempt_id": attempt.ID,
		"score":      req.Score,
		"percentage": float64(req.Score) / float64(req.TotalPoints) * 100,
	})
}

// CheckDeviceEligibility checks if a device has already taken the quiz
func (h *StudentHandler) CheckDeviceEligibility(c *gin.Context) {
	quizPackageID := c.Query("quiz_package_id")
	deviceID := c.Query("device_id")

	if quizPackageID == "" || deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required parameters"})
		return
	}

	// Check if this device has already submitted any quiz (not just this package)
	var attempt models.Attempt
	var studentName string

	// First check if device took THIS specific quiz
	err := database.DB.Where("quiz_package_id = ? AND device_id = ? AND status = ?",
		quizPackageID, deviceID, models.StatusCompleted).
		First(&attempt).Error

	alreadyTakenThisQuiz := err == nil

	// Prepare response
	response := gin.H{
		"already_taken": alreadyTakenThisQuiz,
		"student_name":  "",
	}

	// If already taken this quiz, include the results
	if alreadyTakenThisQuiz {
		// Get student name
		var user models.User
		if err := database.DB.First(&user, attempt.StudentID).Error; err == nil {
			studentName = user.Name
			response["student_name"] = studentName
		}

		// Load answers count
		var answersCount int64
		database.DB.Model(&models.Answer{}).Where("attempt_id = ?", attempt.ID).Count(&answersCount)

		// Calculate time taken in seconds
		var timeTaken int
		if attempt.EndTime != nil {
			timeTaken = int(attempt.EndTime.Sub(attempt.StartTime).Seconds())
		}

		// Calculate percentage
		percentage := float64(0)
		if attempt.TotalPoints > 0 {
			percentage = float64(attempt.Score) / float64(attempt.TotalPoints) * 100
		}

		// Include previous attempt results
		response["previous_attempt"] = gin.H{
			"score":           attempt.Score,
			"total_points":    attempt.TotalPoints,
			"time_taken":      timeTaken,
			"completed_at":    attempt.EndTime,
			"total_questions": answersCount,
			"percentage":      percentage,
		}
	} else {
		// Get student name from any previous attempt on this device
		err = database.DB.Where("device_id = ? AND status = ?", deviceID, models.StatusCompleted).
			Order("created_at DESC").
			First(&attempt).Error

		if err == nil {
			// Get student name from user record
			var user models.User
			if err := database.DB.First(&user, attempt.StudentID).Error; err == nil {
				studentName = user.Name
				response["student_name"] = studentName
			}
		}
	}

	c.JSON(http.StatusOK, response)
}

// Get Total Student Count (Admin only)
func (h *StudentHandler) GetTotalStudentCount(c *gin.Context) {
	// Count all unique students (users with role 'student')
	var totalCount int64
	database.DB.Model(&models.User{}).
		Where("role = ?", models.RoleStudent).
		Count(&totalCount)

	c.JSON(http.StatusOK, gin.H{
		"total_students": int(totalCount),
	})
}

// Get Courses with Enrollment Stats (Admin only)
func (h *StudentHandler) GetCoursesWithStudentCount(c *gin.Context) {
	var courses []models.Course

	// Get all courses
	if err := database.DB.Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch courses"})
		return
	}

	// Get total unique student count
	var totalStudentCount int64
	database.DB.Model(&models.User{}).
		Where("role = ?", models.RoleStudent).
		Count(&totalStudentCount)

	type CourseWithStudentCount struct {
		ID                uint      `json:"id"`
		Title             string    `json:"title"`
		Description       string    `json:"description"`
		EnrolledCount     int       `json:"enrolled_count"`      // Students registered/enrolled in course
		AttemptedCount    int       `json:"attempted_count"`     // Students who took quizzes
		TotalAttemptCount int       `json:"total_attempt_count"` // Total quiz attempts
		IsActive          bool      `json:"is_active"`
		CreatedAt         time.Time `json:"created_at"`
	}

	type Response struct {
		TotalStudents int                       `json:"total_students"`
		Courses       []CourseWithStudentCount  `json:"courses"`
	}

	var coursesData []CourseWithStudentCount
	for _, course := range courses {
		// Count students ENROLLED in this course (exclude declined enrollments)
		var enrolledCount int64
		database.DB.Model(&models.Enrollment{}).
			Where("course_id = ? AND status != ?", course.ID, models.EnrollmentDeclined).
			Count(&enrolledCount)

		// Count unique students who ATTEMPTED quizzes in this course
		var attemptedCount int64
		database.DB.Model(&models.Attempt{}).
			Where("course_id = ?", course.ID).
			Distinct("student_id").
			Count(&attemptedCount)

		// Count total quiz attempts for this course
		var totalAttemptCount int64
		database.DB.Model(&models.Attempt{}).
			Where("course_id = ?", course.ID).
			Count(&totalAttemptCount)

		coursesData = append(coursesData, CourseWithStudentCount{
			ID:                course.ID,
			Title:             course.Title,
			Description:       course.Description,
			EnrolledCount:     int(enrolledCount),
			AttemptedCount:    int(attemptedCount),
			TotalAttemptCount: int(totalAttemptCount),
			IsActive:          course.IsActive,
			CreatedAt:         course.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, Response{
		TotalStudents: int(totalStudentCount),
		Courses:       coursesData,
	})
}

// Get Students by Course (Admin only)
func (h *StudentHandler) GetStudentsByCourse(c *gin.Context) {
	courseID := c.Param("courseId")

	// Verify course exists
	var course models.Course
	if err := database.DB.First(&course, courseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	// Get all attempts for this course
	var attempts []models.Attempt
	if err := database.DB.
		Where("course_id = ?", courseID).
		Order("created_at DESC").
		Find(&attempts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attempts"})
		return
	}

	// Build unique student list with their stats for this course
	type StudentCourseStats struct {
		ID               uint      `json:"id"`
		Name             string    `json:"name"`
		Email            string    `json:"email"`
		AttemptsInCourse int       `json:"attempts_in_course"`
		BestScore        int       `json:"best_score"`
		BestPercentage   float64   `json:"best_percentage"`
		LastAttemptDate  time.Time `json:"last_attempt_date"`
		Status           string    `json:"status"` // completed, in_progress
		CreatedAt        time.Time `json:"created_at"`
	}

	studentMap := make(map[uint]*StudentCourseStats)
	
	// Get all unique student IDs from attempts
	studentIDs := make(map[uint]bool)
	for _, attempt := range attempts {
		studentIDs[attempt.StudentID] = true
	}

	// Load all students at once
	var students []models.User
	var studentIDList []uint
	for id := range studentIDs {
		studentIDList = append(studentIDList, id)
	}
	
	if len(studentIDList) > 0 {
		database.DB.Where("id IN ?", studentIDList).Find(&students)
	}

	// Create student lookup map
	studentLookup := make(map[uint]models.User)
	for _, student := range students {
		studentLookup[student.ID] = student
	}

	// Build stats for each student
	for _, attempt := range attempts {
		student, exists := studentLookup[attempt.StudentID]
		if !exists {
			continue
		}

		if _, exists := studentMap[student.ID]; !exists {
			studentMap[student.ID] = &StudentCourseStats{
				ID:               student.ID,
				Name:             student.Name,
				Email:            student.Email,
				AttemptsInCourse: 0,
				BestScore:        0,
				BestPercentage:   0,
				LastAttemptDate:  attempt.CreatedAt,
				CreatedAt:        student.CreatedAt,
			}
		}

		stats := studentMap[student.ID]
		stats.AttemptsInCourse++

		// Track best score
		if attempt.Score > stats.BestScore {
			stats.BestScore = attempt.Score
			if attempt.TotalPoints > 0 {
				stats.BestPercentage = float64(attempt.Score) / float64(attempt.TotalPoints) * 100
			}
		}

		// Track latest attempt
		if attempt.CreatedAt.After(stats.LastAttemptDate) {
			stats.LastAttemptDate = attempt.CreatedAt
			stats.Status = string(attempt.Status)
		}
	}

	// Convert map to slice
	var response []StudentCourseStats
	for _, stats := range studentMap {
		response = append(response, *stats)
	}

	c.JSON(http.StatusOK, response)
}

// List All Students (Admin only) - Keep for backward compatibility
func (h *StudentHandler) ListStudents(c *gin.Context) {
	var students []models.User

	// Get all students with their attempts count
	if err := database.DB.
		Preload("Attempts").
		Where("role = ?", models.RoleStudent).
		Order("created_at DESC").
		Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}

	// Build response with additional stats
	type StudentResponse struct {
		ID            uint      `json:"id"`
		Name          string    `json:"name"`
		Email         string    `json:"email"`
		AttemptCount  int       `json:"attempt_count"`
		EnrolledCount int       `json:"enrolled_count"`
		CreatedAt     time.Time `json:"created_at"`
	}

	var response []StudentResponse
	for _, student := range students {
		// Count unique courses the student has attempted
		var enrolledCount int64
		database.DB.Model(&models.Attempt{}).
			Where("student_id = ?", student.ID).
			Distinct("course_id").
			Count(&enrolledCount)

		response = append(response, StudentResponse{
			ID:            student.ID,
			Name:          student.Name,
			Email:         student.Email,
			AttemptCount:  len(student.Attempts),
			EnrolledCount: int(enrolledCount),
			CreatedAt:     student.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, response)
}

// Delete Student (Admin only)
func (h *StudentHandler) DeleteStudent(c *gin.Context) {
	studentID := c.Param("id")

	// Check if student exists
	var student models.User
	if err := database.DB.Where("id = ? AND role = ?", studentID, models.RoleStudent).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// Delete all student's attempts and answers first
	database.DB.Where("student_id = ?", studentID).Delete(&models.Attempt{})

	// Delete the student
	if err := database.DB.Delete(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete student"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Student deleted successfully"})
}

// Get Enrollments by Course (Admin only)
func (h *StudentHandler) GetEnrollmentsByCourse(c *gin.Context) {
	courseID := c.Param("courseId")

	type EnrollmentDetail struct {
		ID          uint      `json:"id"`
		StudentID   uint      `json:"student_id"`
		Name        string    `json:"name"`
		Email       string    `json:"email"`
		PhoneNumber string    `json:"phone_number"`
		Address     string    `json:"address"`
		FacebookURL string    `json:"facebook_url"`
		Status      string    `json:"status"`
		CreatedAt   time.Time `json:"created_at"`
	}

	var enrollments []models.Enrollment
	// Exclude declined enrollments from the list
	if err := database.DB.Preload("Student").Where("course_id = ? AND status != ?", courseID, models.EnrollmentDeclined).Order("created_at DESC").Find(&enrollments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch enrollments"})
		return
	}

	var details []EnrollmentDetail
	for _, enrollment := range enrollments {
		details = append(details, EnrollmentDetail{
			ID:          enrollment.ID,
			StudentID:   enrollment.StudentID,
			Name:        enrollment.Student.Name,
			Email:       enrollment.Student.Email,
			PhoneNumber: enrollment.Student.PhoneNumber,
			Address:     enrollment.Student.Address,
			FacebookURL: enrollment.Student.FacebookURL,
			Status:      string(enrollment.Status),
			CreatedAt:   enrollment.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, details)
}

// Update Enrollment Status (Admin only)
func (h *StudentHandler) UpdateEnrollmentStatus(c *gin.Context) {
	enrollmentID := c.Param("enrollmentId")

	var req struct {
		Status string `json:"status" binding:"required,oneof=approved declined pending"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var enrollment models.Enrollment
	if err := database.DB.First(&enrollment, enrollmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Enrollment not found"})
		return
	}

	enrollment.Status = models.EnrollmentStatus(req.Status)
	if err := database.DB.Save(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update enrollment status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Enrollment status updated successfully",
		"status":  req.Status,
	})
}
