# Phone Number-Based Registration System

## Overview
The registration system now uses **phone number as the unique identifier** for students. This ensures each phone number can only register once per course, and the system remembers registration status across browser sessions.

## Key Features

### 1. Phone Number as Unique ID
- ✅ Phone numbers are unique in the database (cannot duplicate)
- ✅ Phone number is used to identify returning users
- ✅ When registering for a new course, existing phone numbers are recognized
- ✅ One phone number = one account across all courses

### 2. Browser Memory (LocalStorage + Cookies)
When a student successfully registers:
- **LocalStorage**: Stores phone number with key `registration_phone_{courseId}`
- **Cookie**: Stores phone number for 30 days as backup
- **On page reload**: System checks if phone number is stored, then verifies with server

### 3. Registration Status Check
On page load, the system:
1. Checks localStorage for saved phone number
2. Queries server: `GET /api/register/check/:courseId?phone_number=xxx`
3. If already registered → Shows "Waiting for Approval" message
4. If not registered → Shows registration form (with phone pre-filled)

## Database Changes

### User Model (user.go)
```go
PhoneNumber string `gorm:"type:varchar(20);unique;not null" json:"phone_number"`
```

**Constraints:**
- `unique`: No duplicate phone numbers allowed
- `not null`: Phone number is required for all students

## API Endpoints

### 1. Register for Course (POST)
**Endpoint:** `POST /api/register/course/:courseId`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@gmail.com",
  "phone_number": "09123456789",
  "address": "Yangon, Myanmar",
  "facebook_url": "https://facebook.com/john"
}
```

**Success Response (New User):**
```json
{
  "message": "Registration submitted successfully! Waiting for admin approval.",
  "status": "pending",
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@gmail.com"
  }
}
```

**Success Response (Existing User, New Course):**
```json
{
  "message": "Registration submitted successfully! Waiting for admin approval.",
  "status": "pending",
  "already_registered": true
}
```

**Error Response (Already Registered for This Course):**
```json
{
  "error": "This phone number is already registered for this course",
  "already_registered": true
}
```

**Error Response (Phone Number Exists, Different Email):**
```json
{
  "error": "This email is already registered. Please use a different email or contact admin."
}
```

### 2. Check Registration Status (GET)
**Endpoint:** `GET /api/register/check/:courseId?phone_number={phone}`

**Query Parameters:**
- `phone_number` (required): Phone number to check

**Response (Not Registered):**
```json
{
  "registered": false,
  "message": "Phone number not registered"
}
```

**Response (Registered but Not in This Course):**
```json
{
  "registered": false,
  "message": "Not registered for this course"
}
```

**Response (Already Registered for This Course):**
```json
{
  "registered": true,
  "status": "pending",
  "name": "John Doe",
  "email": "john@gmail.com",
  "course_name": "N5 Japanese",
  "enrolled_at": "2025-11-17T15:30:00Z"
}
```

## Registration Flow

### First-Time Registration
1. Student visits: `http://localhost:8080/register/1`
2. System checks localStorage (no phone found)
3. Shows empty registration form
4. Student fills: Name, Email, **Phone Number**, Address, Facebook
5. Student submits form
6. Backend checks:
   - ✅ Phone number unique? → Create new user
   - ❌ Phone exists? → Check if already enrolled in this course
7. Creates pending enrollment
8. Saves phone number to localStorage and cookie
9. Shows success message: "Waiting for Admin Approval"

### Returning User (Same Browser)
1. Student visits: `http://localhost:8080/register/1`
2. System finds phone in localStorage: `09123456789`
3. Queries server: `/api/register/check/1?phone_number=09123456789`
4. Server responds: Already registered, status pending
5. **Automatically shows "Waiting for Approval" message** (no form shown)
6. Displays: Name, Email, Course Name, Registration Date

### Returning User (Different Browser/Device)
1. Student visits: `http://localhost:8080/register/1`
2. No phone in localStorage (different device)
3. Shows registration form
4. Student enters phone number: `09123456789`
5. Student submits form
6. Backend detects phone already exists for this course
7. Returns error: "This phone number is already registered"
8. Frontend saves phone to localStorage
9. Shows "Waiting for Approval" message

### Existing User, New Course
1. Student with phone `09123456789` registered for Course 1
2. Student visits: `http://localhost:8080/register/2` (Course 2)
3. Enters same phone number: `09123456789`
4. Backend finds user by phone
5. Backend checks: Not enrolled in Course 2 yet
6. Creates new enrollment for Course 2 (reuses existing user account)
7. Success: "Registration submitted successfully!"

## Frontend Logic (register.html)

### Phone Number Storage
```javascript
// Save phone number after successful registration
const registrationKey = `registration_phone_${this.courseId}`;
localStorage.setItem(registrationKey, this.formData.phone_number);

// Set cookie (30 days expiry)
document.cookie = `registered_course_${this.courseId}=${this.formData.phone_number}; expires=${expiryDate}; path=/`;
```

### Check Registration on Load
```javascript
async init() {
    // Get saved phone from localStorage
    const savedPhone = localStorage.getItem(`registration_phone_${this.courseId}`);
    
    if (savedPhone) {
        // Check with server if still registered
        await this.checkRegistrationByPhone(savedPhone);
    }
    
    await this.loadCourseInfo();
}
```

### Handle Already Registered Error
```javascript
if (data.already_registered) {
    this.submitted = true; // Show "Waiting for Approval" message
    localStorage.setItem(registrationKey, this.formData.phone_number);
}
```

## Backend Logic (auth.go)

### Phone Number Check Priority
1. **First**: Check phone number uniqueness
   - If exists + already enrolled → Error: "Already registered"
   - If exists + not enrolled → Create enrollment (reuse account)
