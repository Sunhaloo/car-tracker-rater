# Driver Companion

A separate Flutter Android/web viewer for the supplied Car Tracker and Driver Rater
backend. Start with **[START_HERE.md](START_HERE.md)** for setup, features, architecture,
API mapping and troubleshooting.

```powershell
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter run -d chrome --web-port=5173
```

Choose **Explore demo interface** to preview without the backend. Real sign-in needs
your configured API and an existing account. No backend secrets belong in this app.

This folder is a new project copy. Your friend's backend and firmware are not included
or modified. Android and web project files are included; there is no built APK.
