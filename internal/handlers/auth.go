package handlers

import (
	"fmt"
	"mitsuki-jpy-quiz/config"
	"mitsuki-jpy-quiz/internal/database"
	"mitsuki-jpy-quiz/internal/models"
	"mitsuki-jpy-quiz/pkg/utils"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	Config *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{Config: cfg}
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
}

// Admin Login
func (h *AuthHandler) AdminLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ? AND role = ?", req.Email, models.RoleAdmin).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Email, string(user.Role), h.Config.JWTSecret, h.Config.JWTExpireHours)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
			"role":  user.Role,
		},
	})
}

// Student Login
func (h *AuthHandler) StudentLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ? AND role = ?", req.Email, models.RoleStudent).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Email, string(user.Role), h.Config.JWTSecret, h.Config.JWTExpireHours)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
			"role":  user.Role,
		},
	})
}

// Student Register
func (h *AuthHandler) StudentRegister(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Email:    req.Email,
		Password: hashedPassword,
		Name:     req.Name,
		Role:     models.RoleStudent,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Email, string(user.Role), h.Config.JWTSecret, h.Config.JWTExpireHours)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.Name,
			"role":  user.Role,
		},
	})
}

// CourseRegistrationRequest for public course registration
type CourseRegistrationRequest struct {
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	PhoneNumber string `json:"phone_number" binding:"required"`
	Address     string `json:"address" binding:"required"`
	FacebookURL string `json:"facebook_url"` // Optional
	Password    string `json:"password"`     // Optional - will be auto-generated if not provided
}

// RegisterForCourse - Public endpoint for course registration
func (h *AuthHandler) RegisterForCourse(c *gin.Context) {
	courseID := c.Param("courseId")

	var req CourseRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if course exists
	var course models.Course
	if err := database.DB.First(&course, courseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	// Check if phone number already exists (phone number is unique identifier)
	var existingUserByPhone models.User
	if err := database.DB.Where("phone_number = ?", req.PhoneNumber).First(&existingUserByPhone).Error; err == nil {
		// User with this phone number exists, check if already enrolled
		var existingEnrollment models.Enrollment
		if err := database.DB.Where("student_id = ? AND course_id = ?", existingUserByPhone.ID, courseID).First(&existingEnrollment).Error; err == nil {
			// Check if declined - allow re-registration by updating existing enrollment
			if existingEnrollment.Status == models.EnrollmentDeclined {
				// Update declined enrollment to pending
				existingEnrollment.Status = models.EnrollmentPending
				if err := database.DB.Save(&existingEnrollment).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update registration"})
					return
				}

				c.JSON(http.StatusCreated, gin.H{
					"message": "Registration submitted successfully! Waiting for admin approval.",
					"status":  "pending",
				})
				return
			}

			// Already registered with pending or approved status
			c.JSON(http.StatusBadRequest, gin.H{
				"error":              "This phone number is already registered for this course",
				"already_registered": true,
				"status":             existingEnrollment.Status,
			})
			return
		}

		// User exists but not enrolled, create enrollment
		enrollment := models.Enrollment{
			StudentID: existingUserByPhone.ID,
			CourseID:  course.ID,
			Status:    models.EnrollmentPending,
		}

		if err := database.DB.Create(&enrollment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register for course"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message":            "Registration submitted successfully! Waiting for admin approval.",
			"status":             "pending",
			"already_registered": true,
		})
		return
	}

	// Check if email already exists (secondary check)
	var existingUserByEmail models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUserByEmail).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "This email is already registered. Please use a different email or contact admin.",
		})
		return
	}

	// Auto-generate password if not provided
	password := req.Password
	if password == "" {
		// Generate random password: email prefix + timestamp
		password = fmt.Sprintf("%s%d", req.Email[:strings.Index(req.Email, "@")], time.Now().Unix())
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process registration"})
		return
	}

	// Create new user
	user := models.User{
		Email:       req.Email,
		Password:    hashedPassword,
		Name:        req.Name,
		PhoneNumber: req.PhoneNumber,
		Address:     req.Address,
		FacebookURL: req.FacebookURL,
		Role:        models.RoleStudent,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account"})
		return
	}

	// Create enrollment with pending status
	enrollment := models.Enrollment{
		StudentID: user.ID,
		CourseID:  course.ID,
		Status:    models.EnrollmentPending,
	}

	if err := database.DB.Create(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register for course"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration submitted successfully! Waiting for admin approval.",
		"status":  "pending",
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
		},
	})
}

