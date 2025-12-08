# Admin Login Troubleshooting Guide

## Problem: "Invalid credentials" when logging in with admin@mitsuki-jpy.com / admin123

### Step 1: Verify Admin User Exists in Database

Run this on your server:
```bash
sqlite3 quiz.db "SELECT id, email, name, role FROM users WHERE email='admin@mitsuki-jpy.com';"
```

**Expected output:**
```
1|admin@mitsuki-jpy.com|Admin User|admin
```

If no output, admin user doesn't exist. Run:
```bash
go run cmd/create-admin/main.go
```

---

### Step 2: Check Server Logs

When you try to login, check the server logs for errors:
```bash
journalctl -u quizserver -f
```

Or if running manually:
```bash
./quiz
```

Look for errors like:
- `record not found` - Admin user doesn't exist
- `Invalid credentials` - Password mismatch
- Any database connection errors

---

### Step 3: Test Login via cURL

Test the API directly:
```bash
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mitsuki-jpy.com","password":"admin123"}'
```

**Expected response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@mitsuki-jpy.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**If you get "Invalid credentials":**
- Check database has admin user (Step 1)
- Check password hash in database
- Check .env file has correct settings

---

### Step 4: Verify .env Configuration

Check your `.env` file on the server:
```bash
cat .env
```

Required settings:
```bash
SERVER_PORT=8080
DATABASE_URL=quiz.db
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRE_HOURS=24
```

If `.env` doesn't exist, copy from example:
```bash
cp .env.example .env
```

Then restart server:
```bash
systemctl restart quizserver
```

---

### Step 5: Check Frontend URL

If using a domain name, make sure the frontend is calling the correct API URL.

Check browser console (F12) → Network tab when you click "Login"

The request should go to:
```
POST http://your-domain.com/api/auth/admin/login
```

NOT:
```
POST http://localhost:8080/api/auth/admin/login
```

---

### Step 6: Delete and Recreate Admin User

If password hash is corrupted, delete and recreate:

```bash
# Delete admin user
sqlite3 quiz.db "DELETE FROM users WHERE email='admin@mitsuki-jpy.com';"

# Recreate admin user
go run cmd/create-admin/main.go
```

---

### Step 7: Check CORS Settings

If you're accessing from a different domain, add CORS middleware.

Edit `cmd/server/main.go` and add before routes:

```go
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"*"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
}))
```

Add import:
```go
"github.com/gin-contrib/cors"
```

Install package:
```bash
go get github.com/gin-contrib/cors
```

---

### Step 8: Reset Password Manually

If you need to set a different password:

```bash
sqlite3 quiz.db
```

Then run:
```sql
UPDATE users 
SET password = '$2a$10$SkHKAQ75aZ62LAmL7vRfGezw8Y/HjW//Z.IcAmbaeTOECeL7mnRFG' 
WHERE email = 'admin@mitsuki-jpy.com';
.quit
```

This sets password to: `admin123`

---

## Quick Fix Commands

Run these on your live server:

```bash
cd /www/wwwroot/mitsuki_quiz/quiz

# 1. Check admin exists
sqlite3 quiz.db "SELECT id, email, name, role FROM users WHERE email='admin@mitsuki-jpy.com';"

# 2. If not exists, create admin
go run cmd/create-admin/main.go

# 3. Test login with curl
curl -X POST http://localhost:8080/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mitsuki-jpy.com","password":"admin123"}'

# 4. Check server logs
journalctl -u quizserver -n 50

# 5. Restart server
systemctl restart quizserver
```

---

## Common Issues and Solutions

### Issue: "record not found"
**Solution:** Admin user doesn't exist. Run `go run cmd/create-admin/main.go`

### Issue: "Invalid credentials" but admin exists
**Solution:** Password hash mismatch. Delete and recreate admin user.

### Issue: CORS error in browser
**Solution:** Add CORS middleware (Step 7)

### Issue: Can't connect to database
**Solution:** Check DATABASE_URL in .env points to correct quiz.db path

### Issue: Server not responding
**Solution:** Check if server is running: `systemctl status quizserver`

---

## Debug Admin Creation

To verify admin was created correctly:

```bash
sqlite3 quiz.db "SELECT id, email, name, role, password FROM users WHERE email='admin@mitsuki-jpy.com';"
```

The password should be a bcrypt hash starting with `$2a$10$`

Example:
```
1|admin@mitsuki-jpy.com|Admin User|admin|$2a$10$SkHKAQ75aZ62LAmL7vRfGezw8Y/HjW//Z.IcAmbaeTOECeL7mnRFG
```

---

## If Nothing Works

1. **Backup database:**
   ```bash
   cp quiz.db quiz.db.backup
   ```

2. **Delete database and start fresh:**
   ```bash
   rm quiz.db
   go run cmd/create-admin/main.go
   ```

3. **Restart server:**
   ```bash
   systemctl restart quizserver
   ```

4. **Test login:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@mitsuki-jpy.com","password":"admin123"}'
   ```
