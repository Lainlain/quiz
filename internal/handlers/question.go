package handlers

import (
	"mitsui-jpy-quiz/internal/database"
	"mitsui-jpy-quiz/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type QuestionHandler struct{}

func NewQuestionHandler() *QuestionHandler {
	return &QuestionHandler{}
}

// Create Question (Admin only)
func (h *QuestionHandler) CreateQuestion(c *gin.Context) {
	var question models.Question
	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify quiz package exists
	var quizPackage models.QuizPackage
	if err := database.DB.First(&quizPackage, question.QuizPackageID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Quiz package not found"})
		return
	}

	if err := database.DB.Create(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question"})
		return
	}

	c.JSON(http.StatusCreated, question)
}

// Get Questions by Quiz Package ID
func (h *QuestionHandler) GetQuestionsByPackage(c *gin.Context) {
	packageID, _ := strconv.Atoi(c.Param("packageId"))

	var questions []models.Question
	if err := database.DB.Where("quiz_package_id = ? AND is_active = ?", packageID, true).
		Order("order_number ASC").
		Find(&questions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch questions"})
		return
	}

	c.JSON(http.StatusOK, questions)
}

// Update Question (Admin only)
func (h *QuestionHandler) UpdateQuestion(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var question models.Question
	if err := database.DB.First(&question, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Question not found"})
		return
	}

	if err := c.ShouldBindJSON(&question); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Save(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update question"})
		return
	}

	c.JSON(http.StatusOK, question)
}

// Delete Question (Admin only)
func (h *QuestionHandler) DeleteQuestion(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	if err := database.DB.Delete(&models.Question{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Question deleted successfully"})
}
