# Driver Companion — start here

This is a **separate Flutter mobile project** prepared against the supplied
`car-tracker-rater(2).zip` backend and your original `driver_companion.zip` UI.
Keep it beside your existing work. It has a separate Android application ID, so it
can be installed alongside your earlier app. It does not replace your friend's repository,
firmware, server files or database. Nothing here pushes changes to GitHub.

## 1. What you have

| Priority | Feature | Behaviour |
|---|---|---|
| 1 | Sign-in | Existing backend username/password; authenticated API calls. |
| 1 | Overview | Latest completed journey of at least 1 km, backend score/rating, distance, duration and maximum speed. |
| 1 | History | Up to 100 recent completed journeys, including short journeys. |
| 1 | Journey details | Summary, speed over elapsed time and harsh acceleration/braking/cornering counts. |
| 1 | Device | All linked devices, upload age, online status, GPS/IMU messages and last known position/time. |
| 1 | Refresh and errors | Explicit loading, empty, retry and unavailable states. No invented data after an API failure. |
| Extra 1 | Clear speed graph | Actual sample timestamps; gaps remain gaps rather than false continuous readings. |
| Extra 2 | Saved summary | A successfully downloaded latest summary can be displayed during a later connection failure while signed in. It is labelled as saved data. |
| Extra 3 | Demo scenarios | Explore short/unrated journeys, GPS searching, offline devices and a server failure without an account. |

This is a **read-only companion**: login submits credentials, but the app does not
upload sensor samples, edit devices, edit places, calculate scores or trigger
journey rebuilding. User registration and administration remain on the website.
There is no phone GPS tracking, background monitoring, route map or push notification
service in this version. The ESP32 remains responsible for collecting journey data.

## 2. Open and preview the interface first

Use your existing Flutter installation and VS Code Flutter/Dart extensions.
The Android scaffold comes from your uploaded project; use your installed Flutter
3.47.x for the first run. The Dart source requires Dart 3.9 or later. Internet is
needed the first time packages/build dependencies are downloaded.

Open the **new** `driver_companion_connected` folder in VS Code. Open its terminal.
The terminal must be in the folder containing **pubspec.yaml**.

```powershell
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter run -d chrome --web-port=5173
```

Choose **Explore demo interface**. No server, database credentials or account is
required for this mode. If port 5173 is already in use, preview the demo with
`flutter run -d chrome --web-port=5200` instead. Real login on that second port
needs the CORS allowance described below.

| Command | What it does |
|---|---|
| `flutter pub get` | Downloads packages declared in pubspec.yaml; generates local dependency files. |
| `dart format lib test` | Formats Dart source and test files. It does not run the application. |
| `flutter analyze` | Checks types, imports and code-quality rules without launching the interface. |
| `flutter test` | Runs the included model, graph-gap, HTTP contract and demo-navigation tests. |
| `flutter run -d chrome --web-port=5173` | Compiles the Dart/Flutter project for a browser, starts a local development host and opens Chrome. |
| `flutter devices` | Lists connected phones, emulators and supported browser targets. |

Keep the `flutter run` terminal open. Press **r** for hot reload, **R** for hot
restart or **q** to stop. A single terminal is enough for demo mode. A locally
running backend needs its own running terminal/process at the same time.

## 3. Connect the real backend when it is ready

Use the backend your friend configured. You need:

- A working backend address and an existing user account.
- A device linked to that account, with processed journey data for non-empty screens.
- The backend's valid server-side `.env`, database schema and sync setup.

**Do not put DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY or ThingSpeak keys in Flutter.**
Do not regenerate your friend's encryption key or run seed/rebuild/migration scripts
against the shared database as part of this mobile setup.

If you are running the configured backend locally, open a second terminal in your
existing `car-tracker-rater/server` folder:

```powershell
npm.cmd run dev
```

If dependencies have not yet been installed there, run `npm.cmd install` first.
An error such as `DATABASE_URL is missing in .env` must be resolved in the server
configuration before real login can work. You can continue using demo mode meanwhile.
`http://localhost:5000/health` returning `{ "ok": true }` confirms that Express is
listening; it does **not** prove database access, login or journey processing works.

### Choose the address for the device running Flutter

