# API Testing Examples

This file contains curl commands to test all API endpoints.

## Setup

First, start the server:
```bash
go run cmd/server/main.go
```

## 1. Authentication

### Admin Login
```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mitsui-jpy.com",
    "password": "admin123"
  }'
```

Save the token from response for admin operations.

### Student Register
```bash
curl -X POST http://localhost:8080/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "Tanaka Yuki"
  }'
```

### Student Login
```bash
curl -X POST http://localhost:8080/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

Save the token from response for student operations.

---

## 2. Admin Operations

Replace `YOUR_ADMIN_TOKEN` with the token from admin login.

### Create Course
```bash
curl -X POST http://localhost:8080/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Japanese N5 Course",
    "description": "Beginner Japanese Language Course",
    "student_limit": 50,
    "retry_count": 3,
    "exam_time": 60,
    "is_active": true
  }'
```

### Update Course
```bash
curl -X PUT http://localhost:8080/api/admin/courses/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Japanese N5 Course (Updated)",
    "description": "Beginner Japanese Language Course - Updated",
    "student_limit": 100,
    "retry_count": 5,
    "exam_time": 90,
    "is_active": true
  }'
```

### Delete Course
```bash
curl -X DELETE http://localhost:8080/api/admin/courses/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Create Quiz Package
```bash
curl -X POST http://localhost:8080/api/admin/quiz-packages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "course_id": 1,
    "title": "Hiragana Quiz",
    "description": "Test your knowledge of Hiragana characters",
    "is_active": true
  }'
```

### Update Quiz Package
```bash
curl -X PUT http://localhost:8080/api/admin/quiz-packages/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "course_id": 1,
    "title": "Hiragana Quiz (Updated)",
    "description": "Updated description",
    "is_active": true
  }'
```

### Delete Quiz Package
```bash
curl -X DELETE http://localhost:8080/api/admin/quiz-packages/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Create Multiple Choice Question
```bash
curl -X POST http://localhost:8080/api/admin/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "quiz_package_id": 1,
    "question_text": "What is the hiragana for \"a\"?",
    "question_type": "multiple_choice",
    "options": "[\"あ\", \"い\", \"う\", \"え\"]",
    "correct_answer": "あ",
    "points": 10,
    "order_number": 1,
    "is_active": true
  }'
```

### Create True/False Question
```bash
curl -X POST http://localhost:8080/api/admin/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "quiz_package_id": 1,
    "question_text": "Hiragana has 46 basic characters. True or False?",
    "question_type": "true_false",
    "options": "[\"true\", \"false\"]",
    "correct_answer": "true",
    "points": 5,
    "order_number": 2,
    "is_active": true
  }'
```

### Update Question
```bash
curl -X PUT http://localhost:8080/api/admin/questions/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "quiz_package_id": 1,
    "question_text": "What is the hiragana for \"a\"? (Updated)",
    "question_type": "multiple_choice",
    "options": "[\"あ\", \"い\", \"う\", \"え\"]",
    "correct_answer": "あ",
    "points": 15,
    "order_number": 1,
    "is_active": true
  }'
```

### Delete Question
```bash
curl -X DELETE http://localhost:8080/api/admin/questions/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 3. Student Operations

Replace `YOUR_STUDENT_TOKEN` with the token from student login.

### Get All Courses
```bash
curl -X GET http://localhost:8080/api/student/courses \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Get Course Details
```bash
curl -X GET http://localhost:8080/api/student/courses/1 \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Get Quiz Package Details
```bash
curl -X GET http://localhost:8080/api/student/quiz-packages/1 \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Get Questions in Quiz Package
```bash
curl -X GET http://localhost:8080/api/student/questions/package/1 \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Start Quiz
```bash
curl -X POST http://localhost:8080/api/student/quiz/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -d '{
    "course_id": 1,
    "quiz_package_id": 1
  }'
```

Save the `attempt.id` from response for submitting answers.

### Submit Answer
```bash
curl -X POST http://localhost:8080/api/student/quiz/answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -d '{
    "attempt_id": 1,
    "question_id": 1,
    "student_answer": "あ"
  }'
```

### Submit Another Answer
```bash
curl -X POST http://localhost:8080/api/student/quiz/answer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \
  -d '{
    "attempt_id": 1,
    "question_id": 2,
    "student_answer": "true"
  }'
```

### Complete Quiz
```bash
curl -X POST http://localhost:8080/api/student/quiz/complete/1 \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Get My Attempts
```bash
curl -X GET http://localhost:8080/api/student/attempts \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

### Get Attempt Details
```bash
curl -X GET http://localhost:8080/api/student/attempts/1 \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

---

## Complete Test Workflow

1. Create admin and login to get admin token
2. Create a course
3. Create a quiz package for that course
4. Create multiple questions for the quiz package
5. Register as student and login to get student token
6. Browse courses as student
7. Start quiz
8. Submit answers for all questions
9. Complete quiz
10. View attempt results

---

## Notes

- All dates/times are in ISO 8601 format
- Question options should be valid JSON array strings
- Retry count is enforced - students cannot exceed the limit
- Exam time is returned when starting quiz (client should implement timer)
- Answers can be updated before completing the quiz
