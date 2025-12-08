# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
go mod download
```

### 2. Create Admin User
```bash
go run cmd/create-admin/main.go
```

**Default Admin Credentials:**
- Email: `admin@mitsuki-jpy.com`
- Password: `admin123`

### 3. Run the Server
```bash
go run cmd/server/main.go
```

Server will start at `http://localhost:8080`

---

## 📝 Quick Test

### Step 1: Admin Login
```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mitsuki-jpy.com","password":"admin123"}'
```

Copy the `token` from the response.

### Step 2: Create a Course
```bash
curl -X POST http://localhost:8080/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Japanese N5",
    "description": "Beginner course",
    "student_limit": 50,
    "retry_count": 3,
    "exam_time": 60
  }'
```

### Step 3: Create Quiz Package
```bash
curl -X POST http://localhost:8080/api/admin/quiz-packages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "course_id": 1,
    "title": "Hiragana Quiz",
    "description": "Test hiragana knowledge"
  }'
```

### Step 4: Add Questions
```bash
curl -X POST http://localhost:8080/api/admin/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "quiz_package_id": 1,
    "question_text": "What is hiragana for A?",
    "question_type": "multiple_choice",
    "options": "[\"あ\", \"い\", \"う\", \"え\"]",
    "correct_answer": "あ",
    "points": 10,
    "order_number": 1
  }'
```

### Step 5: Register as Student
```bash
curl -X POST http://localhost:8080/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "Tanaka Yuki"
  }'
```

Copy the student `token`.

### Step 6: Take the Quiz
```bash
# Start quiz
curl -X POST http://localhost:8080/api/student/quiz/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE" \
  -d '{"course_id": 1, "quiz_package_id": 1}'

# Submit answer (use attempt_id from previous response)
curl -X POST http://localhost:8080/api/student/quiz/answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE" \
  -d '{"attempt_id": 1, "question_id": 1, "student_answer": "あ"}'

# Complete quiz
curl -X POST http://localhost:8080/api/student/quiz/complete/1 \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE"
```

---

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [API_EXAMPLES.md](API_EXAMPLES.md) for all API endpoints
- Review [.github/copilot-instructions.md](.github/copilot-instructions.md) for architecture details

## 🔧 Configuration

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Edit `.env` to customize:
- `SERVER_PORT` - Server port (default: 8080)
- `JWT_SECRET` - **IMPORTANT**: Change in production!
- `JWT_EXPIRE_HOURS` - Token expiration time

## 🏗️ Build for Production

```bash
# Build binary
go build -o bin/quiz-server cmd/server/main.go

# Run binary
./bin/quiz-server
```

## 🗄️ Database

- Default: SQLite (`quiz.db`)
- To reset database: Delete `quiz.db` and restart server
- For production: Switch to PostgreSQL/MySQL (just change GORM driver)

---

**Need help?** Check the [README.md](README.md) or `.github/copilot-instructions.md`
