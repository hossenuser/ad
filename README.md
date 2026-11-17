# MH Apps Gallery — All Platforms (Android APK, Windows EXE, macOS DMG, iOS IPA)

Flutter cross-platform project connected to https://mhappsgallery.blogspot.com.

## Quick Cloud Build (Recommended — No Mac or Windows PC required!)
1. Create a new GitHub repository and push this entire folder.
2. Open the **Actions** tab on GitHub and run **Build MH Apps Gallery (All Platforms)**.
3. Download the compiled artifacts directly from GitHub Actions:
   - `mh-apps-gallery-android-apk` -> `app-release.apk`
   - `mh-apps-gallery-windows-exe` -> Windows `Release` folder with `.exe`
   - `mh-apps-gallery-macos-dmg` -> `mh-apps-gallery-macos.dmg`
   - `mh-apps-gallery-ios-ipa` -> `mh-apps-gallery-ios-unsigned.ipa`

## Local Build Commands
```bash
flutter create --platforms=android,windows,macos,ios,web .
cp -f android_manifest_template/AndroidManifest.xml android/app/src/main/AndroidManifest.xml
flutter pub get

# Android APK
flutter build apk --release

# Windows EXE (run on Windows with Visual Studio C++ Desktop workload)
flutter build windows --release

# macOS DMG (run on macOS with Xcode)
./scripts/build_macos_dmg.sh

# iOS IPA (run on macOS with Xcode)
./scripts/build_ios_ipa.sh
```

## Brand Asset Policy
`assets/brand/mh_apps_gallery_original.png` is the exact uploaded 1254x1254 PNG (SHA-256 verified).
