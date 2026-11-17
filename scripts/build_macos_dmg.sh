#!/usr/bin/env bash
set -euo pipefail
flutter create --platforms=macos .
flutter pub get
flutter build macos --release
rm -rf dmg_staging mh-apps-gallery-macos.dmg
mkdir -p dmg_staging
cp -R build/macos/Build/Products/Release/*.app dmg_staging/
ln -s /Applications dmg_staging/Applications
hdiutil create -volname "MH Apps Gallery" -srcfolder dmg_staging -ov -format UDZO mh-apps-gallery-macos.dmg
echo "DMG ready at: mh-apps-gallery-macos.dmg"
