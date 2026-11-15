# MH Apps Gallery — সব ডিভাইসের জন্য বিল্ড

লোগো: `src/assets/mh-logo.png` ও `public/images/mh-logo.png` = আপনার মূল লোগো, অপরিবর্তিত।
অ্যাপ ওয়েবসাইটের Blogger feed থেকে নিজে ক্যাটালগ আপডেট করে (`src/lib/liveCatalog.ts`), অফলাইনে সর্বশেষ কপি দেখায়।

## ধাপ
1. github.com এ নতুন repository খুলে এই ফোল্ডারের সব ফাইল upload করুন (branch: main)।
2. **Actions** ট্যাবে `Build MH Apps Gallery` চালান।
3. শেষ হলে নামান:
   - `MH-Apps-Gallery-Android-APK` → app-debug.apk
   - `MH-Apps-Gallery-windows-latest` → .exe (installer + portable)
   - `MH-Apps-Gallery-macos-latest` → .dmg (সাইন করা নয়)
4. **iPhone/iPad/Mac:** Settings > Pages থেকে GitHub Pages চালু করুন, Safari-তে লিংক খুলে Share > Add to Home Screen।

## জানা সীমাবদ্ধতা
- এই ফাইলগুলো আমি নিজে চালিয়ে যাচাই করতে পারিনি; প্রথম রানে ছোটখাটো ত্রুটি আসতে পারে — Actions-এর লগ আমাকে পাঠালে ঠিক করে দেব।
- App Store (.ipa) এর জন্য Mac + Apple Developer অ্যাকাউন্ট লাগে। Play Store এর জন্য নিজের keystore দিয়ে signed release লাগে।
- debug APK সরাসরি ফোনে ইনস্টল হয়; আগের v2.2.0 APK এর সাথে সাইন-কী আলাদা, তাই আগেরটা আনইনস্টল করে নতুনটা দিন।
