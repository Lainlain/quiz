# Registration Status Logic - Declined Handling

## Overview
Updated the registration system to handle declined enrollments differently. Students whose registration was declined can now register again, while pending and approved registrations will show the appropriate status message.

## Key Logic Changes

### 1. **Declined Status = Not Registered**
When a registration is declined, the system treats it as if the student is not registered:
- ✅ Student can register again
- ✅ Previous declined enrollment is updated to "pending"
- ✅ No error shown for declined registrations

### 2. **Pending/Approved = Already Registered**
When a registration is pending or approved:
- ❌ Student cannot register again
- ✅ Shows error: "This phone number is already registered"
- ✅ Auto-switches to show current status (pending or approved)

## Registration Flow by Status

### 📋 Status: Not Registered (New Student)
**Scenario:** Phone number not in system
```
1. Student fills form with phone: 09111111111
2. Submits → Server creates new user + enrollment (status: pending)
3. Shows: "⏳ Registration Pending - Waiting for Admin Approval"
```

### ⏳ Status: Pending (Waiting for Approval)
**Scenario:** Phone number already registered, status = pending
```
1. Student fills form with same phone: 09111111111
2. Submits → Server checks: phone exists + enrollment pending
3. Error: "This phone number is already registered for this course"
4. Modal pops up with 5-second countdown
5. Auto-switches to: "⏳ Registration Pending - Waiting for Admin Approval"
```

### ✅ Status: Approved (Already Approved)
**Scenario:** Admin approved the registration
```
1. Student fills form with same phone: 09111111111
2. Submits → Server checks: phone exists + enrollment approved
3. Error: "This phone number is already registered for this course"
4. Modal pops up with 5-second countdown
5. Auto-switches to: "✅ Registration Approved! - Go to Login"
```

### ❌ Status: Declined (Can Re-register)
**Scenario:** Admin declined the registration
```
1. Student fills form with same phone: 09111111111
2. Submits → Server checks: phone exists + enrollment declined
3. Server updates enrollment: declined → pending (re-registration)
4. Shows: "⏳ Registration Pending - Waiting for Admin Approval"
5. NO ERROR - Treated as new registration
```

## Backend Implementation

### CheckRegistrationStatus API
**Endpoint:** `GET /api/register/check/:courseId?phone_number=xxx`

**Logic:**
```go
// If enrollment is declined, return as "not registered"
if enrollment.Status == models.EnrollmentDeclined {
    return {
        "registered": false,
        "message": "Previous registration was declined. You can register again."
    }
}

// Otherwise return actual status (pending/approved)
return {
    "registered": true,
    "status": enrollment.Status, // "pending" or "approved"
    "name": user.Name,
    "email": user.Email,
    ...
}
```

### RegisterForCourse API
**Endpoint:** `POST /api/register/course/:courseId`

**Logic:**
```go
// Check if phone number already registered
if existingEnrollment found {
    // If declined, update to pending (allow re-registration)
    if existingEnrollment.Status == EnrollmentDeclined {
        existingEnrollment.Status = EnrollmentPending
        Save()
        return Success("Registration submitted successfully!")
    }
    
    // If pending or approved, return error
    return Error("This phone number is already registered", {
        "already_registered": true,
        "status": existingEnrollment.Status
    })
}
```

## Status Display Messages

### 🟡 Pending Status
```
⏳ Registration Pending
Your registration has been submitted successfully.
Waiting for Admin Approval
You will receive a notification once your registration is approved.
```

**When shown:**
- After successful new registration
- After declined → re-registered
- When trying to register with pending phone number

### 🟢 Approved Status
```
✅ Registration Approved!
Your registration has been approved by the admin.
🎉 You can now access the course!
[Go to Login Button]
```

**When shown:**
- When trying to register with approved phone number
- System detects: phone exists + status = approved

### 🔴 Declined Status
**NOT SHOWN TO STUDENTS**

Declined registrations are treated as "not registered":
- Student sees empty form
- Can register again without any indication of previous decline
- Previous declined enrollment is updated to pending

## Error Handling

### Error: Phone Already Registered (Pending)
```json
{
  "error": "This phone number is already registered for this course",
  "already_registered": true,
  "status": "pending"
}
```
**Frontend Action:**
- Shows error modal
- After 5 seconds → Shows "⏳ Pending" status

### Error: Phone Already Registered (Approved)
```json
{
  "error": "This phone number is already registered for this course",
  "already_registered": true,
  "status": "approved"
}
```
**Frontend Action:**
- Shows error modal
- After 5 seconds → Shows "✅ Approved" status with login button

