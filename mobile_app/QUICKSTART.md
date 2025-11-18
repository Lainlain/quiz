# 🚀 Mitsuki Quiz Mobile App - Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites Check
```bash
# Check Java version (need JDK 17+)
java -version

# Check Android SDK
ls ~/Android/Sdk  # or $ANDROID_HOME
```

### Step 1: Open in Android Studio
```bash
# Navigate to project
cd "/home/lainlain/Desktop/Go Lang /quiz/mobile_app"

# Open Android Studio
studio .
# Or: File → Open → Select mobile_app folder
```

### Step 2: Wait for Gradle Sync
- Android Studio will automatically sync Gradle
- Wait for "BUILD SUCCESSFUL" message
- This may take 3-5 minutes on first sync

### Step 3: Run the App
**Option A: Using Android Studio**
1. Click Run (▶️ green play button)
2. Select your device/emulator
3. Wait for installation
4. App will launch automatically

**Option B: Using Terminal**
```bash
# Build and install
./gradlew installDebug

# Launch app
adb shell am start -n com.mitsui.quiz/.MainActivity
```

---

## 📱 Testing the App

### Login with Test Account
1. Open the app
2. Enter credentials:
   ```
   Email: student@example.com
   Password: [your password]
   ```
3. Click "Login"

### Or Register New Account
1. Click "Don't have an account? Register"
2. Fill in:
   - **Full Name**: Your Name
   - **Email**: yourname@example.com
   - **Facebook URL**: https://facebook.com/yourprofile
   - **Password**: YourPassword123
   - **Confirm Password**: YourPassword123
3. Click "Create Account"

### Take a Quiz
1. After login, you'll see available courses
2. Tap any course card
3. Quiz will start with timer
4. Select answers (A, B, C, or D)
5. Click "Next" to go to next question
6. Click "Submit" when finished

---

## 🛠️ Build Commands Reference

```bash
# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install on connected device
./gradlew installDebug

# Uninstall
./gradlew uninstallAll

# Run tests
./gradlew test

# Check for issues
./gradlew lint
```

---

## 📦 APK Location

After building, find APK at:
```
mobile_app/app/build/outputs/apk/debug/app-debug.apk
```

Install on device:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## 🐛 Troubleshooting

### Issue: Gradle Sync Failed
**Solution:**
```bash
# In Android Studio:
File → Invalidate Caches / Restart

# Or terminal:
./gradlew clean
rm -rf .gradle
```

### Issue: SDK not found
**Solution:**
1. Tools → SDK Manager
2. Install Android SDK 34
3. Install Android SDK Build-Tools 34.0.0
4. Sync project again

### Issue: JDK version mismatch
**Solution:**
```bash
# In Android Studio:
File → Project Structure → SDK Location
# Set JDK location to JDK 17+
```

### Issue: App won't connect to server
**Solution:**
1. Check if backend server is running: http://147.93.158.198:8080
2. Test in browser: http://147.93.158.198:8080/api/student/courses
3. Check app logs: `adb logcat | grep OkHttp`

### Issue: White screen on startup
**Solution:**
```bash
# Check logs
adb logcat | grep com.mitsui.quiz

# Clear app data
adb shell pm clear com.mitsui.quiz

# Reinstall
./gradlew uninstallAll
./gradlew installDebug
```

---

## 📊 Viewing Logs

### Android Studio
1. View → Tool Windows → Logcat
2. Select your device
3. Filter by "com.mitsui.quiz"

### Terminal
```bash
# All logs
adb logcat

# Filter by package
adb logcat | grep com.mitsui.quiz

# Filter by tag
adb logcat -s OkHttp
adb logcat -s QuizViewModel

# Clear logs
adb logcat -c
```

---

## 🎯 App Structure Overview

```
mobile_app/
├── app/
│   ├── build.gradle.kts          ← Dependencies
│   └── src/main/
│       ├── AndroidManifest.xml   ← App config
│       ├── java/com/mitsui/quiz/
│       │   ├── MainActivity.kt   ← Entry point
│       │   ├── data/             ← Models, API, Storage
│       │   ├── di/               ← Dependency injection
│       │   └── ui/               ← Screens, ViewModels, Theme
│       └── res/
│           └── values/
│               └── strings.xml   ← String resources
├── build.gradle.kts              ← Root build
├── settings.gradle.kts           ← Project settings
└── README.md                     ← Full documentation
```

---

## 🔧 Configuration

### Change Server URL
Edit `app/build.gradle.kts`:
```kotlin
android {
    defaultConfig {
        buildConfigField("String", "BASE_URL", "\"http://YOUR_SERVER:8080/\"")
    }
}
```

### Change App Name
Edit `app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Your App Name</string>
```

### Change Package Name
1. Right-click on `com.mitsui.quiz`
2. Refactor → Rename
3. Update in `AndroidManifest.xml`
4. Sync Gradle

---

## 📱 Device Requirements

### Minimum
- Android 7.0 (API 24)
- 50 MB free storage
- Internet connection

### Recommended
- Android 10+ (API 29+)
- 100 MB free storage
- Wi-Fi or 4G/5G connection

---

## ✅ Quick Verification Checklist

After setup, verify:
- [ ] Gradle sync successful
- [ ] No build errors
- [ ] App installs on device/emulator
- [ ] App launches without crashes
- [ ] Login screen appears
- [ ] Can register new account
- [ ] Can login
- [ ] Course list loads
- [ ] Can start a quiz
- [ ] Timer counts down
- [ ] Can select answers
- [ ] Can submit quiz

---

## 📞 Need Help?

1. **Check README.md** - Full documentation
2. **Check MOBILE_APP_SUMMARY.md** - Complete feature list
3. **Check ARCHITECTURE_DIAGRAM.md** - Visual architecture
4. **View logs** - `adb logcat | grep com.mitsui.quiz`
5. **Contact development team**

---

## 🎉 You're Ready!

The app should now be running on your device. Enjoy testing the Mitsuki Quiz mobile app!

### Next Steps
1. Test all features
2. Report any bugs
3. Suggest improvements
4. Prepare for release

---

**Happy Testing! 🚀**
