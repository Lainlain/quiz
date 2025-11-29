# Copilot Instructions - Mitsui JPY Language School Quiz API

## Project Overview

A comprehensive quiz examination system for Mitsui JPY Language School with **dual frontends**: 
1. **Web application** (HTML/CSS/JS) for public quiz taking and admin management
2. **Android mobile app** (Kotlin/Jetpack Compose) for student quiz access
3. **REST API backend** (Go/Gin) serving both frontends

## Architecture

### Multi-Platform Architecture
```
Web Frontend (public quiz + admin) ──┐
                                    ├── REST API (Go/Gin) ── SQLite Database
Android Mobile App (Kotlin) ────────┘
```

### Three-Layer Backend
1. **Handlers** (`internal/handlers/`) - HTTP handlers + business logic + web template serving
2. **Models** (`internal/models/`) - GORM models with phone number validation and device tracking  
3. **Middleware** (`internal/middleware/`) - JWT auth + CORS for mobile app

### Key Design Decisions
- **Dual auth modes**: JWT for mobile app, session-based for web admin dashboard
- **Device fingerprinting**: SHA-256 hashed device ID prevents multiple attempts per device
- **Public quiz access**: No authentication required for quiz taking (guest users auto-created)
- **Phone number verification**: Required field prevents duplicate registrations across devices
- **Image uploads**: File upload system for question images with validation

## Development Workflow

### Backend Development
```bash
# Install dependencies
go mod download

# Create admin user (first time only)
go run cmd/create-admin/main.go

# Run the server (serves both API and web templates)
go run cmd/server/main.go

# Build binary
go build -o bin/quiz-server cmd/server/main.go

# Test admin login specifically
go run cmd/test-admin-login/main.go

# Run integration tests
./test-quiz-submit.sh
./test-create-attempt.sh
```

### Mobile App Development
```bash
# Navigate to mobile app
cd mobile_app

# Build using Gradle
./gradlew assembleDebug

# Run tests
./gradlew test

# Install on device/emulator via Android Studio
# or use build.sh script
```

### Environment Setup
Copy `.env.example` to `.env` and configure:
- `SERVER_PORT` (default: 8080)
- `DATABASE_URL` (default: quiz.db)
- `JWT_SECRET` (MUST change in production)
- `JWT_EXPIRE_HOURS` (default: 24)

### Key URLs
- Admin Dashboard: `http://localhost:8080/admin/dashboard`
- Public Quiz: `http://localhost:8080/quiz?package=1` 
- Course Registration: `http://localhost:8080/register/1`

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
- `mobile_app/` - Complete Android app (Kotlin + Jetpack Compose)

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
- `POST /quiz/submit` - Public quiz submission (no auth)
- `GET /quiz/check-device` - Device eligibility check
- `POST /register/course/:courseId` - Course registration with phone verification

### Admin Routes (`/api/admin/`) - Requires JWT + admin role
- Courses: `POST /courses`, `PUT /courses/:id`, `DELETE /courses/:id`, `GET /courses/:id/stats`
- Quiz Packages: `POST /quiz-packages`, `PUT /quiz-packages/:id`, `DELETE /quiz-packages/:id`
- Questions: `POST /questions`, `PUT /questions/:id`, `DELETE /questions/:id`
- Images: `POST /upload-image` - Question image uploads

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

### Device Restriction
Device fingerprinting prevents multiple attempts:
```javascript
// Generates SHA-256 hash from screen, timezone, canvas, WebGL, etc.
const deviceId = await generateDeviceFingerprint();
```
Backend stores `device_id` in attempts table and enforces 3-attempt limit per device+quiz combination.

### Retry Logic
Before creating attempt, handler counts existing attempts:
```go
database.DB.Model(&models.Attempt{}).Where(
  "student_id = ? AND course_id = ? AND quiz_package_id = ?",
  studentID, req.CourseID, req.QuizPackageID,
).Count(&attemptCount)

if int(attemptCount) >= course.RetryCount {
  return error "Maximum retry count reached"
}
```

### Phone Number Validation
Users table requires unique phone numbers:
```go
PhoneNumber string `gorm:"type:varchar(20);unique;not null" json:"phone_number"`
```
Registration checks phone uniqueness across devices and prevents duplicate course registrations.

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

### Migration
Auto-migration runs on server startup via `database.Migrate()` in `cmd/server/main.go`.

### Initial Admin User
Run `go run cmd/create-admin/main.go` to create:
- Email: `admin@mitsui-jpy.com`
- Password: `admin123` (change in production!)

### Database File
SQLite file: `quiz.db` (gitignored). To reset: delete `quiz.db` and restart server.

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
  -d '{"email":"admin@mitsui-jpy.com","password":"admin123"}'

# 2. Create course (use token from step 1)
curl -X POST http://localhost:8080/api/admin/courses \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"N5 Japanese","student_limit":50,"retry_count":3,"exam_time":60}'
```

Full examples in `README.md`.

---

**Last Updated**: 2025-11-29
