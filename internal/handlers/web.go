package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type WebHandler struct{}

func NewWebHandler() *WebHandler {
	return &WebHandler{}
}

// Admin Login Page
func (h *WebHandler) AdminLoginPage(c *gin.Context) {
	c.HTML(http.StatusOK, "login.html", gin.H{
		"Title": "Admin Login",
	})
}

// Admin Dashboard Page
func (h *WebHandler) AdminDashboardPage(c *gin.Context) {
	c.HTML(http.StatusOK, "dashboard.html", gin.H{
		"Title": "Dashboard",
	})
}

// Admin Package Statistics Page
func (h *WebHandler) PackageStatsPage(c *gin.Context) {
	c.HTML(http.StatusOK, "package-stats.html", gin.H{
		"Title": "Quiz Package Statistics",
	})
}

// Public Quiz Page
func (h *WebHandler) QuizPage(c *gin.Context) {
	c.HTML(http.StatusOK, "quiz.html", gin.H{
		"Title": "Quiz Exam",
	})
}

// Public Course Registration Page
func (h *WebHandler) RegisterPage(c *gin.Context) {
	c.HTML(http.StatusOK, "register.html", gin.H{
		"Title": "Course Registration",
	})
}
