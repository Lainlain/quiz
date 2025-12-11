# City Search Fix - Quick Update

## Issue
User couldn't search by city in the student search feature.

## Root Cause
The `city` field was not included in the search filter functions, even though the field exists in the database.

## Fix Applied

### 1. JavaScript Changes (`web/static/js/dashboard.js`)

**Added city to `searchStudents()` function:**
```javascript
this.filteredAllStudents = this.allStudents.filter(student => {
    return (
        (student.name || '').toLowerCase().includes(query) ||
        (student.email || '').toLowerCase().includes(query) ||
        (student.phone_number || '').toLowerCase().includes(query) ||
        (student.postal_code || '').toLowerCase().includes(query) ||
        (student.city || '').toLowerCase().includes(query) ||        // ✅ ADDED
        (student.course_name || '').toLowerCase().includes(query)
    );
});
```

**Added city to `searchCourseEnrollments()` function:**
```javascript
this.filteredCourseEnrollments = this.courseEnrollments.filter(enrollment => {
    return (
        (enrollment.name || '').toLowerCase().includes(query) ||
        (enrollment.email || '').toLowerCase().includes(query) ||
        (enrollment.phone_number || '').toLowerCase().includes(query) ||
        (enrollment.postal_code || '').toLowerCase().includes(query) ||
        (enrollment.city || '').toLowerCase().includes(query) ||      // ✅ ADDED
        (enrollment.address || '').toLowerCase().includes(query)
    );
});
```

### 2. UI Changes (`web/templates/admin/dashboard.html`)

**Updated placeholder text - All Students view:**
```html
<!-- Before -->
placeholder="Search by name, email, phone, postal code..."

<!-- After -->
placeholder="Search by name, email, phone, city, postal code..."
```

**Updated placeholder text - By Course view:**
```html
<!-- Before -->
placeholder="Search by name, email, phone, postal code, address..."

<!-- After -->
placeholder="Search by name, email, phone, city, postal code, address..."
```

## Testing

### Test Cases:

**✅ Search by city name:**
```
Type: "Tokyo"
Result: Shows all students in Tokyo
```

**✅ Search by partial city name:**
```
Type: "tok"
Result: Shows all students with "tok" in city (Tokyo, Tokorozawa, etc.)
```

**✅ Case insensitive:**
```
Type: "TOKYO" or "tokyo" or "Tokyo"
Result: All work the same
```

**✅ Works in All Students view**
**✅ Works in By Course view**

## Now Searchable Fields:

### All Students View:
1. Name
2. Email
3. Phone Number
4. **City** ✅ NEW
5. Postal Code
6. Course Name

### By Course View:
1. Name
2. Email
3. Phone Number
4. **City** ✅ NEW
5. Postal Code
6. Address

## Files Modified:
- ✅ `web/static/js/dashboard.js` - Added city to both search functions
- ✅ `web/templates/admin/dashboard.html` - Updated placeholder text (both views)
- ✅ `STUDENT_SEARCH_FEATURE.md` - Updated documentation

## Status: ✅ FIXED!

Users can now search by city in both All Students and By Course views! 🎉

---

**Date**: December 10, 2025
**Issue**: Can't search by city
**Status**: Resolved ✅
