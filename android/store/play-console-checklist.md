# Google Play Console — release checklist

## Build
- Package: `ba.logistitrack.app`
- Version name: `1.0.0`
- Version code: `1`
- Min SDK: 24 · Target SDK: 35
- Signed AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- Signed APK: `android/app/build/outputs/apk/release/app-release.apk`
- Upload key: `android/release.keystore` (kept out of git), alias `logistitrack`
- Keystore password and key password: provided separately in the delivery message.
  **Back up the keystore and passwords. Losing the upload key can block updates.**

## Store listing
- Title: LogistiTrack
- Short description: Transport operations, fleet, cargo and drivers in one clear app.
- Full description: see `listing-en.md`
- Category: Business
- Contact email: certidevelopment@gmail.com
- Privacy policy: https://logistic-management-ui.pages.dev/privacy
- Account deletion: https://logistic-management-ui.pages.dev/delete-account
- App access: all functionality is behind a login. Provide the Play reviewer with
  the demo accounts from the delivery message (admin, manager, driver1).
  Include the exact navigation path:
  `Open app → sign in as manager → Dashboard / Transports / Drivers`,
  and `sign in as driver1 → My transports → Start route`.
- Ads: No
- In-app purchases: No

## Graphics (in this folder)
- App icon 512×512: `app-icon-512.png`
- Feature graphic 1024×500: `feature-graphic-1024x500.png`
- Phone screenshots 1080×1920 (8): `screenshots/`
  1. Manager dashboard
  2. Transports
  3. Drivers / invitations
  4. Driver home with Start route
  5. Driver transport detail
  6. Admin company registry
  7. Admin platform overview
  8. Dispatch messages

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
- Use `data-safety.md`.
- Declare account deletion URL.
- Declare encrypted in transit.

## Release
1. Create the app in Play Console with the package name.
2. Complete App content: privacy policy, ads, content rating, target audience,
   data safety, government apps (No), financial features (No), health (No).
3. Upload the AAB to Internal testing first.
4. Add the reviewer accounts under App access.
5. Verify the internal test on at least one physical device.
6. Promote to Closed → Open → Production.
7. Use a staged rollout (e.g. 20% → 50% → 100%) for the first release.

## Notes
- The Android app is a WebView shell; the web app is updated independently on
  Cloudflare Pages. No Play Store release is needed for normal UI/content changes.
- The app requires HTTPS and an internet connection. There is no offline mode.
- `INTERNET` and `ACCESS_NETWORK_STATE` are the only permissions.
