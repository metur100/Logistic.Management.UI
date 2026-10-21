# LogistiTrack Android

Native Android WebView shell for `https://logistic-management-ui.pages.dev/`.
The web app is fully responsive and runs full-screen inside the WebView.

## Open / build

1. Open this `android/` folder in Android Studio.
2. Let Gradle sync (AGP 8.7.3, Kotlin 2.0.21, compile/target SDK 35, min SDK 24).
3. Run on a device/emulator, or:

```bash
./gradlew assembleDebug
./gradlew bundleRelease
```

Debug APK: `app/build/outputs/apk/debug/app-debug.apk`

## Behaviour

- HTTPS only (`network_security_config.xml` blocks cleartext).
- Splash screen with the LogistiTrack mark.
- Offline screen with retry.
- Hardware back navigates inside the WebView, then exits.
- Google Maps, `tel:`, `mailto:` and other external schemes open in the matching
  native app.
- Invite links under `/accept-invite/` can open the app directly.
- File inputs are supported for future POD photo uploads.
- JavaScript, DOM storage and cookies enabled; third-party cookies enabled for
  the API session.
- Pull-to-refresh deliberately omitted to avoid conflicts with the web app's
  own scrolling.

## Release signing

Create an upload keystore (keep it private, never commit it):

```bash
keytool -genkeypair -v -keystore release.keystore -alias logistitrack \
  -keyalg RSA -keysize 2048 -validity 10000
```

Create `keystore.properties` in this folder:

```properties
storeFile=release.keystore
storePassword=...
keyAlias=logistitrack
keyPassword=...
```

Then `./gradlew bundleRelease` produces a signed AAB in
`app/build/outputs/bundle/release/`.

A release keystore and `keystore.properties` already exist in this working copy
but are ignored by git. Back them up; the delivery message contains the
passwords.

Verified output on the Android emulator (1080 × 1920): `store/webview-test.png`.

## Play Store

`store/` contains the listing copy, icon, feature graphic and phone
screenshots prepared for the 1080 × 1920 requirement.

Application ID: `ba.logistitrack.app` — change it in `app/build.gradle.kts`
before the first Play Console upload if you prefer another package name.
