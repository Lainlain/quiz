# Copilot Instructions - Mitsuki JPY Language School Quiz API

## Project Overview

A comprehensive quiz examination system for Mitsuki JPY Language School with **hybrid web + REST API architecture**:
1. **Public quiz interface** (Alpine.js + Tailwind CSS) - dual-mode quiz taking with device/phone verification
2. **Admin dashboard** (vanilla JS + Tailwind CSS) - course/question management + enrollment approval via REST API
3. **Course registration system** - phone-based enrollment with admin approval workflow
4. **REST API backend** (Go/Gin/GORM) - SQLite database with auto-migration

### Dual Quiz Modes
The system supports **two distinct quiz-taking flows**:
- **Guest Mode**: Anyone can take quiz with device fingerprinting (3 attempts per device limit)
- **Registered Mode**: Requires phone number + admin-approved enrollment + tracks unlimited retakes per quiz package's `MaxRetakeCount`

## Architecture

### Hybrid Architecture Pattern
```
┌─ Public Quiz (Alpine.js) ──────────┐
│  - Device fingerprinting           │
│  - Phone verification              │──┐
│  - LocalStorage + Cookie tracking  │  │
├─ Admin Dashboard (Vanilla JS) ─────┤  ├─► REST API (Go/Gin) ─► SQLite DB
│  - JWT-authenticated API calls     │  │
│  - Real-time stats updates         │  │
├─ Course Registration Forms ────────┤──┘
│  - Phone uniqueness validation     │
│  - Enrollment status tracking      │
└─────────────────────────────────────┘
```

### Backend Layer Architecture
1. **Handlers** (`internal/handlers/`) - HTTP handlers combining business logic + template serving
   - `student.go` handles both authenticated quiz flow AND public quiz submission
   - `web.go` serves HTML templates with embedded data (not pure REST)
   - `auth.go` manages JWT tokens + phone-based registration/login
2. **Models** (`internal/models/`) - GORM models with rich validation
   - `User.PhoneNumber` has `unique` constraint enforced at database level
   - `Enrollment` tracks pending/approved/declined registration status
   - `Attempt.DeviceID` stores SHA-256 fingerprint for device restriction
3. **Middleware** (`internal/middleware/`) - Gin middleware chain
   - `AuthMiddleware(cfg)` validates JWT tokens, sets `user_id` and `user_role` in context
   - `AdminOnly()` checks role from context, must be chained after AuthMiddleware

### Critical Design Decisions
- **Dual authentication modes**: 
  - Admin/Student API routes use JWT (`Authorization: Bearer <token>`)
  - Public quiz routes are unauthenticated OR phone-verified (no JWT required)
- **Dual quiz submission modes**:
  - **`/quiz/submit`** - Guest users (creates user on-the-fly, device-restricted, 3 attempts max)
  - **`/student/quiz/submit-registered`** - Registered students (requires phone verification + approved enrollment)
- **Device fingerprinting**: Client-side SHA-256 hash from screen/canvas/WebGL, backend enforces **3 attempts per device** per quiz package (guest mode only)
- **Phone-based identity**: `User.PhoneNumber` is unique across system, used for:
  - Registration (one phone = one account)
  - Quiz access verification (checks enrollment status: pending/approved/declined)
  - Cross-course enrollment (same phone can enroll in multiple courses)
- **Enrollment workflow**: 
  - Registration creates `Enrollment` with `pending` status
  - Admin approves/declines via `/api/admin/enrollments/:enrollmentId/status`
  - Only `approved` status can take quizzes
- **Quiz package retakes**: Each `QuizPackage` has `MaxRetakeCount` field (NOT course-level), enforced in `StartQuiz` handler
- **Image uploads**: Stored as `{timestamp}_{original_name}` in `web/uploads/questions/`, max 5MB, validated by MIME type
- **Auto-migration**: GORM AutoMigrate runs on every server startup in `database.Migrate()`

## Development Workflow

### First-Time Setup
```bash
# Install dependencies
go mod download

# Configure environment (REQUIRED before running)
cp .env.example .env
# Edit .env: set JWT_SECRET, SERVER_PORT, DATABASE_URL

# Create initial admin user (email: admin@mitsuki-jpy.com, pass: admin123)
go run cmd/create-admin/main.go

# Start server (runs migrations automatically)
go run cmd/server/main.go
```

### Daily Development Commands
```bash
# Run server (serves API + HTML templates on :8080)
go run cmd/server/main.go

# Build production binary
go build -o bin/quiz-server cmd/server/main.go

# Test authentication (verifies JWT flow)
go run cmd/test-admin-login/main.go

# Integration tests (requires running server)
./test-quiz-submit.sh       # Tests public quiz submission
./test-create-attempt.sh    # Tests authenticated attempt creation
```

