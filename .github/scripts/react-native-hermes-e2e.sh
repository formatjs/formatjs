#!/usr/bin/env bash
set -euo pipefail

cd examples/react-native-hermes/android
passed=0
for attempt in 1 2 3; do
  if ./gradlew connectedDebugAndroidTest --no-daemon 2>&1 | tee "$RUNNER_TEMP/gradle.log"; then
    passed=1
    break
  fi
  if [ "$attempt" -eq 3 ] || ! grep -Eq 'Read timed out|Connection timed out|Connection reset' "$RUNNER_TEMP/gradle.log"; then
    break
  fi
  echo "Gradle download failed; retrying ($attempt/3)"
  sleep 10
done
if [ "$passed" -ne 1 ]; then
  adb logcat -d > "$RUNNER_TEMP/android-logcat.txt" || true
  adb exec-out screencap -p > "$RUNNER_TEMP/failure-screen.png" || true
  adb shell uiautomator dump /sdcard/window.xml || true
  adb pull /sdcard/window.xml "$RUNNER_TEMP/window.xml" || true
  exit 1
fi
adb pull /sdcard/Pictures/FormatJS/intl-screen.png "$RUNNER_TEMP/intl-screen.png"