| Where Flutter runs | Backend on your laptop | Example API base URL |
|---|---|---|
| Chrome on the same laptop | Use localhost | `http://localhost:5000` |
| Standard Android Studio emulator | Use the host alias | `http://10.0.2.2:5000` |
| Your physical Android phone | Use the laptop's private Wi-Fi IPv4 address | `http://192.168.1.20:5000` (example only) |
| Any supported client using a deployed server | Use the real public HTTPS API domain | `https://your-api.example.com` (placeholder) |

Enter that address under **Server address** on the login screen; do not add `/api`
or `/health`. Alternatively supply the default when launching:

```powershell
flutter run -d chrome --web-port=5173 --dart-define=API_BASE_URL=http://localhost:5000
```

For a phone, run `ipconfig` on the laptop and find the active Wi-Fi adapter's IPv4
address. Both devices must be on a network that allows them to communicate. Allow
Node through Windows Firewall for that private network if necessary. First open
`http://YOUR-LAPTOP-IP:5000/health` in the phone's browser. If this cannot be reached,
the app cannot reach it either. Do not expose your laptop's development port publicly.

Then run `flutter devices` and use your actual device identifier:

```powershell
flutter run -d YOUR_DEVICE_ID --dart-define=API_BASE_URL=http://YOUR-LAPTOP-IP:5000
```

Replace both placeholders before running. The Android project includes Internet
permission and permits local HTTP in **debug builds**. Public/release hosting should
use HTTPS; the release scaffold still needs your own signing configuration before
distribution. This ZIP targets Android and web, not iOS or Windows desktop.

### Chrome and CORS

The uploaded backend already allows **http://localhost:5173**. That is why the
Chrome command above uses port 5173. Open that exact origin, rather than
`http://127.0.0.1:5173`, when testing real login.

If the website occupies 5173 and you need Flutter Chrome on 5200, the backend owner
can add the extra development origin in `server/app.js`, preserving the existing one:

```javascript
origin: ["http://localhost:5173", "http://localhost:5200"],
```

This ZIP does not change that backend file. Android native requests do not use
browser CORS checks. Once the API is publicly hosted, your phone can reach it over
other Wi-Fi networks or mobile data; your laptop is needed only while it hosts the API.

## 4. Understand the organisation

| Path | Responsibility | Communicates with |
|---|---|---|
| `lib/main.dart` | Starts Flutter and attempts to restore a remembered session. | App and session |
| `lib/app.dart` | Theme, login/home selection and navigation reset on sign-out. | Session and screens |
| `lib/config/api_config.dart` | Default API address and address validation. | Login/session |
| `lib/models/models.dart` | Converts API JSON into typed users, trips, samples and status snapshots. | Repositories and screens |
| `lib/services/api_client.dart` | HTTP requests, bearer token, timeout and status errors. | Backend API |
| `lib/services/app_session.dart` | Login, logout, session restore and demo selection. | Client, storage and app |
| `lib/services/journey_repository.dart` | Loads journeys, graph samples and device status; scopes saved summaries by server and user. | Client and storage |
| `lib/services/local_store.dart` | Secure native storage; browser memory only. | Session and repository |
| `lib/data/demo_repository.dart` | Invented examples with the same models, selected explicitly. | Demo screens only |
| `lib/screens/` | Login, bottom navigation, Overview, History, Details and Device pages. | Repository and reusable widgets |
| `lib/widgets/` | Loading/error handling, cards, formatting and speed-chart drawing. | Screens/models |
| `lib/theme/` | Shared colours and Material theme. | App/widgets |
| `android/` | Android manifest, Gradle configuration, launch resources and entry activity. | Flutter Android build tools |
| `web/` | Browser bootstrap page, manifest and icons. | Flutter web build tools |
| `test/` | Automated checks for important data and navigation behaviour. | Flutter test runner |
| `pubspec.yaml` | Package name, Dart requirements and dependency declarations. | Flutter package manager |

A tap on Refresh asks the screen's repository for data. The repository calls
`ApiClient`, which sends an HTTP request with the user's token. Express verifies
that token, queries the user's data in Neon/PostgreSQL and returns JSON. Models
parse that JSON; Flutter rebuilds the relevant widgets. **Flutter never connects
directly to Neon.** Database access and ThingSpeak synchronisation stay in the backend.