### Frontend Structure (No Build Step Required)
- **Public quiz**: `web/templates/public/quiz.html` - Alpine.js reactive state in `quizApp()` function
- **Admin dashboard**: `web/templates/admin/dashboard.html` - vanilla JS with fetch API calls
- **Registration**: `web/templates/public/register.html` - phone validation + LocalStorage persistence
- **Static assets**: `web/static/js/`, `web/static/logo.jpg` served by Gin's `router.Static()`
- **Styling**: CDN-loaded Tailwind CSS (no build pipeline), mobile-first with `sm:` breakpoints

### Environment Variables (.env)
**Required:**
- `JWT_SECRET` - MUST change from default `your-secret-key-change-in-production`
- `DATABASE_URL` - SQLite file path (default: `quiz.db`)
- `SERVER_PORT` - Server port (default: `8080`)
- `JWT_EXPIRE_HOURS` - Token expiration (default: `24`)

### Key Application URLs
- Root: `http://localhost:8080/` → redirects to admin login
- Admin login: `http://localhost:8080/admin/login`
- Admin dashboard: `http://localhost:8080/admin/dashboard` (requires JWT)
- Public quiz: `http://localhost:8080/quiz?package=<ID>` (no auth)
- Course registration: `http://localhost:8080/register/<courseID>` (no auth)

## Project Structure Conventions

### Directory Layout
- `cmd/` - Application entry points (`server/main.go`, `create-admin/main.go`, `test-admin-login/main.go`)
- `internal/` - Private application code (cannot be imported by other projects)
  - `handlers/` - HTTP handlers for each domain (auth, course, student, web templates, image uploads)
  - `models/` - Database models with GORM tags (includes phone_number field)
  - `middleware/` - Gin middleware (AuthMiddleware, AdminOnly)
  - `database/` - Database connection and migration logic
- `pkg/` - Reusable utility packages (jwt, password hashing)
- `config/` - Configuration loading from environment
- `web/` - Frontend assets and templates
  - `templates/` - HTML templates for admin dashboard and public quiz
  - `static/` - CSS, JS, images
  - `uploads/` - File uploads (question images)

### Model Relationships
```
Course 1→N QuizPackage 1→N Question
User(Student) 1→N Attempt N→1 Course, QuizPackage
Attempt 1→N Answer N→1 Question
User.PhoneNumber → Unique constraint (prevents duplicate registrations)
Attempt.DeviceID → SHA-256 device fingerprint (prevents multiple attempts per device)
```

### Authentication Pattern
**Protected Routes (Admin/Student):**
```go
router.Use(middleware.AuthMiddleware(cfg))  // JWT validation
router.Use(middleware.AdminOnly())          // Admin role check (for admin routes)
```

**Public Routes (Quiz Taking):**
```go
// No auth middleware - guest users auto-created
public.POST("/quiz/submit", studentHandler.SubmitPublicQuiz)
public.GET("/quiz/check-device", studentHandler.CheckDeviceEligibility)
```

Token is passed via: `Authorization: Bearer <JWT_TOKEN>`

## API Endpoint Patterns

### Public Routes (`/api/`)
- `POST /auth/admin/login` - Admin login
- `POST /auth/student/login` - Student login  
- `POST /auth/student/register` - Student registration
- `POST /quiz/submit` - Guest quiz submission (no auth, device-restricted)
- `POST /student/quiz/submit-registered` - Registered student quiz submission (phone-verified)
- `GET /quiz/check-device` - Device eligibility check (deprecated, guest mode only)
- `GET /quiz/check-phone` - Phone verification + enrollment status check
- `POST /register/course/:courseId` - Course registration with phone verification
- `GET /register/check/:courseId` - Check registration status by phone

### Admin Routes (`/api/admin/`) - Requires JWT + admin role
- Courses: `POST /courses`, `PUT /courses/:id`, `DELETE /courses/:id`, `GET /courses/:id/stats`
- Quiz Packages: `POST /quiz-packages`, `PUT /quiz-packages/:id`, `DELETE /quiz-packages/:id`, `GET /quiz-packages/:id/stats`
- Questions: `POST /questions`, `PUT /questions/:id`, `DELETE /questions/:id`
- Images: `POST /upload/image`, `DELETE /upload/image/:filename` - Question image uploads
- Students: `GET /students`, `GET /students/courses`, `GET /students/course/:courseId`, `DELETE /students/:id`
- Enrollments: `GET /enrollments/course/:courseId`, `PUT /enrollments/:enrollmentId/status`

