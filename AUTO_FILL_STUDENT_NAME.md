# Auto-Fill Student Name Feature

## Overview
This feature automatically fills in the student's name based on their device fingerprint from previous quiz attempts. When a student takes a second quiz (different quiz, not retaking the same one), their name is remembered and auto-filled.

## How It Works

### 1. First Quiz Attempt
```
Student opens Quiz A
       ↓
Device fingerprint generated: "abc123..."
       ↓
Check device in database → Not found
       ↓
Student enters name: "John Doe"
       ↓
Submit quiz → Save with device_id
```

**Database Record:**
```
attempt_id: 1
student_id: 2
quiz_package_id: 1
device_id: "abc123..."
student_name: "John Doe" (in users table)
```

### 2. Second Quiz Attempt (Different Quiz)
```
Student opens Quiz B
       ↓
Device fingerprint generated: "abc123..." (same device)
       ↓
Check device in database:
  - Quiz B not taken by this device ✅
  - But device has taken Quiz A before ✅
       ↓
Retrieve student name from Quiz A attempt
       ↓
Auto-fill name input: "John Doe" ✨
       ↓
Student can edit or keep the name
       ↓
Submit Quiz B
```

## API Response

### Check Device Endpoint
**GET** `/api/quiz/check-device?quiz_package_id=2&device_id=abc123...`

**Response when device took Quiz A but not Quiz B:**
```json
{
  "already_taken": false,
  "student_name": "John Doe"
}
```

**Response when device already took Quiz B:**
```json
{
  "already_taken": true,
  "student_name": "John Doe"
}
```

**Response when device never took any quiz:**
```json
{
  "already_taken": false,
  "student_name": ""
}
```

## Backend Logic

### `CheckDeviceEligibility` Function
```go
func (h *StudentHandler) CheckDeviceEligibility(c *gin.Context) {
    quizPackageID := c.Query("quiz_package_id")
    deviceID := c.Query("device_id")
    
    var attempt models.Attempt
    var studentName string
    
    // Step 1: Check if device took THIS specific quiz
    err := database.DB.Where(
        "quiz_package_id = ? AND device_id = ? AND status = ?",
        quizPackageID, deviceID, models.StatusCompleted,
    ).First(&attempt).Error
    
    alreadyTakenThisQuiz := err == nil
    
    // Step 2: If not taken, get student name from any previous quiz
    if !alreadyTakenThisQuiz {
        err = database.DB.Where(
            "device_id = ? AND status = ?", 
            deviceID, models.StatusCompleted,
        ).Order("created_at DESC").First(&attempt).Error
    }
    
    // Step 3: Get student name from user record
    if err == nil {
        var user models.User
        if err := database.DB.First(&user, attempt.StudentID).Error; err == nil {
            studentName = user.Name
        }
    }
    
    c.JSON(http.StatusOK, gin.H{
        "already_taken": alreadyTakenThisQuiz,
        "student_name":  studentName,
    })
}
```

## Frontend Logic

### `checkDeviceEligibility` Method
```javascript
async checkDeviceEligibility() {
    try {
        const response = await fetch(
            `/api/quiz/check-device?quiz_package_id=${this.quizPackageId}&device_id=${this.deviceId}`
        );
        const data = await response.json();
        
        if (data.already_taken) {
            // Block if already took this specific quiz
            alert('You have already taken this quiz from this device.');
            this.currentScreen = 'blocked';
        } else if (data.student_name) {
            // Auto-fill if took a different quiz before
            this.studentName = data.student_name;
            console.log('Auto-filled student name:', this.studentName);
        }
    } catch (error) {
        console.error('Error checking device eligibility:', error);
    }
}
```

## User Experience

### Scenario 1: New Student (First Time)
1. Opens quiz link
2. Name field is **empty**
3. Must enter name manually
4. Submits quiz

