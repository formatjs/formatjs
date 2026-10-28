#!/usr/bin/env bash
set -euo pipefail

cd examples/react-native-hermes/android
if ! ./gradlew connectedDebugAndroidTest --no-daemon; then
  adb logcat -d > "$RUNNER_TEMP/android-logcat.txt" || true
  adb exec-out screencap -p > "$RUNNER_TEMP/failure-screen.png" || true
  adb shell uiautomator dump /sdcard/window.xml || true
  adb pull /sdcard/window.xml "$RUNNER_TEMP/window.xml" || true
  exit 1
fi
adb pull /data/local/tmp/intl-screen.png "$RUNNER_TEMP/intl-screen.png"
