# Question Image Upload Feature

## Overview
Quiz questions now support optional images that can be uploaded directly from the admin dashboard. Images are uploaded with a progress bar and displayed both in the admin panel and on the quiz page for students.

## Features

### ✨ Key Features
- 📤 **Direct File Upload**: Upload images directly from your computer
- 📊 **Upload Progress Bar**: Real-time upload progress with percentage
- 🖼️ **Image Preview**: See uploaded image before saving question
- 🗑️ **Remove Image**: Option to remove uploaded image
- ✅ **File Validation**: Automatic validation of file size and type
- 🎨 **Responsive Display**: Images display beautifully on all devices

## For Admin Users

### How to Add Image to Question

1. **Go to Admin Dashboard** → Questions tab
2. **Click "Add Question"** or edit existing question
3. **Click "Choose Image" button** under "Question Image"
4. **Select an image file** from your computer
5. **Watch the upload progress** (shows percentage)
6. **See preview** once upload completes
7. **Fill in other question details** and save

### Supported Image Formats
- ✅ JPG/JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP

### File Size Limit
- Maximum: **5MB per image**

### Image Requirements
- Recommended dimensions: **800x600 pixels** or similar ratio
- Clear and readable
- Relevant to the question

### Removing an Image
1. Click **"Remove Image"** button below the preview
2. Confirm the removal
3. Upload a new image or save without image

## For Students

### How Images Appear in Quiz
- Images display **below the question text**
- **Responsive sizing**: Adjusts to screen size
- **Mobile-optimized**: Works great on phones
- **Fallback**: If image fails to load, it's hidden automatically

## Technical Details

### Backend

#### New API Endpoints

**Upload Image**
```
POST /api/admin/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: FormData with 'image' field
```

**Response**:
```json
{
  "success": true,
  "image_url": "/uploads/questions/1732000000_image.jpg",
  "filename": "1732000000_image.jpg",
  "size": 123456
}
```

**Delete Image**
```
DELETE /api/admin/upload/image/:filename
Authorization: Bearer {token}
```

#### Image Handler (`internal/handlers/image.go`)

```go
type ImageHandler struct{}

// UploadImage handles file upload with:
// - File size validation (max 5MB)
// - File type validation (JPG, PNG, GIF, WebP)
// - Unique filename generation (timestamp_original)
// - Directory creation if needed
// - Returns public URL

// DeleteImage handles file deletion
```

#### File Storage
- Location: `web/uploads/questions/`
- Filename format: `{timestamp}_{original_filename}`
- Public URL: `/uploads/questions/{filename}`

#### Database Schema
```go
type Question struct {
    // ... existing fields
    ImageURL string `gorm:"type:varchar(500)" json:"image_url"` // Optional
}
```

### Frontend

#### Admin Dashboard (`web/static/js/dashboard.js`)

**Question Form**:
```html
<!-- Hidden field stores URL -->
<input type="hidden" id="questionImageUrl">

<!-- Image preview (shown after upload) -->
<img id="imagePreview" src="..." />
<button onclick="removeQuestionImage()">Remove</button>

<!-- Upload button (shown when no image) -->
<input type="file" id="questionImageFile" onchange="uploadQuestionImage(this)" />

<!-- Progress bar (shown during upload) -->
<div id="uploadProgress">
  <div id="uploadProgressBar" style="width: 0%"></div>
  <span id="uploadProgressText">0%</span>
</div>
```

**Upload Function**:
```javascript
async function uploadQuestionImage(input) {
    // 1. Validate file size and type
    // 2. Create FormData
    // 3. Use XMLHttpRequest for progress tracking
    // 4. Update progress bar in real-time
    // 5. Show preview on success
    // 6. Handle errors gracefully
}
```

**Progress Tracking**:
```javascript
xhr.upload.addEventListener('progress', (e) => {
    const percent = Math.round((e.loaded / e.total) * 100);
    progressBar.style.width = percent + '%';
    progressText.textContent = percent + '%';
});
```

#### Quiz Page (`web/templates/public/quiz.html`)

```html
<!-- Image display (only if image_url exists) -->
<div x-show="currentQuestion.image_url">
    <img :src="currentQuestion.image_url" 
         :alt="'Question ' + (currentQuestionIndex + 1) + ' image'"
         class="w-full max-w-lg mx-auto rounded-lg shadow-md"
         @error="$el.style.display='none'">
</div>
```

**Features**:
- `x-show`: Only displays if image URL exists
- `@error`: Hides image if loading fails
- Responsive: `max-w-lg` limits size on large screens
- Mobile: `w-full` fills screen on small devices

## File Structure

