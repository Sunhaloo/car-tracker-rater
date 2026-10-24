# Delivery validation

## Checks completed during preparation

- Parsed all **22 Dart files** with a Dart grammar parser: no syntax-error nodes.
- Resolved **56 project/relative imports**: no missing target files.
- Parsed **7 Android XML files**, the YAML configuration and web manifest.
- Checked the API routes and JSON field names against the supplied backend source,
  including login, /me, journey lists/details/track and device status.
- Confirmed that Android Internet permission, a separate application ID and debug-only
  local HTTP support are present.
- Checked the distribution tree for credentials, machine-specific properties and
  dependency/build caches; these are excluded.

Grammar parsing is **not** Dart type analysis and does not prove a successful build.

## Included automated tests — not executed here

| Test file | Purpose |
|---|---|
| `test/models_and_chart_test.dart` | Missing values, string-number parsing, large IDs, URL validation, sensor unknown states and graph gaps. |
| `test/api_repository_test.dart` | Bearer headers, latest-completed endpoint contract, saved-summary fallback, 401 rejection and user-scoped cache isolation. |
| `test/demo_flow_test.dart` | Login → demo → journey details → exit; navigation resets on sign-out. |

The Flutter SDK was not available in the preparation environment. Therefore
`dart format`, `flutter analyze`, `flutter test`, Chrome execution and an Android
build have **not** been run here. The shared database and authenticated live API
were not accessed. No APK is included.

## Run on your machine before integration

```powershell
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter run -d chrome --web-port=5173
```

Then follow the manual demo and real-backend checks in START_HERE.md. If a check
fails, keep the full first error and the file/line shown. Review the mobile copy
before moving it into your own Git branch; the existing backend remains untouched.
