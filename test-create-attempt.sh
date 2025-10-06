#!/bin/bash

# Test script to manually create a quiz attempt for testing statistics

echo "Creating test quiz attempt..."

# Database file
DB_FILE="quiz.db"

# Create a test guest user
sqlite3 $DB_FILE <<EOF
-- Create guest user
INSERT INTO users (created_at, updated_at, email, password, name, role)
VALUES (
    datetime('now'),
    datetime('now'),
    'guest_test_student@guest.local',
    'no-password-guest-user',
    'Test Student',
    'student'
);

-- Get the user ID
SELECT last_insert_rowid();
EOF

USER_ID=$(sqlite3 $DB_FILE "SELECT id FROM users WHERE email = 'guest_test_student@guest.local';")

echo "Created user ID: $USER_ID"

# Create a test attempt
sqlite3 $DB_FILE <<EOF
INSERT INTO attempts (
    created_at,
    updated_at,
    student_id,
    course_id,
    quiz_package_id,
    status,
    start_time,
    end_time,
    score,
    total_points,
    attempt_count
)
VALUES (
    datetime('now'),
    datetime('now'),
    $USER_ID,
    1,
    1,
    'completed',
    datetime('now', '-10 minutes'),
    datetime('now'),
    85,
    100,
    1
);

SELECT 'Attempt created with ID: ' || last_insert_rowid();
EOF

echo ""
echo "✅ Test attempt created successfully!"
echo "📊 Now check statistics: http://localhost:8080/admin"
echo "   1. Login to admin dashboard"
echo "   2. Click on your course"
echo "   3. Click the 📊 icon next to quiz package"
echo ""
echo "You should see:"
echo "  - Total Attempts: 1"
echo "  - Average Score: 85"
echo "  - Pass Rate: 100%"
echo "  - Score Distribution: Excellent (90-100%)"
