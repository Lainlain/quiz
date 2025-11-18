#!/bin/bash

echo "========================================"
echo "Mitsuki Quiz Android App - Build Script"
echo "========================================"
echo ""

# Check if gradlew exists
if [ ! -f "gradlew" ]; then
    echo "Error: gradlew not found. Please run this from the mobile_app directory."
    exit 1
fi

# Make gradlew executable
chmod +x gradlew

echo "1. Cleaning project..."
./gradlew clean

echo ""
echo "2. Building debug APK..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "APK location:"
    echo "  app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on connected device:"
    echo "  ./gradlew installDebug"
    echo ""
    echo "Or use adb:"
    echo "  adb install app/build/outputs/apk/debug/app-debug.apk"
else
    echo ""
    echo "❌ Build failed. Check the errors above."
    exit 1
fi
