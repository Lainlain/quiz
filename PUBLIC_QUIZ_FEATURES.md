# Public Quiz Features - Summary

## ✅ Implemented Features

### 1. **Retry Limit (3 Attempts Maximum)**
- **Location**: `/internal/handlers/student.go` - `SubmitPublicQuiz()` function
- **How it works**:
  - Checks device_id before allowing quiz submission
  - Counts completed attempts for the same device + quiz package
  - If count >= 3, returns **403 Forbidden** with error message
  - Frontend shows alert: "You have already taken this quiz 3 times"

**Testing**:
1. Take quiz from: `http://localhost:8080/quiz?package=1`
2. Complete and submit 3 times
3. On 4th attempt, you'll see the retry limit message

---

### 2. **Student Name & Device ID Saved**
- **Location**: `/internal/handlers/student.go` - `SubmitPublicQuiz()` function
- **What gets saved**:
  - ✅ Student name → Creates guest user in `users` table
  - ✅ Device ID → SHA-256 fingerprint saved in `attempts.device_id`
  - ✅ Course ID → Links attempt to course
  - ✅ Quiz Package ID → Links attempt to specific quiz
  - ✅ Score, answers, time taken

**Database Check**:
```bash
sqlite3 quiz.db "SELECT a.id, u.name, a.score, a.total_points, a.device_id, a.created_at FROM attempts a JOIN users u ON a.student_id = u.id ORDER BY a.id DESC LIMIT 5;"
```

---

### 3. **Course Statistics (Student Attempts Overview)**
- **API Endpoint**: `GET /api/admin/courses/:id/stats`
- **Location**: `/internal/handlers/course.go` - `GetCourseStats()` function
- **Dashboard**: Click 👥 icon next to any course in admin dashboard

**Shows**:
- **Total Attempts** - All quiz attempts for this course
- **Unique Students** - Count of unique devices (students) who took quizzes
- **Student List Table**:
  - Student Name
  - Number of Attempts (shows "Max" if ≥ 3)
  - Best Score with percentage
  - Last Attempt date/time
  - Color-coded scores:
    - 🟢 Green: ≥80%
    - 🔵 Blue: 60-79%
    - 🔴 Red: <60%

**How to access**:
1. Login to admin: `http://localhost:8080/admin/login`
2. Go to Courses tab
3. Click 👥 icon next to any course
4. View student attempts statistics

---

## 📊 Data Flow

```
Public Quiz URL → Student takes quiz → Submits
    ↓
Check retry limit (max 3 attempts)
    ↓
Create/find guest user (by student name)
    ↓
Save attempt with:
  - student_id
  - course_id
  - quiz_package_id
  - device_id
  - score, answers, time
    ↓
Statistics available in:
  - Quiz Package Stats (existing)
  - Course Stats (NEW!)
```

---

## 🔧 Technical Changes

### Files Modified:
1. **`/internal/handlers/student.go`**
   - Added retry limit check (3 attempts max)
   - Fixed parseInt() for quiz_package_id
   - Added logging for debugging

2. **`/internal/handlers/course.go`**
   - Added `GetCourseStats()` function
   - Query for unique students by device_id
   - Aggregates attempts per student

3. **`/cmd/server/main.go`**
   - Added route: `GET /api/admin/courses/:id/stats`

4. **`/web/static/js/dashboard.js`**
   - Added `showCourseStats()` function
   - Modal to display student attempts

5. **`/web/templates/admin/dashboard.html`**
   - Added 👥 button to view course stats

6. **`/web/static/js/quiz.js`**
   - Fixed `parseInt()` for quiz_package_id (was string, needed int)
   - Added 403 error handling for retry limit
   - Version updated to 4.2

---

## 🧪 Testing Guide

### Test Retry Limit:
1. Open: `http://localhost:8080/quiz?package=1`
2. Enter name: "Test Student 1"
3. Complete quiz and submit ✅
4. Reload page, take quiz again ✅
5. Reload page, take quiz 3rd time ✅
6. Reload page, try to take quiz 4th time ❌
   - Should show: "Maximum retry limit reached"

### Test Course Statistics:
1. Login to admin: `http://localhost:8080/admin/login`
   - Email: `admin@mitsuki-jpy.com`
   - Password: `admin123`
2. Click "Courses" tab
3. Click 👥 icon next to any course
4. See student attempts:
   - Total attempts count
   - Unique students count
   - List of students with attempt counts and best scores

### Verify Database:
```bash
# Check attempts with device_id
sqlite3 quiz.db "SELECT id, student_id, score, device_id FROM attempts ORDER BY id DESC LIMIT 5;"

# Check guest users
sqlite3 quiz.db "SELECT id, email, name FROM users WHERE email LIKE 'guest_%';"

# Count attempts per device
sqlite3 quiz.db "SELECT device_id, COUNT(*) as attempts FROM attempts WHERE device_id != '' GROUP BY device_id;"
```

---

## 📝 API Endpoints Summary

### Public (No Auth):
- `POST /api/quiz/submit` - Submit quiz (checks retry limit)
- `GET /api/quiz/check-device` - Check if device took quiz

### Admin (Auth Required):
- `GET /api/admin/courses/:id/stats` - **NEW!** Get course student statistics
- `GET /api/admin/quiz-packages/:id/stats` - Get quiz package statistics

---

## 🎯 Business Rules

1. **Retry Limit**: 3 attempts per device per quiz package
2. **Device Tracking**: Uses SHA-256 fingerprint (screen, canvas, WebGL, etc.)
3. **Guest Users**: Auto-created with email format `guest_<name>@guest.local`
4. **Score Tracking**: Always shows best score in statistics
5. **Attempt Counting**: Grouped by device_id + student_name

---

## ✅ Completed Checklist

- [x] Fix quiz submission (was 400 error - fixed parseInt issue)
- [x] Retry limit check (3 attempts max)
- [x] Save student name and device_id
- [x] Course statistics endpoint
- [x] Dashboard UI for course stats
- [x] Student attempts table with best scores
- [x] Color-coded score display
- [x] Attempt count with "Max" indicator

---

**All features are now working!** 🎉
