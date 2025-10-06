# Quiz Package Statistics Feature

## 🎯 Overview

The statistics feature displays comprehensive exam analytics for each quiz package, including total attempts, average scores, pass rates, and score distributions.

## ❓ The "Zero Statistics" Issue

You saw all zeros in the statistics because **no quiz attempts were saved in the database yet**. The public quiz system was displaying results but not persisting them to the database.

## ✅ Solution Implemented

### 1. **Backend - Public Quiz Submission Endpoint**

Created a new endpoint that saves quiz attempts without requiring authentication:

**Endpoint**: `POST /api/quiz/submit`

**What it does**:
- Creates a "guest user" for each student name (e.g., `guest_john_doe@guest.local`)
- Saves the quiz attempt with score, time taken, and completion status
- Saves all answers with correctness and points earned
- Allows statistics tracking for public quiz attempts

**Code Location**: `/internal/handlers/student.go` - `SubmitPublicQuiz()` method

### 2. **Frontend - Automatic Attempt Saving**

Modified the public quiz to automatically save results when submitted:

**Code Location**: `/web/static/js/quiz.js` - `saveAttempt()` method

**What it does**:
- Calls the backend endpoint after quiz submission
- Sends student name, scores, answers, and time taken
- Runs silently in the background (user doesn't see any difference)

### 3. **Statistics Dashboard**

Already implemented (from previous work):
- **📊 Button** in quiz packages table
- **Statistics Modal** showing:
  - Total attempts count
  - Average score
  - Pass rate (≥60%)
  - Completion rate
  - Score distribution by performance level
  - Recent 10 attempts with student names

## 🧪 How to Test

### Step 1: Take a Public Quiz
1. Go to `http://localhost:8080/quiz?package=1`
2. Enter your name (e.g., "John Doe")
3. Start the quiz and answer questions
4. Submit the quiz
5. See your results

### Step 2: View Statistics
1. Go to `http://localhost:8080/admin` and login
2. Click on "Lesson (1-5)" course to see packages
3. Click the **📊** icon next to "Basic & Social Experience" package
4. You'll now see:
   - Total Attempts: **1** (or more if you took it multiple times)
   - Average Score: Your score
   - Pass Rate: 100% if you scored ≥60%, otherwise 0%
   - Score Distribution: Based on your percentage
   - Recent Attempts: Your name and score in the table

### Step 3: Test with Multiple Students
1. Open the quiz in different browsers/incognito windows
2. Use different student names
3. Complete the quizzes with varying scores
4. View statistics to see:
   - Multiple attempts counted
   - Average calculated across all attempts
   - Score distribution showing spread of performance
   - Recent attempts list showing all students

## 📊 Statistics Explained

### Total Attempts
Count of all quiz submissions (completed and in-progress)

### Average Score
Average points earned across **completed** attempts only

### Pass Rate
Percentage of students who scored ≥60% out of those who completed

### Completion Rate
Percentage of attempts that were completed vs total started

### Score Distribution
- **90-100%**: Excellent (green)
- **80-89%**: Good (blue)
- **60-79%**: Average (yellow)
- **Below 60%**: Poor (red)

### Recent Attempts
Last 10 quiz submissions showing:
- Student name (from guest user or registered user)
- Score / Total Points
- Percentage
- Completion date and time
- Status (completed, in_progress, abandoned)

## 🔍 Database Schema

### Guest Users
When someone takes a public quiz, a guest user is created:
```
Email: guest_john_doe@guest.local
Name: John Doe
Role: student
Password: "no-password-guest-user" (can't login)
```

This allows tracking attempts without requiring registration.

### Attempts Table
Each quiz submission creates an `attempts` record:
```
student_id: Guest user ID
course_id: Course ID
quiz_package_id: Quiz Package ID
status: "completed"
start_time: When quiz was started
end_time: When quiz was submitted
score: Points earned
total_points: Maximum possible points
```

### Answers Table
Each question answer is saved:
```
attempt_id: Link to attempt
question_id: Which question
student_answer: What they selected
is_correct: True/False
points_earned: Points for this question
```

## 🎨 Why This Approach?

### Pros:
✅ **No Authentication Required**: Students can take quizzes without creating accounts
✅ **Full Tracking**: Every attempt is recorded for analytics
✅ **Guest User System**: Names are tracked without forcing registration
✅ **Seamless UX**: Students don't even know their data is being saved
✅ **Reusable**: Same statistics work for both public and authenticated quizzes

### Cons:
⚠️ **No Login Protection**: Same student name creates new guest users if they use different variations
⚠️ **Data Privacy**: Consider adding a privacy notice about data collection

## 🚀 Next Steps (Optional Enhancements)

1. **Add Privacy Notice**: Inform students their results will be tracked
2. **Duplicate Detection**: Check if guest user already exists by exact name match
3. **Export Statistics**: Add CSV/Excel export for analytics
4. **Time-Based Filters**: Filter statistics by date range
5. **Course-Level Stats**: Aggregate statistics across all packages in a course
6. **Student Leaderboard**: Show top performers (with permission)

## 📝 API Endpoints

### Public Routes (No Auth)
- `POST /api/quiz/submit` - Submit public quiz results

### Admin Routes (Auth + Admin Role Required)
- `GET /api/admin/quiz-packages/:id/stats` - Get quiz package statistics

### Student Routes (Auth Required)
- `POST /api/student/quiz/start` - Start authenticated quiz
- `POST /api/student/quiz/answer` - Submit answer
- `POST /api/student/quiz/complete/:attemptId` - Complete quiz

## ✨ Summary

The statistics feature is now **fully functional**! The zero values you saw were correct - there simply weren't any quiz attempts yet. Now that the public quiz saves results automatically, every quiz taken will contribute to the statistics you see in the admin dashboard.

**Test it now**: Take a quiz at `http://localhost:8080/quiz?package=1` and then check the statistics! 🎉
