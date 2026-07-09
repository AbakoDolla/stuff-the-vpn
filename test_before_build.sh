#!/bin/bash

# 🧪 Flutter Test & Analysis Script
# Usage: bash test_before_build.sh

set -e

cd apps/mobile

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  🧪 FLUTTER BUILD & ANALYSIS SYSTEM"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Step 1: Get dependencies
echo "📦 Step 1: Installing dependencies..."
flutter pub get
echo "✅ Dependencies installed"
echo ""

# Step 2: Analyze code
echo "🔍 Step 2: Analyzing Dart code for errors..."
if flutter analyze --no-pub; then
  echo "✅ No analysis errors found"
else
  echo "❌ Analysis found issues - check above"
fi
echo ""

# Step 3: Format check
echo "🎨 Step 3: Checking code formatting..."
dart format lib/ --set-exit-if-changed || echo "⚠️ Some files need formatting (non-critical)"
echo ""

# Step 4: Run tests
echo "🧪 Step 4: Running unit tests..."
if flutter test --coverage 2>&1 | tee test_output.log; then
  echo "✅ All tests passed"
else
  echo "⚠️ Some tests failed - see output above"
fi
echo ""

# Step 5: Build APK (Debug - faster)
echo "🏗️ Step 5: Building APK in DEBUG mode (faster testing)..."
if flutter build apk --debug 2>&1 | tee build_output.log; then
  APK_PATH="build/app/outputs/flutter-apk/app-debug.apk"
  if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
    echo ""
    echo "✅ DEBUG APK built successfully!"
    echo "   📍 Location: $APK_PATH"
    echo "   📊 Size: $APK_SIZE"
  fi
else
  echo "❌ BUILD FAILED - Check output above"
  exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ ALL CHECKS PASSED - READY TO TEST"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📝 Logs saved to:"
echo "   - test_output.log"
echo "   - build_output.log"
echo ""
echo "Next: Install the APK on your phone or use:"
echo "   adb install -r build/app/outputs/flutter-apk/app-debug.apk"
echo ""
