#!/usr/bin/env bash
set -euo pipefail
flutter create --platforms=ios .
flutter pub get
flutter build ios --release --no-codesign
rm -rf Payload mh-apps-gallery-ios-unsigned.ipa
mkdir -p Payload
cp -R build/ios/iphoneos/Runner.app Payload/
zip -r mh-apps-gallery-ios-unsigned.ipa Payload
echo "Unsigned IPA ready at: mh-apps-gallery-ios-unsigned.ipa"