### Student Routes (`/api/student/`) - Requires JWT
- Browse: `GET /courses`, `GET /courses/:id`, `GET /quiz-packages/:id`
- Quiz: `POST /quiz/start`, `POST /quiz/answer`, `POST /quiz/complete/:attemptId`
- History: `GET /attempts`, `GET /attempts/:attemptId`

### Web Routes (HTML Templates)
- `/admin/login` - Admin login page
- `/admin/dashboard` - Admin management interface
- `/quiz?package=X` - Public quiz taking interface
- `/register/:courseId` - Course registration form

## Key Implementation Details

### Course Configuration
Each course has three critical settings:
- `student_limit`: Max students enrolled
- `retry_count`: How many times a student can retake quizzes (enforced in `StartQuiz`)
- `exam_time`: Duration in minutes (returned to client for timer)

### Quiz Flow
1. **Start**: `POST /student/quiz/start` creates `Attempt` record, returns questions
2. **Answer**: `POST /student/quiz/answer` saves/updates `Answer` records
3. **Complete**: `POST /student/quiz/complete/:attemptId` calculates score, sets status to completed

### Public Quiz Flow (No Auth)
1. **Load**: `GET /quiz?package=X` loads quiz with device fingerprinting
2. **Check**: `GET /quiz/check-device` validates device hasn't taken quiz (3 attempt limit)
3. **Submit**: `POST /quiz/submit` creates guest user and attempt record

### Device Restriction (3 Attempts Per Device)
**Client-side** (`web/static/js/quiz.js`):
```javascript
// generateDeviceFingerprint() combines: screen, timezone, canvas, WebGL, CPU cores
const deviceId = await generateDeviceFingerprint(); // Returns SHA-256 hash

// Check device eligibility BEFORE quiz loads
GET /api/quiz/check-device?quiz_package_id=X&device_id=Y
// Response: {"already_taken": true, "attempts": 3} blocks quiz UI
```

**Server-side** (`internal/handlers/student.go`):
```go
// CheckDeviceEligibility() enforces 3-attempt limit per device+quiz
var count int64
database.DB.Model(&models.Attempt{}).Where(
  "quiz_package_id = ? AND device_id = ? AND status = ?",
  quizPackageID, deviceID, models.StatusCompleted,
).Count(&count)

if count >= 3 {
  return gin.H{"already_taken": true, "attempts": count}
}
```

### Retry Logic (QuizPackage.MaxRetakeCount)
**IMPORTANT**: Retry count is stored at **QuizPackage level**, NOT course level.
```go
// StartQuiz() checks attempts against quiz package's MaxRetakeCount
var quizPackage models.QuizPackage
database.DB.First(&quizPackage, req.QuizPackageID)

var attemptCount int64
database.DB.Model(&models.Attempt{}).Where(
  "student_id = ? AND quiz_package_id = ?",
  studentID, req.QuizPackageID,
).Count(&attemptCount)

maxRetakes := quizPackage.MaxRetakeCount // NOT course.RetryCount
if maxRetakes == 0 { maxRetakes = 1 }    // Default fallback

if int(attemptCount) >= maxRetakes {
  return error "Maximum retake limit reached"
}
```

### Phone Number Validation (Unique Identifier System)
**Database constraint** (`internal/models/user.go`):
```go
PhoneNumber string `gorm:"type:varchar(20);unique;not null" json:"phone_number"`
```

**Registration flow** (`internal/handlers/auth.go`):
```go
// RegisterForCourse() handles both new users and existing users:
// 1. Check if user exists with phone number
var existingUser models.User
result := database.DB.Where("phone_number = ?", req.PhoneNumber).First(&existingUser)

if result.Error == nil {
  // User exists - check if already enrolled in THIS course
  var enrollment models.Enrollment
  database.DB.Where("student_id = ? AND course_id = ?", existingUser.ID, courseID).First(&enrollment)
  
  if enrollment.ID != 0 {
    return error "Phone number already registered for this course"
  }
  // Create new enrollment for existing user
} else {
  // New user - create user + enrollment
}
```

**Client-side persistence** (`web/templates/public/register.html`):
```javascript
// Stores phone in LocalStorage + Cookie after successful registration
localStorage.setItem(`registration_phone_${courseId}`, phoneNumber);
document.cookie = `registration_phone_${courseId}=${phoneNumber}; max-age=2592000`; // 30 days

// On page load, checks registration status
GET /api/register/check/:courseId?phone_number=xxx
// Shows "Waiting for Approval" if enrollment.status == "pending"
```

### Image Upload System
Questions support image attachments via `POST /admin/upload-image`:
- Max 5MB file size
- Validates image formats (JPEG, PNG, GIF, WebP)
- Saves to `web/uploads/questions/` with timestamp prefix
- Returns image URL for question association

