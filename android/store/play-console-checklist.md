# Google Play Console — release checklist

## Store listing languages
- **Default listing language: Croatian (hr)** — use `listing-hr.md`.
- **Additional listing: English (en)** — use `listing-en.md`.
- App name is **LogistiTrack** in both listings.
- The **app UI** is Bosnian + English (chosen behaviour). The Croatian listing is a
  Croatian translation of the store text, while its screenshots use the Bosnian UI.
  Play Console allows screenshots per listing language; they do not have to match
  the UI language.
- Croatian screenshots: `screenshots-bs/` (8 × 1080×1920).
- English screenshots: `screenshots/` (8 × 1080×1920).
- App icon and feature graphic are global, not per language.

## Build
- Package: `ba.logistitrack.app`
- Version name: `1.0.2`
- Version code: `3`
- Min SDK: 24 · Target SDK: 36 (Android 16)
- Signed AAB: `app/build/outputs/bundle/release/app-release.aab`
- New icon: adaptive route-pin icon (API 26+) + legacy PNGs
- Signed APK: `app/build/outputs/apk/release/app-release.apk`
- Upload key: `../release.keystore` (kept out of git), alias `logistitrack`
- Keystore password and key password: provided separately in the delivery message.
  **Back up the keystore and passwords. Losing the upload key can block updates.**

## Croatian store listing
- Title: LogistiTrack
- Short description: Transportne operacije, vozni park, teret i vozači u jednoj aplikaciji.
- Full description: see `listing-hr.md`
- Category: Business
- Contact email: certidevelopment@gmail.com
- Privacy policy: https://logistic-management-ui.pages.dev/privacy
- Account deletion: https://logistic-management-ui.pages.dev/delete-account
- Ads: No
- In-app purchases: No

## English store listing (additional)
- Title: LogistiTrack
- Short description: Transport operations, fleet, cargo and drivers in one clear app.
- Full description: see `listing-en.md`

## App access (reviewer)
All functionality is behind a login. Provide the demo accounts from the delivery
message (admin, manager, driver1) under **App access**.

Suggested reviewer path:
1. Sign in as `manager` → Dashboard / Transports / Drivers.
2. Sign in as `driver1` → My transports → open a transport → **Start route**.
3. Sign in as `admin` → Companies / Users / Support.

The app UI may appear in Bosnian or English; the language selector is in the
top-right corner of the login screen and in the app sidebar/top bar.

## Graphics (in this folder)
- App icon 512×512: `app-icon-512.png` (global)
- Feature graphic 1024×500:
  - `feature-graphic-hr-1024x500.png` — Croatian tagline (use if hr is primary)
  - `feature-graphic-1024x500.png` — English tagline
  - Play Console accepts **one** global feature graphic; choose one.
- Croatian listing screenshots 1080×1920 (8): `screenshots-bs/`
  1. Manager dashboard
  2. Transports
  3. Drivers / invitations
  4. Driver home with Start route
  5. Driver transport detail
  6. Admin company registry
  7. Admin platform overview
  8. Dispatch messages
- English listing screenshots 1080×1920 (8): `screenshots/`
  (same screens, English UI)

## Content rating
- Business / productivity utility.
- No violence, sexual content, gambling, controlled substances, user-generated
  social feed, or user-to-user public content.
- Users can message only within their own company (driver ↔ dispatch), which is
  private operational messaging, not a public social feed.
- Expected rating: Everyone / PEGI 3, but complete the questionnaire honestly.

## Target audience
- Business users, 18+.
- Not designed for children.

## Data safety
- Use `data-safety.md` (English form answers).
- `data-safety-hr.md` is the Croatian reference translation; the Play Console
  form itself is global, not per language.
- Declare account deletion URL.
- Declare encrypted in transit.

## Release notes 1.0.2
- Version code 3 (versionCode 2 was already used)
- Target Android 16 (API 36)
- New adaptive route-pin app icon

## Release
1. Create the app in Play Console with the package name.
   - **Important:** use versionCode **3** / versionName **1.0.2**; versionCode 2
     was already consumed by Play Console. This build targets API 36.
2. Set **Croatian (hr)** as the default store listing language; add English (en)
   as an additional language.
3. Upload the AAB to Internal testing first.
4. Complete App content: privacy policy, ads, content rating, target audience,
   data safety, government apps (No), financial features (No), health (No).
5. Add reviewer accounts under App access.
6. Verify the internal test on at least one physical device.
7. Promote to Closed → Open → Production.
8. Use a staged rollout (e.g. 20% → 50% → 100%) for the first release.

## Notes
- The Android app is a WebView shell; the web app is updated independently on
  Cloudflare Pages. No Play Store release is needed for normal UI/content changes.
- The app requires HTTPS and an internet connection. There is no offline mode.
- `INTERNET` and `ACCESS_NETWORK_STATE` are the only permissions.
- The Croatian listing uses Bosnian UI screenshots by request. If you later add a
  Croatian UI locale, replace `screenshots-bs/` with Croatian captures.
