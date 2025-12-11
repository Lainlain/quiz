# Custom Preview Images Setup Guide

**Date**: December 11, 2025  
**Feature**: Custom social media preview images  
**Status**: ✅ Ready to Use

---

## Overview

Your quiz system now uses **two dedicated preview images** for social media sharing:

1. **`/static/quiz-preview.jpg`** - Shows when sharing quiz links
2. **`/static/course-preview.jpg`** - Shows when sharing course registration links

This is **much simpler** than managing individual images per course/quiz, and gives you complete control over your social media appearance! 🎨

---

## Quick Setup

### Step 1: Create Your Images

Create two images with these specifications:

#### **Quiz Preview Image**
- **Filename**: `quiz-preview.jpg` (or `.png`)
- **Size**: **1200 × 630 pixels** (optimal for all platforms)
- **Content**: 
  - Your school logo
  - Text: "Take Our Japanese Language Quiz"
  - School name: "Mitsuki JPY Language School"
  - Red/white/black color scheme
  - Clean, professional design

#### **Course Preview Image**
- **Filename**: `course-preview.jpg` (or `.png`)
- **Size**: **1200 × 630 pixels** (optimal for all platforms)
- **Content**:
  - Your school logo
  - Text: "Register for Japanese Language Course"
  - School name: "Mitsuki JPY Language School"
  - Red/white/black color scheme
  - Call-to-action feel

---

### Step 2: Place Images in Static Folder

```bash
# Copy your images to the static folder
cp quiz-preview.jpg web/static/
cp course-preview.jpg web/static/

# Verify they're there
ls -lh web/static/*.jpg
```

**Expected output:**
```
-rw-r--r-- 1 user user 150K Dec 11 10:00 course-preview.jpg
-rw-r--r-- 1 user user  85K Dec 11 09:30 logo.jpg
-rw-r--r-- 1 user user 145K Dec 11 10:00 quiz-preview.jpg
```

---

### Step 3: Restart Server

```bash
# Restart your Go server
go run cmd/server/main.go
```

**That's it!** Your custom images will now appear in all social media previews! 🎉

---

## Image Specifications

### Recommended Dimensions

**1200 × 630 pixels** is the **perfect size** for all platforms:

| Platform | Optimal Size | Your Size | Result |
|----------|--------------|-----------|--------|
| Facebook | 1200 × 630 | 1200 × 630 | ✅ Perfect |
| WhatsApp | 300 × 300 | 1200 × 630 | ✅ Scaled down |
| Telegram | 1280 × 640 | 1200 × 630 | ✅ Perfect |
| Twitter | 1200 × 600 | 1200 × 630 | ✅ Perfect |
| LinkedIn | 1200 × 627 | 1200 × 630 | ✅ Perfect |

**Aspect Ratio:** 1.91:1 (almost 2:1)

---

### File Format

**Best formats:**
- ✅ **JPEG** (`.jpg`) - Best for photos/gradients, smaller file size
- ✅ **PNG** (`.png`) - Best for logos/text, supports transparency

**File size:**
- **Maximum**: 8 MB (Facebook limit)
- **Recommended**: Under 500 KB (faster loading)
- **Minimum**: 200 × 200 pixels

**Color space:**
- ✅ RGB (for web)
- ❌ CMYK (for print only)

---

## Design Tips

### Quiz Preview Image

**Good Example:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [School Logo - Large]                   │
│                                                 │
│     📝 Test Your Japanese Language Skills      │
│                                                 │
│         Take Our Online Quiz Exam               │
│                                                 │
│     Mitsuki JPY Language School                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Design Guidelines:**
- ✅ Large, centered logo
- ✅ Clear, readable text (minimum 48px font)
- ✅ Red/white/black color scheme
- ✅ High contrast for readability
- ✅ Clean background (solid or subtle gradient)
- ✅ School branding prominent
- ❌ Don't overcrowd with text
- ❌ Don't use small fonts
- ❌ Don't use low-resolution images

---

### Course Preview Image

**Good Example:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [School Logo - Large]                   │
│                                                 │
│     ✍️ Register for Japanese Language Course   │
│                                                 │
│     🎌 Expert Instructors | 📚 Quality Course  │
│                                                 │
│     Start Your Journey Today!                   │
│                                                 │
│     Mitsuki JPY Language School                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Design Guidelines:**
- ✅ Inviting, welcoming feel
- ✅ Call-to-action text
- ✅ Highlight benefits (expert teachers, etc.)
- ✅ Use emojis strategically
- ✅ Make it shareable
- ❌ Don't use too many details
- ❌ Don't make it look like an ad

---

## Creating Images

### Method 1: Canva (Easiest)

**Free online tool:** https://www.canva.com

**Steps:**
1. Sign up for free account
2. Click "Create a design"
3. Select "Custom size" → **1200 × 630 px**
4. Use templates or start from scratch
5. Add your logo, text, colors
6. Download as JPEG (high quality)

**Canva Template Search:**
- "Social media banner"
- "Facebook post"
- "Open graph image"

---

### Method 2: Figma (Professional)

**Free design tool:** https://www.figma.com

