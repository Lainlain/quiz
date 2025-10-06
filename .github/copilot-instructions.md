# Copilot Instructions - Mitsui JPY Language School Quiz API

## Project Overview

A RESTful API server for quiz examination system built for Mitsui JPY Language School. The system supports admin course management and student quiz-taking with JWT authentication, retry limits, and comprehensive attempt tracking.

## Architecture

### Three-Layer Architecture
1. **Handlers** (`internal/handlers/`) - HTTP request handlers and business logic
2. **Models** (`internal/models/`) - GORM database models with relationships
3. **Middleware** (`internal/middleware/`) - JWT authentication and authorization

### Data Flow
```
Client → Gin Router → Middleware (JWT Auth) → Handler → Database (GORM) → SQLite
```

### Key Design Decisions
- **JWT-based authentication**: Stateless auth with role-based access (admin/student)
- **GORM with SQLite**: Easy development; production-ready for PostgreSQL/MySQL swap
- **Attempt tracking**: Enforces retry limits per course, tracks timing and scoring
- **Gin framework**: Fast, minimal HTTP framework with built-in validation

## Development Workflow

```bash
# Install dependencies
go mod download

# Create admin user (first time only)
go run cmd/create-admin/main.go

# Run the server
go run cmd/server/main.go

# Build binary
go build -o bin/quiz-server cmd/server/main.go

# Run tests
go test ./...
```

### Environment Setup
Copy `.env.example` to `.env` and configure:
- `SERVER_PORT` (default: 8080)
- `DATABASE_URL` (default: quiz.db)
- `JWT_SECRET` (MUST change in production)
- `JWT_EXPIRE_HOURS` (default: 24)

## Project Structure Conventions

### Directory Layout
- `cmd/` - Application entry points (`server/main.go`, `create-admin/main.go`)
- `internal/` - Private application code (cannot be imported by other projects)
  - `handlers/` - HTTP handlers for each domain (auth, course, student, etc.)
  - `models/` - Database models with GORM tags
  - `middleware/` - Gin middleware (AuthMiddleware, AdminOnly)
  - `database/` - Database connection and migration logic
- `pkg/` - Reusable utility packages (jwt, password hashing)
- `config/` - Configuration loading from environment

### Model Relationships
```
Course 1→N QuizPackage 1→N Question
User(Student) 1→N Attempt N→1 Course, QuizPackage
Attempt 1→N Answer N→1 Question
```

### Authentication Pattern
All protected routes require:
```go
router.Use(middleware.AuthMiddleware(cfg))  // JWT validation
router.Use(middleware.AdminOnly())          // Admin role check (for admin routes)
```

Token is passed via: `Authorization: Bearer <JWT_TOKEN>`

## API Endpoint Patterns

### Public Routes (`/api/`)
- `POST /auth/admin/login` - Admin login
- `POST /auth/student/login` - Student login  
- `POST /auth/student/register` - Student registration

### Admin Routes (`/api/admin/`) - Requires JWT + admin role
- Courses: `POST /courses`, `PUT /courses/:id`, `DELETE /courses/:id`
- Quiz Packages: `POST /quiz-packages`, `PUT /quiz-packages/:id`, `DELETE /quiz-packages/:id`
- Questions: `POST /questions`, `PUT /questions/:id`, `DELETE /questions/:id`

### Student Routes (`/api/student/`) - Requires JWT
- Browse: `GET /courses`, `GET /courses/:id`, `GET /quiz-packages/:id`
- Quiz: `POST /quiz/start`, `POST /quiz/answer`, `POST /quiz/complete/:attemptId`
- History: `GET /attempts`, `GET /attempts/:attemptId`

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

**Last Updated**: 2025-10-06
