# Phone Number Quiz Verification System

## Overview
The quiz system now requires students to verify their phone number before taking a quiz. Only students who are **registered AND approved** for the course can access the quiz.

## Features

### 1. Phone Number Input Instead of Name
- **Old System**: Students entered their name freely
- **New System**: Students must enter their registered phone number
- The system verifies the phone number against the enrollment database

### 2. Enrollment Status Verification
The system checks three conditions:
1. **Phone number exists** in the database
2. **Student is enrolled** in the specific course
3. **Enrollment status is APPROVED**

### 3. Status-Based Access Control

| Status | Can Take Quiz? | Message Shown |
|--------|---------------|---------------|
| **Not Registered** | ❌ No | "This phone number is not registered. Please register first." |
| **Pending** | ❌ No | "Your registration is pending approval. Please wait for admin confirmation." |
| **Declined** | ❌ No | "Your registration was declined. Please contact the administrator." |
| **Approved** | ✅ Yes | "You are approved to take this quiz." |

## Technical Implementation

### Backend Changes

#### 1. New API Endpoint: `/api/quiz/check-phone`

**Location**: `internal/handlers/auth.go`

**Method**: `GET`

**Query Parameters**:
- `course_id` (required): The course ID
- `phone_number` (required): The student's phone number

**Response Format**:

**Success (Approved)**:
```json
{
  "approved": true,
  "student_id": 123,
  "student_name": "John Doe",
  "message": "You are approved to take this quiz."
}
```

**Not Approved**:
```json
{
  "approved": false,
  "message": "Your registration is pending approval. Please wait for admin confirmation."
}
```

**Example cURL**:
```bash
curl "http://localhost:8080/api/quiz/check-phone?course_id=1&phone_number=09123456789"
```

#### 2. Function: `CheckPhoneNumberForQuiz`

```go
func (h *AuthHandler) CheckPhoneNumberForQuiz(c *gin.Context) {
    courseID := c.Query("course_id")
    phoneNumber := c.Query("phone_number")
    
    // 1. Find user by phone number
    var user models.User
    if err := database.DB.Where("phone_number = ?", phoneNumber).First(&user).Error; err != nil {
        // Phone number not found
        return
    }
    
    // 2. Check if enrolled in this course
    var enrollment models.Enrollment
    if err := database.DB.Where("student_id = ? AND course_id = ?", user.ID, courseID).First(&enrollment).Error; err != nil {
        // Not enrolled
        return
    }
    
    // 3. Check if status is approved
    if enrollment.Status != models.EnrollmentApproved {
        // Not approved
        return
    }
    
    // Approved!
}
```

### Frontend Changes

#### 1. Quiz Page (`web/templates/public/quiz.html`)

**Old Input**:
```html
<label>Student Name</label>
<input type="text" x-model="studentName" placeholder="Enter your full name">
<button>Start Quiz</button>
```

**New Input**:
```html
<label>Phone Number</label>
<input type="tel" x-model="phoneNumber" placeholder="Enter your phone number">
<p class="text-xs">Enter the phone number you used to register</p>
<button>Verify & Start Quiz</button>
```

#### 2. Quiz JavaScript (`web/static/js/quiz.js`)

**New Properties**:
```javascript
phoneNumber: '',      // User input
studentId: null,      // Retrieved from API
studentName: '',      // Retrieved from API
```

**New Function**: `verifyPhoneNumber()`
```javascript
async verifyPhoneNumber() {
    // 1. Validate phone number input
    if (!this.phoneNumber.trim()) {
        this.showModal('warning', 'Phone Number Required', '...');
        return;
    }
    
    // 2. Call verification API
    const response = await fetch(`/api/quiz/check-phone?course_id=${this.courseId}&phone_number=${this.phoneNumber}`);
    const data = await response.json();
    
    // 3. Check if approved
    if (!data.approved) {
        this.showModal('error', 'Not Registered', data.message);
        return;
    }
    
    // 4. Save student info and start quiz
    this.studentId = data.student_id;
    this.studentName = data.student_name;
    this.startQuiz();
}
```

## User Flow

### For Approved Students

1. Student opens quiz link: `/quiz?package=123`
2. System loads quiz package and course information
3. Page shows phone number input field
4. Student enters their registered phone number
5. Student clicks "Verify & Start Quiz"
6. System verifies:
   - ✅ Phone number exists
   - ✅ Student enrolled in course
   - ✅ Status is APPROVED
7. Quiz starts successfully

