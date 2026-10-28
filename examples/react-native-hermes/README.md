# React Native Hermes Intl example

Android arm64/x86_64 app. Installs all twelve Rust-backed Intl polyfills into React
Native's Hermes runtime through a synchronous C++ TurboModule. Screen shows
one result per API. Android instrumentation test reads the rendered text and
captures a screenshot.

Requires Node 22+, Java 17, Android SDK 36, NDK 27.1.12297006, an Android
arm64 device or x86_64 emulator, and Bazel 9. Set `ANDROID_HOME` and
`ANDROID_NDK_HOME` to installed SDK and NDK directories.

From repository root:

```sh
bazel build --extra_toolchains=@androidndk//:all --spawn_strategy=local //native/hermes/package:android_sdk
mkdir -p /tmp/formatjs-hermes-android-sdk
tar -xzf bazel-bin/native/hermes/package/formatjs_intl_hermes_android-0.1.0.tar.gz -C /tmp/formatjs-hermes-android-sdk
export FORMATJS_HERMES_SDK=/tmp/formatjs-hermes-android-sdk
cd examples/react-native-hermes
npm ci
npm start
```

In another terminal with same `FORMATJS_HERMES_SDK`:

```sh
npm run android
cd android
./gradlew connectedDebugAndroidTest
```

`IntlScreenTest` checks Hermes, native installation, and every Intl API on
rendered screen. It streams app-content `intl-screen.png` to shell temp storage
so Gradle can uninstall the test APK before capture retrieval.
Pull and compare it against reviewed baseline:

```sh
adb pull /data/local/tmp/intl-screen.png /tmp/intl-screen.png
npm run vrt -- /tmp/intl-screen.png
```

CI runs same test on pinned API 35 x86_64 Pixel 7 emulator, uploads actual and
diff images, then compares pixels with `vrt/intl-screen.png`. Existing editor
VRT handles browser screenshots; this baseline belongs to Android emulator.

The Android SDK archive uses the same C++ adapter sources as desktop SDK,
but provides Android arm64 and x86_64 Rust archives. CMake compiles adapter against
React Native's JSI headers. No desktop Hermes library enters APK.