2. **Second**: Check email uniqueness
   - If exists → Error: "Email already registered"
3. **Third**: Create new user + enrollment

### Code Flow
```go
// 1. Check phone number
var existingUserByPhone models.User
if err := database.DB.Where("phone_number = ?", req.PhoneNumber).First(&existingUserByPhone).Error; err == nil {
    // Phone exists, check enrollment
    var existingEnrollment models.Enrollment
    if err := database.DB.Where("student_id = ? AND course_id = ?", existingUserByPhone.ID, courseID).First(&existingEnrollment).Error; err == nil {
        // Already enrolled
        return gin.H{"error": "This phone number is already registered for this course", "already_registered": true}
    }
    // Create enrollment for existing user
    // ...
}

// 2. Check email (if phone not found)
var existingUserByEmail models.User
if err := database.DB.Where("email = ?", req.Email).First(&existingUserByEmail).Error; err == nil {
    return gin.H{"error": "This email is already registered"}
}

// 3. Create new user
// ...
```

## User Experience

### Mobile-Friendly Scenario
1. **Day 1**: Student registers with phone `09123456789`
   - Fills form on mobile phone
   - Submits successfully
   - Sees "Waiting for Approval" message

2. **Day 2**: Student revisits on same phone
   - Opens registration link again
   - **Automatically sees "Waiting for Approval"** (no form!)
   - No need to fill anything again

3. **Day 3**: Student tries on different phone
   - Opens registration link
   - Fills form with same phone `09123456789`
   - Submits → Gets "Already registered" error
   - **Automatically switches to "Waiting for Approval" view**

4. **Day 5**: Admin approves enrollment
   - Student can now login with phone/email + auto-generated password

### Admin Workflow
1. Admin sees pending enrollment in dashboard
2. Reviews student details:
   - Name: John Doe
   - Phone: 09123456789 (**unique identifier**)
   - Email: john@gmail.com
   - Address: Yangon, Myanmar
   - Facebook: facebook.com/john
3. Clicks "Approve"
4. Student can now access course materials

## Benefits

### For Students
- ✅ **Easy to remember**: Phone number is their ID
- ✅ **No duplicate registrations**: Can't register twice by mistake
- ✅ **Multi-device support**: Same phone number works on any device
- ✅ **Browser memory**: Don't need to fill form again on same device
- ✅ **Multiple courses**: Same phone number for all courses

### For Admins
- ✅ **Unique identification**: Phone number is unique per student
- ✅ **No fake accounts**: One phone = one account
- ✅ **Easy contact**: Direct phone number for communication
- ✅ **Multi-course tracking**: See all courses student enrolled in

### Technical
- ✅ **Database integrity**: Phone number has unique constraint
- ✅ **API validation**: Server checks phone uniqueness
- ✅ **Client-side caching**: LocalStorage + cookies
- ✅ **Server verification**: Always checks current status from DB
- ✅ **Graceful errors**: Clear messages for duplicate attempts

## Security Considerations

### Phone Number Privacy
- Phone numbers are stored securely in database
- Only visible to admin users
- Not exposed in public APIs

### Validation
- Server-side validation for phone number format
- Client-side validation before submission
- Unique constraint at database level

### Data Consistency
- Server always has final say (localStorage is just cache)
- Phone number status checked on every page load
- Expired cache doesn't affect actual registration status

## Testing

### Test Case 1: New User Registration
1. Visit `/register/1`
2. Fill form with phone `09111111111`
3. Submit → Success
4. Reload page → See "Waiting for Approval"

### Test Case 2: Duplicate Registration (Same Device)
1. Register with phone `09222222222`
2. Clear form (manually)
3. Try to submit again → Error: "Already registered"
4. Auto-switches to "Waiting for Approval" view

### Test Case 3: Duplicate Registration (Different Device)
1. Device A: Register with phone `09333333333`
2. Device B: Try to register with same phone
3. Submit → Error: "Already registered"
4. Device B now shows "Waiting for Approval"

### Test Case 4: Multi-Course Registration
1. Register phone `09444444444` for Course 1 → Success
2. Visit `/register/2` (Course 2)
3. Register same phone → Success (reuses account)
4. Now enrolled in both courses with one account

### Test Case 5: Different Email, Same Phone
1. Register: phone `09555555555`, email `user1@gmail.com`
2. Try to register: phone `09555555555`, email `user2@gmail.com`
3. Existing user is recognized by phone
4. New enrollment created (email is ignored, phone is ID)

## Troubleshooting

### Issue: "This email is already registered"
**Cause:** Someone else registered with that email (but different phone)
**Solution:** Use a different email address

### Issue: "This phone number is already registered for this course"
**Cause:** Phone number already registered for this specific course
**Solution:** 
- If it's you: Wait for admin approval
- If not you: Contact admin with proof of phone ownership

### Issue: Form shows again after registration
**Cause:** localStorage was cleared or cookies were deleted
**Solution:** 
- Enter your phone number again
- System will recognize you and show approval status
- No duplicate registration will be created

### Issue: Can't register for new course
**Cause:** May not be logged in or account not approved yet
**Solution:** 
- First course needs admin approval
- After approval, use login to access other courses

## Future Enhancements

Consider implementing:
1. **Phone OTP verification**: Verify phone ownership during registration
2. **SMS notifications**: Send approval status via SMS
3. **Phone-based login**: Login with phone + password (no email needed)
4. **International format**: Support +95, 09, etc. formats
5. **Phone number editing**: Allow users to update their phone (with admin approval)

---

**Implementation Date:** 2025-11-18  
**Server Status:** Running on port 8080  
**Test URL:** http://localhost:8080/register/1
