# Device Restriction Feature

## Overview
This document explains the device restriction feature that ensures each student can only take a quiz once per device, preventing multiple attempts from the same browser.

## How It Works

### 1. Device Fingerprinting
When a student loads the quiz page, a unique device fingerprint is generated using:

- **Screen properties**: Width, height, color depth
- **Timezone**: User's timezone setting
- **Language**: Browser language preference
- **Platform**: Operating system
- **Hardware**: CPU cores count
- **User Agent**: Browser identification string
- **Canvas Fingerprint**: Unique rendering signature
- **WebGL Fingerprint**: Graphics card information

All these components are combined and hashed using SHA-256 to create a unique device ID.

### 2. Device Check on Quiz Load
```javascript
// In quiz.js - init() function
async init() {
    // Generate device fingerprint
    this.deviceId = await generateDeviceFingerprint();
    
    // Get quiz package ID from URL
    this.quizPackageId = urlParams.get('package');
    
    // Load quiz data
    await this.loadQuizData();
    
    // Check if device already took this quiz
    await this.checkDeviceEligibility();
}
```

The system checks:
- Calls `GET /api/quiz/check-device?quiz_package_id=X&device_id=Y`
- Backend queries database for completed attempts with matching device_id and quiz_package_id
- If found, displays blocked screen
- If not found, allows student to proceed

### 3. Device ID Storage
When a student submits the quiz:
```go
attempt := models.Attempt{
    StudentID:     guestUser.ID,
    CourseID:      req.CourseID,
    QuizPackageID: req.QuizPackageID,
    DeviceID:      req.DeviceID,  // Stored in database
    Status:        models.StatusCompleted,
    // ... other fields
}
```

## Database Schema

### Attempts Table
```sql
CREATE TABLE attempts (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    quiz_package_id INTEGER NOT NULL,
    device_id VARCHAR(255),  -- NEW FIELD
    status VARCHAR(20),
    -- ... other fields
);

CREATE INDEX idx_attempts_device_id ON attempts(device_id);
```

## API Endpoints

### Check Device Eligibility
**GET** `/api/quiz/check-device`

**Query Parameters:**
- `quiz_package_id`: ID of the quiz package
- `device_id`: Device fingerprint hash

**Response:**
```json
{
  "already_taken": true,
  "attempts": 1
}
```

### Submit Quiz with Device ID
**POST** `/api/quiz/submit`

**Request Body:**
```json
{
  "student_name": "John Doe",
  "course_id": 1,
  "quiz_package_id": 1,
  "device_id": "abc123def456...",  // SHA-256 hash
  "score": 85,
  "total_points": 100,
  "time_taken": 1800,
  "answers": [...]
}
```

## User Experience

### First Time Taking Quiz
1. Student opens quiz link
2. Device fingerprint generated (invisible to user)
3. System checks eligibility
4. Student enters name and starts quiz
5. Completes quiz and submits
6. Device ID saved with attempt

### Second Time (Same Device)
1. Student opens quiz link
2. Device fingerprint generated
3. System checks eligibility → finds previous attempt
4. **Blocked screen displayed** with message:
   ```
   🚫 Quiz Already Taken
   
   You have already completed this quiz from this device.
   Each student can only take the quiz once per device to ensure fairness.
   ```

## Testing Scenarios

### ✅ Will Be Blocked
- Taking quiz twice from same browser
- Refreshing page after completing quiz
- Using same browser after clearing history (device fingerprint stays same)

### ✅ Will NOT Be Blocked (Different Device)
- Different browser (Chrome vs Firefox = different fingerprint)
- Different computer/laptop
- Incognito/Private mode (may have slightly different fingerprint)
- Different user account on same computer (if user agent differs)

## Technical Implementation

### Files Modified

1. **`internal/models/attempt.go`**
   - Added `DeviceID string` field to Attempt model
   - Added database index for faster lookups

2. **`internal/handlers/student.go`**
   - Added `DeviceID` to `PublicQuizSubmission` struct
   - Added `CheckDeviceEligibility()` handler
   - Modified `SubmitPublicQuiz()` to store device_id

3. **`cmd/server/main.go`**
   - Added route: `GET /api/quiz/check-device`

4. **`web/static/js/quiz.js`**
   - Added `generateDeviceFingerprint()` function
   - Added `deviceId` property to quiz app
   - Added `checkDeviceEligibility()` method
   - Modified `saveAttempt()` to include device_id

5. **`web/templates/public/quiz.html`**
   - Added blocked screen template
   - Updated script version to v3.0

## Security Considerations

### Strengths
- ✅ Prevents casual retakes
- ✅ Works without cookies or localStorage
- ✅ No user registration required
- ✅ Difficult to bypass without technical knowledge

### Limitations
- ⚠️ Can be bypassed by:
  - Using different browser
  - Using different device
  - Using VPN with different settings
  - Sophisticated users spoofing fingerprint components

### Recommendations
- Use in combination with other security measures
- Monitor for suspicious patterns (same student name, similar scores)
- Consider IP-based rate limiting for additional security
- For high-stakes exams, consider authenticated student accounts

## Migration
The database migration happens automatically when server starts:
```
ALTER TABLE attempts ADD device_id varchar(255)
CREATE INDEX idx_attempts_device_id ON attempts(device_id)
```

Existing attempts without device_id will have NULL values and won't block future attempts.

## Future Enhancements

1. **Admin Dashboard Stats**
   - Show number of blocked attempts
   - Display device fingerprint patterns

2. **Multiple Attempt Limits**
   - Allow X attempts per device (configurable)
   - Track attempt number per device

3. **Device Whitelist**
   - Allow specific devices to bypass restrictions
   - Useful for demo/testing purposes

4. **Enhanced Fingerprinting**
   - Add more fingerprint components
   - Machine learning to detect spoofing attempts

---

**Last Updated**: October 6, 2025  
**Version**: 1.0  
**Author**: Quiz System Development Team
