package handlers

import (
	"mitsui-jpy-quiz/internal/database"
	"mitsui-jpy-quiz/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type QuizPackageHandler struct{}

func NewQuizPackageHandler() *QuizPackageHandler {
	return &QuizPackageHandler{}
}

// Create Quiz Package (Admin only)
func (h *QuizPackageHandler) CreateQuizPackage(c *gin.Context) {
	var quizPackage models.QuizPackage
	if err := c.ShouldBindJSON(&quizPackage); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify course exists
	var course models.Course
	if err := database.DB.First(&course, quizPackage.CourseID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Course not found"})
		return
	}

	if err := database.DB.Create(&quizPackage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create quiz package"})
		return
	}

	c.JSON(http.StatusCreated, quizPackage)
}

// Get Quiz Package by ID
func (h *QuizPackageHandler) GetQuizPackage(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var quizPackage models.QuizPackage
	if err := database.DB.Preload("Questions").First(&quizPackage, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz package not found"})
		return
	}

	c.JSON(http.StatusOK, quizPackage)
}

// Update Quiz Package (Admin only)
func (h *QuizPackageHandler) UpdateQuizPackage(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var quizPackage models.QuizPackage
	if err := database.DB.First(&quizPackage, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz package not found"})
		return
	}

	if err := c.ShouldBindJSON(&quizPackage); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Save(&quizPackage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update quiz package"})
		return
	}

	c.JSON(http.StatusOK, quizPackage)
}

// Delete Quiz Package (Admin only)
func (h *QuizPackageHandler) DeleteQuizPackage(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	if err := database.DB.Delete(&models.QuizPackage{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete quiz package"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiz package deleted successfully"})
}

// GetQuizPackageStats returns statistics for a quiz package
func (h *QuizPackageHandler) GetQuizPackageStats(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz package ID"})
		return
	}

	// Get all attempts for this quiz package
	var attempts []models.Attempt
	if err := database.DB.Where("quiz_package_id = ?", uint(id)).Find(&attempts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attempts"})
		return
	}

	// Calculate statistics
	totalAttempts := len(attempts)
	if totalAttempts == 0 {
		c.JSON(http.StatusOK, gin.H{
			"total_attempts":  0,
			"average_score":   0,
			"pass_rate":       0,
			"completion_rate": 0,
			"score_distribution": map[string]int{
				"excellent": 0,
				"good":      0,
				"average":   0,
				"poor":      0,
			},
			"recent_attempts": []map[string]interface{}{},
		})
		return
	}

	var totalScore, completedCount, passedCount int
	scoreDistribution := map[string]int{
		"excellent": 0, // 90-100%
		"good":      0, // 80-89%
		"average":   0, // 60-79%
		"poor":      0, // <60%
	}

	for _, attempt := range attempts {
		if string(attempt.Status) == "completed" {
			completedCount++
			totalScore += attempt.Score

			// Calculate percentage
			percentage := 0
			if attempt.TotalPoints > 0 {
				percentage = (attempt.Score * 100) / attempt.TotalPoints
			}

			// Categorize score
			if percentage >= 90 {
				scoreDistribution["excellent"]++
			} else if percentage >= 80 {
				scoreDistribution["good"]++
			} else if percentage >= 60 {
				scoreDistribution["average"]++
			} else {
				scoreDistribution["poor"]++
			}

			// Check if passed (60% or more)
			if percentage >= 60 {
				passedCount++
			}
		}
	}

	// Calculate averages and rates
	averageScore := 0
	if completedCount > 0 {
		averageScore = totalScore / completedCount
	}

	passRate := 0
	if completedCount > 0 {
		passRate = (passedCount * 100) / completedCount
	}

	completionRate := (completedCount * 100) / totalAttempts

	// Get recent attempts
	var recentAttempts []models.Attempt
	database.DB.Where("quiz_package_id = ?", uint(id)).
		Order("created_at DESC").
		Limit(10).
		Find(&recentAttempts)

	// Build recent attempts data with student names
	recentAttemptsData := []map[string]interface{}{}
	for _, attempt := range recentAttempts {
		// Get student name
		var student models.User
		studentName := "Unknown"
		if err := database.DB.First(&student, attempt.StudentID).Error; err == nil {
			studentName = student.Name
		}

		percentage := 0
		if attempt.TotalPoints > 0 {
			percentage = (attempt.Score * 100) / attempt.TotalPoints
		}

		completedAt := ""
		if attempt.EndTime != nil {
			completedAt = attempt.EndTime.Format("2006-01-02 15:04")
		}

		recentAttemptsData = append(recentAttemptsData, map[string]interface{}{
			"student_name": studentName,
			"score":        attempt.Score,
			"total_score":  attempt.TotalPoints,
			"percentage":   percentage,
			"completed_at": completedAt,
			"status":       string(attempt.Status),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"total_attempts":     totalAttempts,
		"average_score":      averageScore,
		"pass_rate":          passRate,
		"completion_rate":    completionRate,
		"score_distribution": scoreDistribution,
		"recent_attempts":    recentAttemptsData,
	})
}
