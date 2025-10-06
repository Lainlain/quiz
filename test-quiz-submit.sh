#!/bin/bash

# Test quiz submission
echo "Testing quiz submission..."

curl -X POST http://localhost:8080/api/quiz/submit \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "Test Student Debug",
    "course_id": 1,
    "quiz_package_id": 1,
    "device_id": "test-device-12345",
    "score": 90,
    "total_points": 100,
    "time_taken": 300,
    "answers": [
      {
        "question_id": 1,
        "user_answer": "Tokyo",
        "is_correct": true,
        "points_earned": 10
      }
    ]
  }' | jq .

echo ""
echo "Checking database..."
sqlite3 /home/lainlain/Desktop/Go\ Lang\ /quiz/quiz.db "SELECT id, student_id, score, total_points, device_id FROM attempts ORDER BY id DESC LIMIT 1;"
