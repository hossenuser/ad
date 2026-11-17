flutter create --platforms=windows .
flutter pub get
flutter build windows --release
Write-Host "Windows EXE ready at: build\windows\x64\runner\Release\mh_apps_gallery.exe"
