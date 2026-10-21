# Release artifacts

| File | Purpose |
| --- | --- |
| `LogistiTrack-1.0.0-release.aab` | Upload this to Google Play Console (recommended) |
| `LogistiTrack-1.0.0-release.apk` | Direct installation / side-load testing |

- Package: `ba.logistitrack.app`
- Version name: `1.0.0`
- Version code: `1`
- Upload key alias: `logistitrack`
- Keystore: `../release.keystore` (ignored by git)
- Passwords: supplied separately in the delivery message.

Back up the keystore and passwords. Google Play uses the upload key to sign
future updates; losing it can block the release. Enrol in Play App Signing so
Google manages the app signing key.
