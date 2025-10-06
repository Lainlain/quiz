package main

import (
	"log"
	"mitsui-jpy-quiz/config"
	"mitsui-jpy-quiz/internal/database"
	"mitsui-jpy-quiz/internal/handlers"
	"mitsui-jpy-quiz/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Initialize Gin router
	router := gin.Default()

	// Load HTML templates
	router.LoadHTMLGlob("web/templates/**/*.html")

	// Serve static files
	router.Static("/static", "./web/static")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg)
	courseHandler := handlers.NewCourseHandler()
	quizPackageHandler := handlers.NewQuizPackageHandler()
	questionHandler := handlers.NewQuestionHandler()
	studentHandler := handlers.NewStudentHandler()
	webHandler := handlers.NewWebHandler()

	// Web routes (HTML pages)
	router.GET("/admin/login", webHandler.AdminLoginPage)
	router.GET("/admin/dashboard", webHandler.AdminDashboardPage)
	router.GET("/admin", func(c *gin.Context) {
		c.Redirect(302, "/admin/login")
	})

	// Public quiz route
	router.GET("/quiz", webHandler.QuizPage)

	router.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/admin/login")
	})

	// Public routes
	public := router.Group("/api")
	{
		public.POST("/auth/admin/login", authHandler.AdminLogin)
		public.POST("/auth/student/login", authHandler.StudentLogin)
		public.POST("/auth/student/register", authHandler.StudentRegister)

		// Public quiz data endpoints (for public quiz page and dashboard)
		public.GET("/student/courses", courseHandler.GetCourses)
		public.GET("/student/courses/:id", courseHandler.GetCourse)
		public.GET("/student/quiz-packages/:id", quizPackageHandler.GetQuizPackage)
		public.GET("/student/questions/package/:packageId", questionHandler.GetQuestionsByPackage)

		// Public quiz submission (no auth required)
		public.POST("/quiz/submit", studentHandler.SubmitPublicQuiz)
		public.GET("/quiz/check-device", studentHandler.CheckDeviceEligibility)
	}

	// Admin routes (requires auth + admin role)
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware(cfg), middleware.AdminOnly())
	{
		// Course management
		admin.POST("/courses", courseHandler.CreateCourse)
		admin.PUT("/courses/:id", courseHandler.UpdateCourse)
		admin.DELETE("/courses/:id", courseHandler.DeleteCourse)
		admin.GET("/courses/:id/stats", courseHandler.GetCourseStats)

		// Quiz package management
		admin.POST("/quiz-packages", quizPackageHandler.CreateQuizPackage)
		admin.PUT("/quiz-packages/:id", quizPackageHandler.UpdateQuizPackage)
		admin.DELETE("/quiz-packages/:id", quizPackageHandler.DeleteQuizPackage)
		admin.GET("/quiz-packages/:id/stats", quizPackageHandler.GetQuizPackageStats)

		// Question management
		admin.POST("/questions", questionHandler.CreateQuestion)
		admin.PUT("/questions/:id", questionHandler.UpdateQuestion)
		admin.DELETE("/questions/:id", questionHandler.DeleteQuestion)
	}

	// Student routes (requires auth)
	student := router.Group("/api/student")
	student.Use(middleware.AuthMiddleware(cfg))
	{
		// Quiz attempt management
		student.POST("/quiz/start", studentHandler.StartQuiz)
		student.POST("/quiz/answer", studentHandler.SubmitAnswer)
		student.POST("/quiz/complete/:attemptId", studentHandler.CompleteQuiz)
		student.GET("/attempts", studentHandler.GetMyAttempts)
		student.GET("/attempts/:attemptId", studentHandler.GetAttemptDetail)
	}

	// Start server
	log.Printf("Server starting on port %s", cfg.ServerPort)
	if err := router.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