**Steps:**
1. Create new file
2. Frame size: 1200 × 630
3. Design your image
4. Export as PNG/JPEG (2x for retina)

---

### Method 3: Photoshop (Advanced)

**If you have Photoshop:**
1. New file: 1200 × 630 px, 72 DPI, RGB
2. Design your preview
3. Save for Web: JPEG, 80% quality

---

### Method 4: Simple Online Editor

**Pixlr (Free):** https://pixlr.com/editor/

**Steps:**
1. Create new: 1200 × 630
2. Add text and logo
3. Export as JPEG

---

## What Images Show

### Quiz Links Preview

**When someone shares:**
```
https://mitsukijp.com/quiz?package=5
```

**They see:**
```
┌────────────────────────────────────┐
│  [YOUR CUSTOM QUIZ PREVIEW IMAGE]  │
├────────────────────────────────────┤
│  📝 N5 Grammar Test - JLPT N5      │
│  Take the N5 Grammar Test quiz...  │
│  🔗 mitsukijp.com                  │
└────────────────────────────────────┘
```

**Image Used:** `/static/quiz-preview.jpg`

---

### Course Registration Links Preview

**When someone shares:**
```
https://mitsukijp.com/register/3
```

**They see:**
```
┌────────────────────────────────────┐
│ [YOUR CUSTOM COURSE PREVIEW IMAGE] │
├────────────────────────────────────┤
│ ✍️ Register for JLPT N5 Course    │
│ Join JLPT N5 Course at Mitsuki...  │
│ 🔗 mitsukijp.com                   │
└────────────────────────────────────┘
```

**Image Used:** `/static/course-preview.jpg`

---

## Testing Your Images

### 1. Check Images Load

**Browser test:**
```
Open: http://localhost:8080/static/quiz-preview.jpg
Open: http://localhost:8080/static/course-preview.jpg
```

**Should see:** Your custom images display

---

### 2. Test Meta Tags

**Open quiz page in browser:**
```
http://localhost:8080/quiz?package=1
```

**Open browser console (F12):**
```javascript
// Check quiz image URL
console.log(document.querySelector('meta[property="og:image"]').content);
// Should show: http://localhost:8080/static/quiz-preview.jpg
```

---

### 3. Test on Telegram

**Steps:**
1. Share quiz link on Telegram: `http://localhost:8080/quiz?package=1`
2. Wait 2-3 seconds
3. **See your custom quiz-preview.jpg image!** ✅

**For course:**
1. Share registration link: `http://localhost:8080/register/1`
2. **See your custom course-preview.jpg image!** ✅

---

### 4. Clear Telegram Cache

**If Telegram shows old image:**
```
Add ?v=2 to URL:
http://localhost:8080/quiz?package=1&v=2
```

---

### 5. Test Other Platforms

**Facebook Debugger:**
```
https://developers.facebook.com/tools/debug/
Enter: https://mitsukijp.com/quiz?package=1
Click "Scrape Again"
```

**Twitter Card Validator:**
```
https://cards-dev.twitter.com/validator
Enter: https://mitsukijp.com/quiz?package=1
See preview with your image
```

---

## File Locations

```
quiz/
├── web/
│   └── static/
│       ├── logo.jpg              ← Original logo (still used on pages)
│       ├── quiz-preview.jpg      ← NEW: Quiz social preview image
│       └── course-preview.jpg    ← NEW: Course social preview image
```

---

## Fallback Behavior

**If custom images not found:**

The system will **automatically fallback** to `/static/logo.jpg`

```javascript
// Code tries to load:
/static/quiz-preview.jpg

// If not found (404), browsers show:
/static/logo.jpg (from previous meta tags)
```

**No errors, no broken images!** ✅

---

## Benefits of This Approach

### 1. **Simple Management**
- Only 2 images to create/update
- No database changes needed
- No admin interface needed

### 2. **Consistent Branding**
- Same image for all quiz links
- Same image for all course links
- Professional appearance

### 3. **Easy Updates**
- Replace `quiz-preview.jpg` → all quiz links updated
- Replace `course-preview.jpg` → all course links updated
- No code changes needed

### 4. **Performance**
- Images cached by browsers
- Same image reused for all links
- Faster loading

### 5. **No Database**
- No schema changes
- No migrations
- Works immediately

---

## Image Optimization

### Compress Your Images

**Online tools:**
- **TinyPNG:** https://tinypng.com/ (best for PNG)
- **Compressor.io:** https://compressor.io/ (best for JPEG)
- **Squoosh:** https://squoosh.app/ (by Google)

**Benefits:**
- Smaller file size
- Faster loading
- Better user experience
- Lower bandwidth costs

**Target size:**
- Start: 800 KB (original)
- After compression: 200 KB (compressed)
- **Savings: 75%!**

---

### Image Quality Settings

**For JPEG:**
- **High quality**: 90-100% (300-500 KB) - Use for photos
- **Medium quality**: 75-85% (150-250 KB) - **Recommended!**
- **Low quality**: 60-70% (100-150 KB) - Use if too large

