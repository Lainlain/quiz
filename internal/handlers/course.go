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
