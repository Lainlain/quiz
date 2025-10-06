# Mitsui JPY Language School - Quiz Exam API

A comprehensive quiz examination system for Mitsui JPY Language School built with Go and Gin framework.

## Features

- **JWT Authentication**: Secure admin and student login with JWT tokens
- **Admin Dashboard**: Create and manage courses, quiz packages, and questions
- **Course Management**: Configure student limits, retry counts, and exam time per course
- **Quiz Packages**: Organize multiple questions into quiz packages within courses
- **Student Portal**: Students can register, login, take quizzes, and view results
- **Attempt Tracking**: Track student attempts with retry limits and scoring

## Tech Stack

- **Go 1.21+**
- **Gin** - HTTP web framework
- **GORM** - ORM library
- **SQLite** - Database (easily switchable to PostgreSQL/MySQL)
- **JWT** - Authentication
- **bcrypt** - Password hashing

## Project Structure

```
.
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── database/
│   │   └── database.go          # Database connection and migrations
│   ├── handlers/
│   │   ├── auth.go              # Authentication handlers
│   │   ├── course.go            # Course CRUD handlers
│   │   ├── quiz_package.go      # Quiz package handlers
│   │   ├── question.go          # Question handlers
│   │   └── student.go           # Student quiz attempt handlers
│   ├── middleware/
│   │   └── auth.go              # JWT and admin middleware
│   └── models/
│       ├── user.go              # User model (admin/student)
│       ├── course.go            # Course model
│       ├── quiz_package.go      # Quiz package model
│       ├── question.go          # Question model
│       └── attempt.go           # Attempt and Answer models
├── pkg/
│   └── utils/
│       ├── jwt.go               # JWT token utilities
│       └── password.go          # Password hashing utilities
├── config/
│   └── config.go                # Configuration management
├── .env.example                 # Environment variables template
└── go.mod                       # Go module dependencies
```

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd quiz
```

2. **Install dependencies**
```bash
go mod download
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run the application**
```bash
go run cmd/server/main.go
```

The server will start on `http://localhost:8080` by default.

## API Endpoints

### Public Endpoints

- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/student/register` - Student registration

### Admin Endpoints (Requires JWT + Admin Role)

**Courses**
- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course

**Quiz Packages**
- `POST /api/admin/quiz-packages` - Create quiz package
- `PUT /api/admin/quiz-packages/:id` - Update quiz package
- `DELETE /api/admin/quiz-packages/:id` - Delete quiz package

**Questions**
- `POST /api/admin/questions` - Create question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question

### Student Endpoints (Requires JWT)

**Browse**
- `GET /api/student/courses` - List all courses
- `GET /api/student/courses/:id` - Get course details
- `GET /api/student/quiz-packages/:id` - Get quiz package details
- `GET /api/student/quiz-packages/:packageId/questions` - Get questions

**Quiz Taking**
- `POST /api/student/quiz/start` - Start quiz attempt
- `POST /api/student/quiz/answer` - Submit answer
- `POST /api/student/quiz/complete/:attemptId` - Complete quiz
- `GET /api/student/attempts` - Get my attempts
- `GET /api/student/attempts/:attemptId` - Get attempt details

## Usage Examples

### 1. Admin Login
```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mitsui-jpy.com",
    "password": "admin123"
  }'
```

### 2. Create Course (Admin)
```bash
curl -X POST http://localhost:8080/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Japanese N5 Course",
    "description": "Beginner Japanese Language Course",
    "student_limit": 50,
    "retry_count": 3,
    "exam_time": 60
  }'
```

### 3. Student Register
```bash
curl -X POST http://localhost:8080/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "Tanaka Yuki"
  }'
```

### 4. Start Quiz (Student)
```bash
curl -X POST http://localhost:8080/api/student/quiz/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "course_id": 1,
    "quiz_package_id": 1
  }'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Server port | `8080` |
| `DATABASE_URL` | Database file path | `quiz.db` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key-change-in-production` |
| `JWT_EXPIRE_HOURS` | JWT token expiration (hours) | `24` |

## Development

### Build the application
```bash
go build -o bin/quiz-server cmd/server/main.go
```

### Run tests
```bash
go test ./...
```

### Database Migration

Database tables are automatically created on application startup via GORM AutoMigrate.

## Creating First Admin User

You'll need to manually create an admin user in the database initially, or add a seed script. Example SQL:

```sql
INSERT INTO users (email, password, name, role, created_at, updated_at)
VALUES (
  'admin@mitsui-jpy.com',
  -- password is 'admin123' (you need to hash it with bcrypt)
  '$2a$10$YOUR_BCRYPT_HASHED_PASSWORD',
  'Admin User',
  'admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

## License

Proprietary - Mitsui JPY Language School

## Support

For support, contact: support@mitsui-jpy.com
# quiz
