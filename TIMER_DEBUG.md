# Timer Issue Debugging Guide

## Problem
After entering student name and clicking "Start Quiz", the timer immediately shows "Time is up!" and auto-submits without showing questions.

## Root Cause Analysis

The timer expires immediately because `this.examTime` is either:
1. **0** (zero)
2. **undefined**
3. **null**
4. Not loaded properly from the API

## Debug Steps

### 1. Open Browser Console (F12)
When you access the quiz link, open Developer Tools (F12) and check the Console tab for these log messages:

```
Device ID: [some hash]
Quiz Package: {...}
Course Data: {...}
Exam Time: XX minutes
Questions loaded: XX
```

### 2. Check What's Being Logged

**If you see:**
- ✅ `Exam Time: 60 minutes` → Timer should work
- ❌ `Exam Time: 0 minutes` → Course exam_time is not set correctly
- ❌ `Exam Time: undefined` → API is not returning exam_time
- ❌ `Exam Time: null` → Database has NULL value

### 3. When You Click "Start Quiz"

You should see:
```
Starting quiz with exam time: 60 minutes
Time remaining (seconds): 3600
```

**If you see an error:**
```
Error: Invalid exam time. Please contact administrator.
Invalid exam time: 0
```

This means `exam_time` is 0 or invalid.

## Quick Fixes

### Fix 1: Check Database
```bash
sqlite3 quiz.db "SELECT id, title, exam_time FROM courses;"
```

**Expected output:**
```
1|Basic & Social Experience|60|50|3
```

If `exam_time` is 0, update it:
```bash
sqlite3 quiz.db "UPDATE courses SET exam_time = 60 WHERE id = 1;"
```

### Fix 2: Check Course API Response

Open browser console and run:
```javascript
fetch('/api/student/courses/1')
  .then(r => r.json())
  .then(data => console.log('Course API:', data));
```

**Expected output:**
```json
{
  "id": 1,
  "title": "Basic & Social Experience",
  "exam_time": 60,
  "student_limit": 50,
  "retry_count": 3
}
```

If `exam_time` is missing or 0, there's an API issue.

### Fix 3: Clear Browser Cache

Sometimes old JavaScript is cached:
1. Press `Ctrl+Shift+R` (hard refresh)
2. Or clear browser cache completely
3. Check that you're loading `quiz.js?v=4.3` (latest version)

### Fix 4: Check Quiz Package Course Association

Make sure the quiz package is linked to the correct course:
```bash
sqlite3 quiz.db "SELECT id, title, course_id FROM quiz_packages WHERE id = 1;"
```

**Expected output:**
```
1|Basic Test Package|1
```

If `course_id` is NULL or wrong, fix it:
```bash
sqlite3 quiz.db "UPDATE quiz_packages SET course_id = 1 WHERE id = 1;"
```

## Testing Locally

1. **Start the server:**
   ```bash
   ./bin/quiz-server
   ```

2. **Open quiz link:**
   ```
   http://localhost:8080/quiz?package=1
   ```

3. **Open Browser Console (F12)**

4. **Check logs for:**
   - Device ID generation ✓
   - Quiz Package loaded ✓
   - Course Data loaded ✓
   - Exam Time value ✓
   - Questions loaded ✓

5. **Enter student name and click "Start Quiz"**

6. **Check logs for:**
   - "Starting quiz with exam time: XX minutes"
   - "Time remaining (seconds): XXX"

7. **Timer should start counting down from exam_time**

## Common Issues

### Issue 1: exam_time is 0
**Symptom:** Timer expires immediately
**Fix:** Update course exam_time in database

### Issue 2: exam_time is undefined
**Symptom:** Alert shows "Invalid exam time"
**Fix:** Check API response and database column

### Issue 3: Old JavaScript cached
**Symptom:** No console logs, timer still broken
**Fix:** Hard refresh (Ctrl+Shift+R) or clear cache

### Issue 4: Quiz package not linked to course
**Symptom:** Course data not loaded
**Fix:** Update quiz_packages.course_id

## Server Deployment

After fixing locally, deploy to server:

```bash
# On server
cd /www/wwwroot/mitsuki_quiz/quiz
git pull origin main
go build -o bin/quiz-server cmd/server/main.go
systemctl restart quizserver

# Check database
sqlite3 quiz.db "SELECT id, title, exam_time FROM courses;"
```

## What We Added (v4.3)

1. **Validation before starting timer:**
   - Checks if `examTime` is valid (> 0)
   - Shows error alert if invalid
   - Prevents timer from starting with 0 time

2. **Debug logging:**
   - Logs quiz package data
   - Logs course data
   - Logs exam time value
   - Logs time remaining in seconds
   - Logs questions loaded count

3. **Console errors:**
   - Shows exact value of invalid exam_time
   - Helps identify where data loading fails

## Next Steps

1. ✅ Open quiz in browser with console open (F12)
2. ✅ Check console logs for exam time value
3. ✅ If exam_time is 0 or undefined, check database
4. ✅ If database is correct, check API response
5. ✅ Report what you see in console logs

---
**Last Updated:** 2025-10-07 00:15