In Chrome, `web/index.html` loads Flutter's generated bootstrap script. Flutter's
browser runtime renders the widget tree and handles taps, layout and drawing.
The local Flutter development host serves the interface; the separate Express
server on port 5000 serves the JSON API. They have different responsibilities.
On Android the same Dart screens run through Flutter's native engine.

## 5. API compatibility and intentional limits

| API | Use in this app |
|---|---|
| `POST /api/auth/login` | Obtain token and public user details. |
| `GET /api/auth/me` | Verify a remembered native session on startup. |
| `GET /api/trips?limit=1&all=false` | Find the latest completed eligible trip **with an id**. |
| `GET /api/trips?limit=100&all=true` | History, including short completed trips. |
| `GET /api/trips/:id` | Journey summary and event counts. |
| `GET /api/trips/:id/track` | Timestamped speed samples for the chart. |
| `GET /api/status` | Device freshness and backend-decoded sensor states. |

The supplied `/api/trips/latest` returns a different compact object without a trip
id. This app deliberately uses the list plus detail endpoints so the graph button
can open the correct journey **without modifying your friend's backend**.

Scores, rating words, short-journey eligibility and online status are controlled by
the backend. Missing numeric values display as unavailable. All timestamps display
in Mauritius time (MUT, UTC+4). The graph is manually refreshed, not live streamed.
History currently stops at the API's 100-row limit. An empty result can mean no data
is linked to that account; it is not automatically a Flutter problem.

Remembered sign-in is optional on Android; tokens use platform secure storage.
Passwords are never saved by the app. Browser tokens and cached summaries stay in
memory and disappear on reload. Native saved summaries persist, but startup still
requires server verification before opening a remembered account: this is **not
full offline login**. A 401 ends the session and cannot unlock a cached summary.
Signing out removes the current session and its cached summary. The stateless
backend token is removed locally; the app does not implement server-side revocation.

## 6. Explore and verify

1. Enter demo mode. Open Overview → View journey and graph.
2. Open History and the short journey; confirm **Not enough data**, with no invented score.
3. Open Device; use the demo dropdown to try GPS searching and server unavailable.
4. Exit demo, then sign in with a real backend account when configured.
5. Compare one journey's score, distance, event counts and graph against the website/API.
6. Refresh Device and verify its checked time and last-upload time are separate.
7. After a successful Overview load, stop your **own local** server and refresh:
   the saved-summary banner should appear. Restart the server to recover.
8. Sign out; pressing Back must not reopen the previous account's pages.

**Validation status of this delivery:** source syntax/imports, manifests and API
field mappings were checked here. Flutter SDK execution was not initially available
in the preparation environment; see VALIDATION.md for the final checks actually run.
Real backend integration requires your configured server, account and data. Do not
treat a demo screenshot as evidence of a working live connection in your dissertation.

## 7. Common problems

| Symptom | Check |
|---|---|
| `LoginScreen isn't a class` | Use this complete new folder; its login class and app import are included. Do not mix partial old files into it. |
| `pubspec.yaml` or `package.json` missing | The terminal is in the wrong folder. Flutter commands run here; npm commands run in your friend's server folder. |
| Cannot reach server on phone | Use laptop Wi-Fi IP, keep backend running and check private-network firewall rules. Phone localhost means the phone itself. |
| Health works, Chrome login fails | Check exact Chrome origin/port and backend CORS; health does not verify the database. |
| Invalid username or password | Use an account already registered in the backend you are connecting to; demo has no real credentials. |
| No journeys or devices | Verify user ownership, device setup and server sync/processing with your friend. Do not seed the shared database just to fill a screen. |
| Android build/toolchain error | Start with your original Flutter 3.47.x installation and run `flutter doctor -v`; keep the first error to diagnose. |
| Packages have newer versions | An update notice alone is not an error. Let `flutter pub get` resolve the declared versions first. |

When ready to integrate with Git, copy the reviewed mobile folder into an agreed
location on **your own branch**. Do not overwrite `server/`, firmware or your
friend's working branch. Keep `.env`, database credentials and build caches out of Git.