### Scenario 2: Returning Student (Different Quiz)
1. Opens different quiz link
2. Name field is **auto-filled** with "John Doe" ✨
3. Can keep or edit the name
4. Submits quiz

### Scenario 3: Same Quiz Again
1. Opens same quiz link
2. **Blocked immediately** 🚫
3. Cannot take quiz again

## Benefits

### For Students
- ✅ **Convenience**: No need to retype name for each quiz
- ✅ **Consistency**: Ensures same name across all quizzes
- ✅ **Speed**: Faster quiz start

### For Administrators
- ✅ **Data Quality**: Consistent student names in reports
- ✅ **Identity Tracking**: Easier to track student performance across quizzes
- ✅ **Reduced Errors**: Less typos in student names

## Technical Implementation

### Files Modified

1. **`internal/handlers/student.go`**
   ```go
   // Modified CheckDeviceEligibility to return student_name
   // Checks previous attempts on same device
   // Returns name from most recent attempt
   ```

2. **`web/static/js/quiz.js`**
   ```javascript
   // Modified checkDeviceEligibility()
   // Auto-fills this.studentName if returned from API
   // Only if quiz not already taken
   ```

3. **`web/templates/public/quiz.html`**
   ```html
   <!-- Updated script version to v4.0 -->
   <script src="/static/js/quiz.js?v=4.0"></script>
   ```

## Database Queries

### Query 1: Check if device took this specific quiz
```sql
SELECT * FROM attempts 
WHERE quiz_package_id = ? 
  AND device_id = ? 
  AND status = 'completed'
LIMIT 1;
```

### Query 2: Get student name from any previous quiz
```sql
SELECT * FROM attempts 
WHERE device_id = ? 
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 1;
```

### Query 3: Get student name from user
```sql
SELECT * FROM users 
WHERE id = ?
LIMIT 1;
```

## Edge Cases Handled

### Case 1: Student Changes Name
- Student can edit auto-filled name
- New name will be used for this quiz
- Creates new guest user with new name
- Next quiz will use the most recent name

### Case 2: Multiple Quizzes Same Day
- Each quiz remembers the last used name
- Name auto-fills for quiz 2, 3, 4, etc.
- Consistent experience across all quizzes

### Case 3: Device Shared by Multiple Students
- Device fingerprint is the same
- Last student's name will auto-fill
- Each student can change the name
- System creates separate guest users

### Case 4: No Previous Attempts
- API returns empty `student_name`
- Input field remains empty
- Student must enter name manually

## Privacy Considerations

- **Anonymous by Design**: Device ID is a hash, not personal data
- **No Tracking**: System only remembers name-device association
- **Local to System**: Data stays in application database
- **User Control**: Students can always change auto-filled name

## Testing

### Test 1: First Quiz
```bash
# Open Quiz A
curl "http://localhost:8080/api/quiz/check-device?quiz_package_id=1&device_id=abc123"

# Expected Response:
{"already_taken":false,"student_name":""}
```

### Test 2: Second Quiz (After Taking Quiz A)
```bash
# Open Quiz B
curl "http://localhost:8080/api/quiz/check-device?quiz_package_id=2&device_id=abc123"

# Expected Response:
{"already_taken":false,"student_name":"John Doe"}
```

### Test 3: Retake Same Quiz
```bash
# Open Quiz A again
curl "http://localhost:8080/api/quiz/check-device?quiz_package_id=1&device_id=abc123"

# Expected Response:
{"already_taken":true,"student_name":"John Doe"}
```

## Future Enhancements

1. **Student Profile**
   - Store additional info (class, student ID)
   - Auto-fill all fields

2. **Name Suggestions**
   - Show dropdown of previous names used on device
   - Allow selecting from list

3. **Admin Override**
   - Admin can clear device associations
   - Reset auto-fill for specific devices

4. **Analytics**
   - Track how often auto-fill is used
   - Measure time saved per student

---

**Version**: 1.0  
**Last Updated**: October 6, 2025  
**Status**: ✅ Production Ready
