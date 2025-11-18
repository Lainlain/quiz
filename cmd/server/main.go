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
	router.GET("/register/:courseId", webHandler.RegisterPage)

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
		
		// Public course registration
		public.POST("/register/course/:courseId", authHandler.RegisterForCourse)
		public.GET("/register/check/:courseId", authHandler.CheckRegistrationStatus)

		// Public quiz data endpoints (for public quiz page and dashboard)
		public.GET("/student/courses", courseHandler.GetCourses)
		public.GET("/student/courses/:id", courseHandler.GetCourse)
		public.GET("/student/quiz-packages/:id", quizPackageHandler.GetQuizPackage)
		public.GET("/student/questions/package/:packageId", questionHandler.GetQuestionsByPackage)

		// Public quiz submission (no auth required)
		public.POST("/quiz/submit", studentHandler.SubmitPublicQuiz)
		public.GET("/quiz/check-device", studentHandler.CheckDeviceEligibility)
		public.GET("/quiz/check-phone", authHandler.CheckPhoneNumberForQuiz)
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

		// Student management
		admin.GET("/students", studentHandler.ListStudents)
		admin.GET("/students/courses", studentHandler.GetCoursesWithStudentCount)
		admin.GET("/students/course/:courseId", studentHandler.GetStudentsByCourse)
		admin.DELETE("/students/:id", studentHandler.DeleteStudent)
		
		// Enrollment management
		admin.GET("/enrollments/course/:courseId", studentHandler.GetEnrollmentsByCourse)
		admin.PUT("/enrollments/:enrollmentId/status", studentHandler.UpdateEnrollmentStatus)
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