// CheckRegistrationStatus - Check if phone number is already registered for a course
func (h *AuthHandler) CheckRegistrationStatus(c *gin.Context) {
	courseID := c.Param("courseId")
	phoneNumber := c.Query("phone_number")

	if phoneNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number is required"})
		return
	}

	// Find user by phone number
	var user models.User
	if err := database.DB.Where("phone_number = ?", phoneNumber).First(&user).Error; err != nil {
		// Phone number not found
		c.JSON(http.StatusOK, gin.H{
			"registered": false,
			"message":    "Phone number not registered",
		})
		return
	}

	// Check if enrolled in this course
	var enrollment models.Enrollment
	if err := database.DB.Where("student_id = ? AND course_id = ?", user.ID, courseID).First(&enrollment).Error; err != nil {
		// User exists but not enrolled in this course
		c.JSON(http.StatusOK, gin.H{
			"registered": false,
			"message":    "Not registered for this course",
		})
		return
	}

	// If status is declined, treat as not registered (allow re-registration)
	if enrollment.Status == models.EnrollmentDeclined {
		c.JSON(http.StatusOK, gin.H{
			"registered": false,
			"message":    "Previous registration was declined. You can register again.",
		})
		return
	}

	// Get course info
	var course models.Course
	database.DB.First(&course, courseID)

	// User is enrolled (pending or approved)
	c.JSON(http.StatusOK, gin.H{
		"registered":  true,
		"status":      enrollment.Status,
		"name":        user.Name,
		"email":       user.Email,
		"course_name": course.Title,
		"enrolled_at": enrollment.CreatedAt,
	})
}

// CheckPhoneNumberForQuiz - Verify if phone number is approved to take quiz for a specific course
func (h *AuthHandler) CheckPhoneNumberForQuiz(c *gin.Context) {
	courseID := c.Query("course_id")
	phoneNumber := c.Query("phone_number")
	quizPackageID := c.Query("quiz_package_id")

	if phoneNumber == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number is required"})
		return
	}

	if courseID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Course ID is required"})
		return
	}

	// Find user by phone number
	var user models.User
	if err := database.DB.Where("phone_number = ?", phoneNumber).First(&user).Error; err != nil {
		// Phone number not found
		c.JSON(http.StatusOK, gin.H{
			"approved": false,
			"message":  "This phone number is not registered. Please register first.",
		})
		return
	}

	// Check if enrolled in this course
	var enrollment models.Enrollment
	if err := database.DB.Where("student_id = ? AND course_id = ?", user.ID, courseID).First(&enrollment).Error; err != nil {
		// User exists but not enrolled in this course
		c.JSON(http.StatusOK, gin.H{
			"approved": false,
			"message":  "You are not registered for this course. Please register first.",
		})
		return
	}

	// Check if enrollment is approved
	if enrollment.Status != models.EnrollmentApproved {
		if enrollment.Status == models.EnrollmentPending {
			c.JSON(http.StatusOK, gin.H{
				"approved": false,
				"message":  "Your registration is pending approval. Please wait for admin confirmation.",
			})
		} else if enrollment.Status == models.EnrollmentDeclined {
			c.JSON(http.StatusOK, gin.H{
				"approved": false,
				"message":  "Your registration was declined. Please contact the administrator.",
			})
		} else {
			c.JSON(http.StatusOK, gin.H{
				"approved": false,
				"message":  "Your registration is not approved yet.",
			})
		}
		return
	}

	// Check retake limit if quiz package ID is provided
	response := gin.H{
		"approved":     true,
		"student_id":   user.ID,
		"student_name": user.Name,
		"message":      "You are approved to take this quiz.",
	}

	if quizPackageID != "" {
		// Get quiz package to check max retake count
		var quizPackage models.QuizPackage
		if err := database.DB.First(&quizPackage, quizPackageID).Error; err == nil {
			// Count previous attempts for this student and quiz package
			var attemptCount int64
			database.DB.Model(&models.Attempt{}).Where(
				"student_id = ? AND course_id = ? AND quiz_package_id = ?",
				user.ID, courseID, quizPackageID,
			).Count(&attemptCount)

			maxRetakes := quizPackage.MaxRetakeCount
			if maxRetakes == 0 {
				maxRetakes = 1 // Default fallback
			}

			// Add retake information to response
			response["retake_info"] = gin.H{
				"current_attempts":   int(attemptCount),
				"max_retakes":        maxRetakes,
				"attempts_remaining": maxRetakes - int(attemptCount),
				"quiz_package_name":  quizPackage.Title,
			}

			// Check if retake limit exceeded
			if int(attemptCount) >= maxRetakes {
				response["approved"] = false
				response["retake_limit_reached"] = true
				response["message"] = "You have reached the maximum number of retakes for this quiz."
			} else if int(attemptCount) > 0 {
				remaining := maxRetakes - int(attemptCount)
				response["message"] = fmt.Sprintf("You have %d attempt(s) remaining for this quiz.", remaining)
			}
		}
	}

	c.JSON(http.StatusOK, response)
}