### For Pending Students

1. Student opens quiz link
2. Student enters phone number
3. Student clicks "Verify & Start Quiz"
4. System shows error modal:
   - ❌ Title: "Not Registered"
   - ❌ Message: "Your registration is pending approval. Please wait for admin confirmation."
5. Student cannot take quiz until admin approves

### For Declined Students

1. Student opens quiz link
2. Student enters phone number
3. Student clicks "Verify & Start Quiz"
4. System shows error modal:
   - ❌ Title: "Not Registered"
   - ❌ Message: "Your registration was declined. Please contact the administrator."
5. Student cannot take quiz

### For Unregistered Phone Numbers

1. Student opens quiz link
2. Student enters phone number (not in database)
3. Student clicks "Verify & Start Quiz"
4. System shows error modal:
   - ❌ Title: "Not Registered"
   - ❌ Message: "This phone number is not registered. Please register first."
5. Student must register first

## Benefits

1. **Security**: Only registered and approved students can take quizzes
2. **Accountability**: All quiz attempts linked to verified student records
3. **Admin Control**: Admins can control who takes quizzes via approval system
4. **Better Tracking**: Student identity verified via unique phone number
5. **Prevents Fraud**: Random people cannot take quizzes without registration

## Error Handling

### Client-Side Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Phone Number Required" | Empty input | Enter phone number |
| "Not Registered" | Phone not in database | Register first |
| "Pending Approval" | Enrollment status = pending | Wait for admin |
| "Declined" | Enrollment status = declined | Contact admin |
| "Verification Failed" | Network error | Check connection, retry |

### Server-Side Errors

| Status Code | Error | Cause |
|-------------|-------|-------|
| 400 | "Phone number is required" | Missing phone_number parameter |
| 400 | "Course ID is required" | Missing course_id parameter |
| 200 | approved: false | Not registered/approved |
| 200 | approved: true | Success |

## Database Relationships

```
Phone Number → User → Enrollment → Course
                ↓
          student_id
                ↓
            Status (pending/approved/declined)
```

## Testing Scenarios

### Test 1: Approved Student
```bash
# 1. Register student
curl -X POST http://localhost:8080/api/register/course/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@test.com","phone_number":"09123456789","address":"Test Address"}'

# 2. Admin approves registration
curl -X PUT http://localhost:8080/api/admin/enrollments/1/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'

# 3. Student opens quiz and enters phone: 09123456789
# 4. ✅ Quiz starts successfully
```

### Test 2: Pending Student
```bash
# 1. Register student (status = pending by default)
curl -X POST http://localhost:8080/api/register/course/1 \
  -d '{"phone_number":"09987654321",...}'

# 2. Student opens quiz and enters phone: 09987654321
# 3. ❌ Error: "Your registration is pending approval"
```

### Test 3: Unregistered Phone
```bash
# 1. Student opens quiz
# 2. Enters phone number that doesn't exist: 09999999999
# 3. ❌ Error: "This phone number is not registered"
```

## Migration Notes

### For Existing Quiz Links
- All existing quiz links still work: `/quiz?package=ID`
- Only the input field changed (name → phone number)
- No database migration needed
- Backward compatible

### For Students
- Students must use the **same phone number** they registered with
- If phone number was changed in registration, they must contact admin
- Case-sensitive phone number matching (ensure consistency)

## API Documentation

### Endpoint: Check Phone Number for Quiz

**URL**: `/api/quiz/check-phone`

**Method**: `GET`

**Authentication**: None (Public)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| course_id | integer | Yes | The course ID from quiz package |
| phone_number | string | Yes | Student's registered phone number |

**Success Response** (Approved):
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "approved": true,
  "student_id": 123,
  "student_name": "John Doe",
  "message": "You are approved to take this quiz."
}
```

**Success Response** (Not Approved):
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "approved": false,
  "message": "Your registration is pending approval. Please wait for admin confirmation."
}
```

**Error Response** (Missing Parameters):
```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Phone number is required"
}
```

## Future Enhancements

1. **Phone Number Formatting**: Auto-format phone numbers (add country code, remove spaces)
2. **Multiple Attempts**: Track quiz attempts per student via student_id
3. **OTP Verification**: Send OTP to phone number for extra security
4. **Remember Me**: Cache verified phone number in browser (with expiry)
5. **Admin Dashboard**: Show which students attempted to access quiz but were blocked

---

**Last Updated**: 2025-11-18
**Status**: ✅ Implemented and Tested
