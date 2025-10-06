# Deploy to Live Server - Fix Quiz Loading Issue

## Problem
- ✅ Works perfectly on localhost (http://localhost:8080)
- ❌ Shows "Loading quiz..." forever on live server

## Root Cause
The live server is running **old code** (v4.2 or older) that doesn't have the loading state fix.

## Solution: Deploy Latest Code to Server

### Step 1: Connect to Your Server
```bash
ssh user@your-server-ip
# Or if using a specific key:
# ssh -i /path/to/key user@your-server-ip
```

### Step 2: Navigate to Project Directory
```bash
cd /www/wwwroot/mitsuki_quiz/quiz
```

### Step 3: Pull Latest Code
```bash
git pull origin main
```

**Expected output:**
```
Updating b7d4263..18f5498
Fast-forward
 TIMER_DEBUG.md                        | 228 ++++++++++++++++++++++++++
 web/static/js/quiz.js                 |  45 ++++--
 web/templates/public/quiz.html        |  33 +++-
 3 files changed, 294 insertions(+), 12 deletions(-)
 create mode 100644 TIMER_DEBUG.md
```

### Step 4: Rebuild the Server
```bash
go build -o bin/quiz-server cmd/server/main.go
```

### Step 5: Restart the Server
```bash
# If using systemd service:
systemctl restart quizserver

# Or if running manually:
pkill -f quiz-server
nohup ./bin/quiz-server > server.log 2>&1 &
```

### Step 6: Clear Browser Cache
**Important:** The browser might have cached old JavaScript files.

**Option A - Hard Refresh (Recommended):**
1. Open the quiz link in browser
2. Press `Ctrl + Shift + R` (Linux/Windows) or `Cmd + Shift + R` (Mac)

**Option B - Clear Cache:**
1. Press `F12` to open DevTools
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option C - Incognito/Private Window:**
1. Open quiz link in Incognito/Private window
2. This ensures no cached files are used

### Step 7: Verify the Fix
1. Open quiz link: `http://your-server/quiz?package=1`
2. Check if it shows:
   - ✅ Course name and quiz package name
   - ✅ Total Questions: 10
   - ✅ Time Limit: 60 minutes
   - ✅ Total Points: (correct total)

3. Enter name and click "Start Quiz"
4. Should see questions immediately (no "Time is up!" error)

## Quick Deploy Script

You can also use this one-liner to deploy:

```bash
cd /www/wwwroot/mitsuki_quiz/quiz && \
git pull origin main && \
go build -o bin/quiz-server cmd/server/main.go && \
systemctl restart quizserver && \
echo "✅ Deployment complete!"
```

## Troubleshooting

### Issue 1: "Already up to date" when running git pull
**Cause:** Server already has latest code, but not rebuilt.
**Fix:**
```bash
go build -o bin/quiz-server cmd/server/main.go
systemctl restart quizserver
```

### Issue 2: Still shows "Loading quiz..." after deploy
**Cause:** Browser cache.
**Fix:**
- Hard refresh: `Ctrl + Shift + R`
- Or open in Incognito mode
- Check that you're loading `quiz.js?v=4.5` (check Network tab in DevTools)

### Issue 3: Permission denied when restarting service
**Cause:** Need sudo privileges.
**Fix:**
```bash
sudo systemctl restart quizserver
```

### Issue 4: Server not starting
**Cause:** Database path or port issue.
**Fix:**
1. Check if .env file exists:
   ```bash
   ls -la .env
   ```
2. Check .env contents:
   ```bash
   cat .env
   ```
3. Ensure DATABASE_URL is absolute path:
   ```
   DATABASE_URL=/www/wwwroot/mitsuki_quiz/quiz/quiz.db
   ```

### Issue 5: JavaScript file not updating
**Cause:** Nginx/Apache caching static files.
**Fix:**
```bash
# If using Nginx:
sudo nginx -s reload

# If using Apache:
sudo systemctl reload apache2
```

## Verify JavaScript Version

To check which version is loaded:

1. Open quiz link in browser
2. Press `F12` → Network tab
3. Look for `quiz.js?v=X.X` in the requests
4. Should show: `quiz.js?v=4.5`
5. If showing older version (4.2, 4.3, 4.4), clear browser cache

## Files Changed in This Update

- ✅ `web/static/js/quiz.js` - Added better error handling and loading state
- ✅ `web/templates/public/quiz.html` - Added loading UI and version 4.5
- ✅ `TIMER_DEBUG.md` - Added debugging guide

## What Was Fixed

1. **Loading State (v4.4):**
   - Added `isLoading` flag to track when data is loading
   - Shows "Loading quiz..." while fetching data
   - Hides quiz info until data is ready
   - Prevents showing "0" values

2. **Error Handling (v4.5):**
   - Added try-catch in `init()` function
   - Always sets `isLoading = false` even on error
   - Shows detailed error messages in console
   - Prevents infinite loading state

3. **Timer Validation (v4.3):**
   - Validates exam time before starting quiz
   - Prevents timer from starting with 0 time
   - Shows error if exam time is invalid

## Testing on Server

After deployment, test these scenarios:

### Test 1: Quiz Info Loads
- ✅ Should show course name
- ✅ Should show quiz package name  
- ✅ Should show correct question count
- ✅ Should show correct time limit
- ✅ Should show correct total points

### Test 2: Timer Works
- Enter student name
- Click "Start Quiz"
- ✅ Should see questions immediately
- ✅ Timer should count down from exam_time
- ✅ Should NOT show "Time is up!" immediately

### Test 3: Console Logs (F12)
Should see these logs:
```
Device ID: [hash]
Loading quiz data for package: 1
Quiz Package: {...}
Course Data: {...}
Exam Time: 60 minutes
Questions loaded: 10
Quiz data loaded successfully
Quiz initialization complete
```

## Emergency Rollback

If new version has issues, rollback to previous version:

```bash
cd /www/wwwroot/mitsuki_quiz/quiz
git log --oneline -5  # See recent commits
git checkout <previous-commit-hash>
go build -o bin/quiz-server cmd/server/main.go
systemctl restart quizserver
```

Then report the issue so we can fix it.

---

## Quick Checklist

Before contacting support, verify:

- [ ] Ran `git pull origin main` on server
- [ ] Rebuilt with `go build -o bin/quiz-server cmd/server/main.go`
- [ ] Restarted server with `systemctl restart quizserver`
- [ ] Cleared browser cache with `Ctrl+Shift+R`
- [ ] Checked JavaScript version is `4.5` in Network tab
- [ ] Checked console for error messages (F12)
- [ ] Verified .env file exists with correct database path

---

**Last Updated:** 2025-10-07 00:30  
**Current Version:** v4.5  
**Status:** ✅ Fixed loading state and timer issues
