# Mitsuki Quiz - Android Mobile App

A native Android mobile application for the Mitsuki JPY Language School Quiz System built with Kotlin and Jetpack Compose.

## Features

- 🔐 **JWT Authentication** - Secure login/register with Facebook URL verification
- 📚 **Course Management** - Browse available courses and quiz packages
- 📝 **Interactive Quizzes** - Take quizzes with timer and progress tracking
- ⏱️ **Real-time Timer** - Countdown timer with auto-submit
- 📊 **Answer Tracking** - Save answers in real-time
- 🎨 **Material Design 3** - Pure white theme throughout the app
- 🔄 **Retry Limits** - Enforces course retry policies

## Technology Stack

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM (Model-View-ViewModel)
- **Dependency Injection**: Hilt
- **Networking**: Retrofit + OkHttp
- **State Management**: Flow + StateFlow
- **Storage**: DataStore (JWT tokens)
- **Navigation**: Navigation Compose
- **Design**: Material Design 3

## Project Structure

```
app/src/main/java/com/mitsui/quiz/
├── data/
│   ├── local/
│   │   └── TokenManager.kt          # JWT token storage
│   ├── model/
│   │   └── Models.kt                # Data classes
│   ├── remote/
│   │   └── ApiService.kt            # Retrofit API
│   └── repository/
│       └── QuizRepository.kt        # Repository pattern
├── di/
│   └── NetworkModule.kt             # Hilt DI configuration
├── ui/
│   ├── navigation/
│   │   ├── Screen.kt                # Navigation routes
│   │   └── AppNavGraph.kt           # Navigation graph
│   ├── screen/
│   │   ├── LoginScreen.kt           # Login UI
│   │   ├── RegisterScreen.kt        # Registration UI
│   │   ├── CourseListScreen.kt      # Course list UI
│   │   └── QuizScreen.kt            # Quiz UI
│   ├── theme/
│   │   ├── Color.kt                 # Color palette
│   │   ├── Theme.kt                 # Material theme
│   │   └── Type.kt                  # Typography
│   └── viewmodel/
│       ├── AuthViewModel.kt         # Auth logic
│       ├── CourseViewModel.kt       # Course logic
│       └── QuizViewModel.kt         # Quiz logic
├── MainActivity.kt
└── MitsukiQuizApp.kt                # Hilt application
```

## Requirements

- Android Studio Hedgehog or newer
- JDK 17 or newer
- Android SDK 34
- Minimum Android version: 7.0 (API 24)
- Target Android version: 14 (API 34)

## Build Instructions

### 1. Open Project in Android Studio

```bash
cd mobile_app
# Open the mobile_app folder in Android Studio
```

### 2. Sync Gradle

Android Studio will automatically prompt you to sync Gradle. Click "Sync Now".

### 3. Configure Backend URL (Optional)

The app is pre-configured to connect to:
```
http://147.93.158.198:8080/
```

To change the server URL, edit `app/build.gradle.kts`:
```kotlin
buildConfigField("String", "BASE_URL", "\"http://YOUR_SERVER:8080/\"")
```

### 4. Build the App

**Option A: Using Android Studio**
- Click "Build" → "Make Project"
- Or press `Ctrl+F9` (Windows/Linux) or `Cmd+F9` (Mac)

**Option B: Using Command Line**
```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease
```

### 5. Run on Device/Emulator

**Option A: Using Android Studio**
- Connect your Android device or start an emulator
- Click the "Run" button (▶️) or press `Shift+F10`

**Option B: Using Command Line**
```bash
# Install debug build
./gradlew installDebug

# Run the app
adb shell am start -n com.mitsui.quiz/.MainActivity
```

## APK Location

After building, find the APK at:
- Debug: `app/build/outputs/apk/debug/app-debug.apk`
- Release: `app/build/outputs/apk/release/app-release.apk`

## App Features

### Authentication Flow

1. **Login Screen**
   - Email and password fields
   - Show/hide password toggle
   - Navigate to registration

2. **Registration Screen**
   - Full name, email, password fields
   - Facebook URL verification (required)
   - Password confirmation
   - URL validation

### Quiz Flow

1. **Course List**
   - View all available courses
   - See exam time and retry limits
   - Logout option

2. **Quiz Screen**
   - Real-time countdown timer
   - Progress indicator
   - Question navigation (Previous/Next)
   - Answer selection (A, B, C, D)
   - Auto-save answers
   - Submit confirmation
   - Unanswered questions warning

## White Theme Configuration

The app uses a pure white theme with Material Design 3:

- **Status Bar**: White with dark icons
- **Navigation Bar**: White with dark icons
- **App Bar**: White background
- **Cards**: White with subtle elevation
- **Primary Color**: Blue (#2196F3)
- **Accents**: Green, Orange, Red

## API Integration

### Base URL
```
http://147.93.158.198:8080/
```

### Endpoints Used

- `POST /api/auth/student/login` - Login
- `POST /api/auth/student/register` - Register (with facebook_url)
- `GET /api/student/courses` - Get courses
- `POST /api/student/quiz/start` - Start quiz
- `POST /api/student/quiz/answer` - Submit answer
- `POST /api/student/quiz/complete/{attemptId}` - Complete quiz

### Authentication

JWT tokens are stored in DataStore and automatically added to requests via `AuthInterceptor`.

## Testing

### Test Login Credentials

Use existing student accounts from the backend:

```
Email: student@example.com
Password: (your password)
```

### Creating Test Accounts

Register through the app with:
- Valid email
- Strong password
- Facebook profile URL (e.g., https://facebook.com/yourprofile)

## Troubleshooting

### Build Errors

1. **Sync failed**: File → Sync Project with Gradle Files
2. **SDK not found**: Tools → SDK Manager → Install Android SDK 34
3. **JDK version**: File → Project Structure → JDK location

### Runtime Errors

1. **Network error**: Check server URL in `build.gradle.kts`
2. **Login failed**: Verify backend is running on http://147.93.158.198:8080
3. **White screen**: Check Logcat for errors

### Viewing Logs

```bash
# View all logs
adb logcat

# Filter by app
adb logcat | grep com.mitsui.quiz

# Clear logs
adb logcat -c
```

## Release Build

### Generate Signed APK

1. Build → Generate Signed Bundle/APK
2. Select "APK"
3. Create or select keystore
4. Enter keystore details
5. Choose "release" build variant
6. Build and locate APK

### Keystore Configuration

Add to `app/build.gradle.kts`:
```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file("path/to/keystore.jks")
            storePassword = "your_store_password"
            keyAlias = "your_key_alias"
            keyPassword = "your_key_password"
        }
    }
    
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

## Version History

- **v1.0.0** - Initial release with core features

## License

Copyright © 2025 Mitsui JPY Language School

## Support

For issues or questions, contact the development team.

---

**Built with ❤️ using Kotlin and Jetpack Compose**