```
web/
├── uploads/
│   └── questions/
│       ├── .gitkeep                    # Preserves directory in git
│       ├── .gitignore                  # Ignores uploaded files
│       └── {timestamp}_{filename}.jpg  # Uploaded images
└── static/
    └── js/
        └── dashboard.js                # Upload logic
```

## Server Configuration

### Static File Serving
```go
router.Static("/uploads", "./web/uploads")
```

### Routes
```go
admin := router.Group("/api/admin")
admin.Use(middleware.AuthMiddleware(cfg), middleware.AdminOnly())
{
    admin.POST("/upload/image", imageHandler.UploadImage)
    admin.DELETE("/upload/image/:filename", imageHandler.DeleteImage)
}
```

## Validation Rules

### Client-Side (JavaScript)
```javascript
// File size
if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
}

// File type
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
    alert('Only JPG, PNG, GIF, and WebP images are allowed');
}
```

### Server-Side (Go)
```go
// File size
maxSize := int64(5 * 1024 * 1024)
if file.Size > maxSize {
    return error
}

// File extension
allowedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
```

## User Experience Flow

### Admin - Adding Image

```
1. Click "Add Question" 
   ↓
2. Click "Choose Image" button
   ↓
3. Select file from computer
   ↓
4. See upload progress: [████████░░] 80%
   ↓
5. Upload completes: ✅ Image uploaded successfully!
   ↓
6. See image preview with "Remove" option
   ↓
7. Fill other fields and save question
```

### Student - Viewing Question with Image

```
1. Start quiz
   ↓
2. Question appears with text
   ↓
3. Image loads below question text
   ↓
4. Image fits screen perfectly
   ↓
5. Answer options below image
```

## Error Handling

### Upload Errors

| Error | Cause | User Message |
|-------|-------|--------------|
| **File too large** | Size > 5MB | "File size must be less than 5MB" |
| **Wrong format** | Not JPG/PNG/GIF/WebP | "Only JPG, PNG, GIF, and WebP images are allowed" |
| **Network error** | Connection failed | "Failed to upload image. Please try again." |
| **Server error** | Server issue | "Failed to upload image. Please try again." |

### Display Errors
- If image fails to load in quiz: Image is automatically hidden
- Student can still answer question without seeing image

## Best Practices

### For Admins
1. **Optimize images** before uploading (reduce file size)
2. **Use descriptive filenames** (helps identify images)
3. **Test images** on mobile after uploading
4. **Remove unused images** to save server space
5. **Use images** only when they add value to questions

### Image Guidelines
- ✅ **DO**: Use clear, high-quality images
- ✅ **DO**: Ensure images are relevant to question
- ✅ **DO**: Test on mobile devices
- ✅ **DO**: Compress large images before upload
- ❌ **DON'T**: Upload unnecessary images
- ❌ **DON'T**: Use images with too much text
- ❌ **DON'T**: Exceed 5MB file size

## Troubleshooting

### Image Not Uploading
1. Check file size (must be < 5MB)
2. Check file format (JPG, PNG, GIF, WebP only)
3. Check internet connection
4. Try refreshing the page

### Image Not Displaying in Quiz
1. Check if image URL is saved in question
2. Check if image file exists in `web/uploads/questions/`
3. Check browser console for errors
4. Try uploading image again

### Progress Bar Stuck
1. Wait a few more seconds (large files take time)
2. Check internet connection
3. Cancel and try again
4. Try smaller file size

## Migration Notes

### Existing Questions
- Old questions without images: **Continue to work normally**
- No migration needed
- `image_url` field is optional

### Database Update
- GORM auto-migration adds `image_url` column
- Existing data preserved
- New field defaults to empty string

## Security Considerations

1. **Authentication Required**: Only authenticated admins can upload
2. **File Type Validation**: Only allowed image types accepted
3. **File Size Limit**: Prevents large file attacks
4. **Unique Filenames**: Prevents file overwrites
5. **Directory Isolation**: Images stored in specific directory

## Performance

### Upload Speed
- **Small images** (< 500KB): < 2 seconds
- **Medium images** (500KB - 2MB): 2-5 seconds
- **Large images** (2MB - 5MB): 5-10 seconds

*Actual speed depends on internet connection*

### Page Load Impact
- Images loaded asynchronously
- No impact on quiz page load speed
- Failed images don't break page

## Future Enhancements

Potential improvements:
- 🎨 Image cropping tool
- 🗜️ Automatic image compression
- 📁 Image library/gallery
- 🔄 Multiple images per question
- ✂️ Drag-and-drop upload
- 🖼️ Image editor integration

---

**Last Updated**: 2025-11-18
**Version**: 1.0
**Status**: ✅ Production Ready