### Password Security
- Passwords hashed with bcrypt (cost: 10)
- Helper functions: `utils.HashPassword()`, `utils.CheckPasswordHash()`

### JWT Claims Structure
```go
type JWTClaims struct {
  UserID uint
  Email  string
  Role   string  // "admin" or "student"
  jwt.RegisteredClaims
}
```

## Database

### Auto-Migration System
**Location**: `internal/database/database.go`
```go
func Migrate() error {
  return DB.AutoMigrate(
    &models.User{},
    &models.Course{},
    &models.QuizPackage{},
    &models.Question{},
    &models.Attempt{},
    &models.Answer{},
    &models.Enrollment{}, // Tracks registration approval workflow
  )
}
```
**Runs automatically** on every server startup in `cmd/server/main.go` - no manual migration commands needed.

### Model Relationships
```
Course 1→N QuizPackage 1→N Question
User(Student) 1→N Attempt N→1 Course, QuizPackage
Attempt 1→N Answer N→1 Question
User 1→N Enrollment N→1 Course
```

### Initial Admin User
Run `go run cmd/create-admin/main.go` to create:
- Email: `admin@mitsuki-jpy.com`
- Password: `admin123` (change in production!)
- Role: `admin`

### Database File
- SQLite file: `quiz.db` (gitignored)
- To reset: `rm quiz.db && go run cmd/server/main.go` (auto-migrates fresh schema)
- Location configured via `DATABASE_URL` in `.env`

## Common Tasks

### Adding a New Endpoint
1. Add handler method in `internal/handlers/<domain>.go`
2. Register route in `cmd/server/main.go` under appropriate group (public/admin/student)
3. Apply middleware if authentication/authorization needed

### Adding a New Model Field
1. Update model in `internal/models/<model>.go`
2. Restart server (GORM auto-migrates schema changes)
3. Update relevant handlers if field requires validation/processing

### Changing JWT Expiration
Set `JWT_EXPIRE_HOURS` in `.env` file (in hours).

## Testing Tips

Use `curl` or Postman to test endpoints. Example workflow:
```bash
# 1. Admin login
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mitsuki-jpy.com","password":"admin123"}'

# 2. Create course (use token from step 1)
curl -X POST http://localhost:8080/api/admin/courses \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"N5 Japanese","student_limit":50,"retry_count":3,"exam_time":60}'
```

Full examples in `README.md`.

## Common Pitfalls & Important Notes

### 1. Retry Count Location
❌ **WRONG**: Looking for `Course.RetryCount`
✅ **CORRECT**: Use `QuizPackage.MaxRetakeCount` (each quiz package has its own retry limit)

### 2. Device Restriction Scope (Guest Mode Only)
- Limit is **3 attempts per device PER quiz package** (not per course)
- Counted only for `status = "completed"` attempts
- Device ID is SHA-256 hash (64 chars), stored in `Attempt.DeviceID`
- **Does NOT apply to registered students** - they follow `MaxRetakeCount` instead

### 3. Phone Number Uniqueness
- Phone is globally unique in `users` table (one account across all courses)
- Same phone can enroll in MULTIPLE courses (creates multiple `Enrollment` records)
- Registration creates `Enrollment` with `pending` status, not immediate access

### 4. Two Quiz Submission Flows
❌ **WRONG**: Using `/quiz/submit` for registered students
✅ **CORRECT**: 
- Guest users → `/quiz/submit` (device-based, 3 attempts)
- Registered students → `/student/quiz/submit-registered` (phone-based, MaxRetakeCount attempts)

### 4. Authentication Context
When using `AuthMiddleware`, access user info in handlers:
```go
userID, _ := c.Get("user_id")    // Returns uint
userRole, _ := c.Get("user_role") // Returns string ("admin" or "student")
```

### 5. Frontend State Management
- Alpine.js uses **`x-data="quizApp()"`** pattern, not Vue-style SFC
- State mutations must be done through Alpine methods (e.g., `this.currentScreen = 'results'`)
- No build step required - all JS/CSS loaded via CDN

### 6. Image Upload Path
- Upload endpoint: `POST /api/admin/upload/image`
- Files saved to: `web/uploads/questions/{timestamp}_{originalname}`
- Served via: `http://localhost:8080/uploads/questions/{filename}`
- Max size: 5MB, validated by MIME type

### 7. Enrollment Approval Workflow
- New registrations create `Enrollment` with `status = "pending"`
- Admin must approve via dashboard or API: `PUT /api/admin/enrollments/:enrollmentId/status`
- Status values: `pending`, `approved`, `declined`
- Only `approved` students can take quizzes in registered mode

---

**Last Updated**: 2025-12-10