### Success: Declined → Re-registered
```json
{
  "message": "Registration submitted successfully! Waiting for admin approval.",
  "status": "pending"
}
```
**Frontend Action:**
- No error
- Directly shows "⏳ Pending" status
- No indication of previous decline

## Use Cases

### Use Case 1: First Time Registration
```
Phone: 09111111111 (NEW)
Status: Not in system
Result: ✅ Create user + enrollment (pending)
Display: "⏳ Registration Pending"
```

### Use Case 2: Duplicate Registration (Pending)
```
Phone: 09111111111 (EXISTS)
Current Status: pending
Result: ❌ Error "Already registered"
Display: "⏳ Registration Pending" (after 5 seconds)
```

### Use Case 3: Re-registration After Approval
```
Phone: 09111111111 (EXISTS)
Current Status: approved
Result: ❌ Error "Already registered"
Display: "✅ Registration Approved" + Login Button (after 5 seconds)
```

### Use Case 4: Re-registration After Decline
```
Phone: 09111111111 (EXISTS)
Current Status: declined
Result: ✅ Update enrollment: declined → pending
Display: "⏳ Registration Pending"
Note: No error, no indication of previous decline
```

### Use Case 5: Admin Workflow
```
1. Student registers → Status: pending
2. Admin reviews in dashboard
3. Admin clicks "Decline" → Status: declined
4. Student registers again → Status: pending (new chance)
5. Admin can approve or decline again
```

## Admin Dashboard Behavior

### View Enrollments
- Shows ALL enrollments: pending, approved, declined
- Filter by status
- Can see registration history

### Approve Enrollment
- Changes status: pending → approved
- Student can now login
- Student sees "Approved" message if they try to register again

### Decline Enrollment
- Changes status: pending → declined
- Student does NOT see this status
- Student can register again
- Previous declined enrollment gets updated (not deleted)

## Database Behavior

### Enrollment Records
- **Never deleted** - All registrations are kept in history
- **Status changes** tracked: pending → approved/declined → pending (if re-registered)
- **One enrollment per student per course** (soft updates, not new records)

### Phone Number Uniqueness
- ✅ Phone number is unique across all users
- ✅ One phone = one user account
- ✅ One user can have multiple enrollments (different courses)
- ✅ Each enrollment has its own status per course

## Testing Scenarios

### Test 1: Normal Registration
1. Visit `/register/1`
2. Fill form: phone `09111111111`
3. Submit
4. ✅ Should show "Registration Pending"

### Test 2: Duplicate (Pending)
1. Register with `09111111111`
2. Try to register again with same phone
3. ✅ Should show error modal
4. ✅ After 5 seconds, shows "Registration Pending"

### Test 3: After Admin Approval
1. Admin approves `09111111111`
2. Student tries to register again
3. ✅ Should show error modal
4. ✅ After 5 seconds, shows "Registration Approved" + Login button

### Test 4: After Admin Decline (Important!)
1. Admin declines `09111111111`
2. Student tries to register again
3. ✅ Should NOT show error
4. ✅ Directly shows "Registration Pending"
5. ✅ Database: enrollment updated from declined → pending

### Test 5: Check Registration API
```bash
# Check pending registration
curl "/api/register/check/1?phone_number=09111111111"
# Response: {"registered": true, "status": "pending", ...}

# Check approved registration
curl "/api/register/check/1?phone_number=09222222222"
# Response: {"registered": true, "status": "approved", ...}

# Check declined registration
curl "/api/register/check/1?phone_number=09333333333"
# Response: {"registered": false, "message": "Previous registration was declined. You can register again."}
```

## Benefits

### For Students
- ✅ **Second Chance**: Declined students can register again
- ✅ **No Shame**: Previous decline is not shown
- ✅ **Clear Status**: See if pending or approved
- ✅ **No Confusion**: Can't accidentally register twice (pending/approved)

### For Admins
- ✅ **Full Control**: Can approve/decline as needed
- ✅ **Flexible**: Students can re-apply after decline
- ✅ **History Tracking**: All enrollment attempts are recorded
- ✅ **Easy Management**: Clear status for each student

### For System
- ✅ **Data Integrity**: Phone number remains unique
- ✅ **Status Tracking**: Complete enrollment history
- ✅ **Soft Updates**: No record deletion, only status changes
- ✅ **Audit Trail**: Can see all status changes over time

---

**Implementation Date:** 2025-11-18  
**Status:** ✅ Active  
**Server:** Running on port 8080  
**Test URL:** http://localhost:8080/register/1