**For PNG:**
- **PNG-24**: Full color + transparency (larger)
- **PNG-8**: 256 colors (smaller) - **Recommended for simple designs**

---

## Updating Images

### To Update Quiz Image

```bash
# Replace the file
cp new-quiz-image.jpg web/static/quiz-preview.jpg

# Restart server (if needed)
go run cmd/server/main.go
```

**All quiz links now show new image!** 🎉

---

### To Update Course Image

```bash
# Replace the file
cp new-course-image.jpg web/static/course-preview.jpg

# Restart server (if needed)
go run cmd/server/main.go
```

**All course links now show new image!** 🎉

---

## Advanced: Using PNG with Transparency

**If you want transparent backgrounds:**

```bash
# Create PNG version
web/static/quiz-preview.png
web/static/course-preview.png
```

**Update code to use PNG:**

Find in `quiz.html`:
```javascript
const quizImageUrl = baseUrl + '/static/quiz-preview.jpg';
```

Change to:
```javascript
const quizImageUrl = baseUrl + '/static/quiz-preview.png';
```

**Same for `register.html` with course image.**

---

## Troubleshooting

### Issue 1: Image Not Showing

**Check:**
```bash
# Verify file exists
ls -lh web/static/quiz-preview.jpg

# Check file permissions
chmod 644 web/static/quiz-preview.jpg
```

**Test URL directly:**
```
http://localhost:8080/static/quiz-preview.jpg
```

---

### Issue 2: Wrong Image in Preview

**Cause:** Browser/platform cache

**Solution:**
```
Add version to URL: ?v=2
Example: https://mitsukijp.com/quiz?package=1&v=2
```

**Or use Facebook debugger to clear:**
```
https://developers.facebook.com/tools/debug/
```

---

### Issue 3: Image Quality Low

**Cause:** Over-compression

**Solution:**
- Re-export with higher quality (85-90%)
- Use larger source image (1200×630)
- Don't resize from small image

---

### Issue 4: Image Looks Blurry on Mobile

**Cause:** Retina displays need 2x resolution

**Solution (Optional):**
- Create 2400×1260 image
- Save as `quiz-preview.jpg` (will be scaled down)
- Results in sharper display

---

## Image Ideas

### Quiz Preview Image Ideas

**Concept 1: Minimalist**
- Clean white background
- Large red logo
- Bold text: "Test Your Skills"
- School name in Japanese + English

**Concept 2: Educational**
- Blackboard texture background
- Chalk-style text
- Quiz paper illustration
- Playful but professional

**Concept 3: Modern**
- Red gradient background
- White text
- School logo corner
- Clean, contemporary look

---

### Course Preview Image Ideas

**Concept 1: Welcoming**
- Warm colors (red + orange gradient)
- Smiling student illustration
- Text: "Start Learning Today!"
- Inviting, friendly

**Concept 2: Professional**
- Clean business style
- School building photo (subtle)
- Bold text
- Credentials highlighted

**Concept 3: Cultural**
- Japanese aesthetic (subtle sakura)
- Red/white color scheme
- Kanji + English text
- Cultural immersion feel

---

## Example Templates

### Canva Template Searches

**For Quiz Image:**
- "Quiz social media"
- "Education banner"
- "Test announcement"
- "Exam promotion"

**For Course Image:**
- "Course enrollment"
- "School registration"
- "Education program"
- "Join us banner"

---

## Quick Reference

### File Checklist

- [ ] Create `quiz-preview.jpg` (1200×630)
- [ ] Create `course-preview.jpg` (1200×630)
- [ ] Place in `web/static/` folder
- [ ] Test URLs: `/static/quiz-preview.jpg` and `/static/course-preview.jpg`
- [ ] Restart server
- [ ] Test on Telegram/WhatsApp
- [ ] Compress images if > 500 KB

### Image Specs

- **Size**: 1200 × 630 pixels
- **Format**: JPEG or PNG
- **Max file size**: 8 MB (recommend < 500 KB)
- **Color**: RGB
- **Quality**: 75-85% for JPEG

### Test URLs

```bash
# Local
http://localhost:8080/static/quiz-preview.jpg
http://localhost:8080/static/course-preview.jpg

# Production
https://mitsukijp.com/static/quiz-preview.jpg
https://mitsukijp.com/static/course-preview.jpg
```

---

## Summary

✅ **Simple setup** - Just 2 images  
✅ **Easy to update** - Replace file, restart server  
✅ **Works everywhere** - All platforms supported  
✅ **No database** - No schema changes needed  
✅ **Consistent branding** - Same image for all links  
✅ **Professional** - Custom designed for your school  

**Your social media previews will now look professional and branded!** 🎨✨

---

**Status:** ✅ **Ready to Use**

**Next Steps:**
1. Create your two images (quiz-preview.jpg and course-preview.jpg)
2. Place them in `web/static/` folder
3. Restart your server
4. Test sharing links on Telegram
5. Enjoy beautiful previews! 🎉

---

**Last Updated:** December 11, 2025  
**Image System:** 2 static images for all links  
**Ease of Use:** ⭐⭐⭐⭐⭐ (5/5 - Very Simple!)
