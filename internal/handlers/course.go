package handlers

import (
	"mitsui-jpy-quiz/internal/database"
	"mitsui-jpy-quiz/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CourseHandler struct{}

func NewCourseHandler() *CourseHandler {
	return &CourseHandler{}
}

// Create Course (Admin only)
func (h *CourseHandler) CreateCourse(c *gin.Context) {
	var course models.Course
	if err := c.ShouldBindJSON(&course); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course"})
		return
	}

	c.JSON(http.StatusCreated, course)
}

// Get All Courses
func (h *CourseHandler) GetCourses(c *gin.Context) {
	var courses []models.Course
	if err := database.DB.Preload("QuizPackages").Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch courses"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

// Get Course by ID
func (h *CourseHandler) GetCourse(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var course models.Course
	if err := database.DB.Preload("QuizPackages.Questions").First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	c.JSON(http.StatusOK, course)
}

// Update Course (Admin only)
func (h *CourseHandler) UpdateCourse(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var course models.Course
	if err := database.DB.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	if err := c.ShouldBindJSON(&course); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Save(&course).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update course"})
		return
	}

	c.JSON(http.StatusOK, course)
}

// Delete Course (Admin only)
func (h *CourseHandler) DeleteCourse(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	if err := database.DB.Delete(&models.Course{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete course"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Course deleted successfully"})
}

// Get Course Statistics (Admin only)
func (h *CourseHandler) GetCourseStats(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var course models.Course
	if err := database.DB.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	// Count total unique students (by device_id and student_id)
	var totalAttempts int64
	var uniqueStudents int64

	database.DB.Model(&models.Attempt{}).Where("course_id = ?", id).Count(&totalAttempts)

	// Count unique students by device_id (for public quiz takers)
	database.DB.Model(&models.Attempt{}).
		Where("course_id = ? AND device_id != ''", id).
		Distinct("device_id").
		Count(&uniqueStudents)

	// Get list of students with their attempts
	type StudentAttempt struct {
		StudentName  string `json:"student_name"`
		DeviceID     string `json:"device_id"`
		AttemptCount int    `json:"attempt_count"`
		BestScore    int    `json:"best_score"`
		TotalPoints  int    `json:"total_points"`
		LastAttempt  string `json:"last_attempt"`
	}

	var studentAttempts []StudentAttempt
	database.DB.Raw(`
		SELECT 
			u.name as student_name,
			a.device_id,
			COUNT(a.id) as attempt_count,
			MAX(a.score) as best_score,
			MAX(a.total_points) as total_points,
			MAX(a.created_at) as last_attempt
		FROM attempts a
		JOIN users u ON a.student_id = u.id
		WHERE a.course_id = ?
		GROUP BY u.name, a.device_id
		ORDER BY last_attempt DESC
	`, id).Scan(&studentAttempts)

	c.JSON(http.StatusOK, gin.H{
		"course_id":        course.ID,
		"course_title":     course.Title,
		"total_attempts":   totalAttempts,
		"unique_students":  uniqueStudents,
		"student_attempts": studentAttempts,
	})
}
