#!/usr/bin/env bash
set -euo pipefail
flutter create --platforms=android .
cp -f android_manifest_template/AndroidManifest.xml android/app/src/main/AndroidManifest.xml
flutter pub get
flutter build apk --release
echo "APK ready at: build/app/outputs/flutter-apk/app-release.apk"
