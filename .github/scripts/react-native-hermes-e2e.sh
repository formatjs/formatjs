#!/usr/bin/env bash
set -euo pipefail

cd examples/react-native-hermes/android
./gradlew connectedDebugAndroidTest --no-daemon
adb pull /sdcard/Android/data/com.formatjshermes/files/intl-screen.png "$RUNNER_TEMP/intl-screen.png"
