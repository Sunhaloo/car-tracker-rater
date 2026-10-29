---
id: Car Tracker and Driver Rater - Mobile App Learning
aliases:
  - Learning Flutter for the Car Tracker and Driver Rater
tags:
  - Flutter
  - Dart
  - mobile
  - IoT
  - uni
module: ICT 3207Y
author: Raees Hoohadeedally
date: 2026-10-29
status: Learning Notes
---

> [!INFO] Resources
>
> - [Flutter command-line tool](https://docs.flutter.dev/reference/flutter-cli)
> - [Fetching data with Flutter](https://docs.flutter.dev/cookbook/networking/fetch-data)
> - [Authenticated HTTP requests](https://docs.flutter.dev/cookbook/networking/authenticated-requests)
> - Project code: `mobile_app/`
>
> These notes explain the mobile app developed for this project. The short code examples illustrate parts of the implementation; they are not complete replacement files.

# Why We Built a Mobile App

The website is the main interface for our **Car Tracker and Driver Rater**. My contribution was a simple mobile companion that lets a user check their journeys and vehicle status.

The mobile app retrieves recorded data from our backend. It does not use the phone to collect driving measurements.

| Part | Responsibility |
| --- | --- |
| ESP32, GPS and IMU | Collect the vehicle measurements |
| ThingSpeak | Receive the uploaded sensor readings |
| Express backend | Synchronise data, process journeys, handle login and provide API responses |
| Neon PostgreSQL | Store users, devices, samples and journeys |
| Flutter mobile app | Retrieve and display the signed-in user's information |

> [!NOTE]
> Flutter does not connect directly to the ESP32, ThingSpeak or Neon. It communicates with our **Express API**.

# Tools and Terms

| Term | Simple explanation | Use in this project |
| --- | --- | --- |
| Flutter | Toolkit for building application interfaces | Screens, navigation and Android app builds |
| Dart | Programming language used by Flutter | The mobile application's code |
| VS Code | Code editor | Editing, terminals and debugging |
| Widget | A building block of a Flutter interface | Text, cards, buttons and page layouts |
| API | An interface through which applications request services or data | Communication between Flutter and Express |
| HTTP | Request/response communication | Login and data requests |
| JSON | Structured text used to exchange data | Journey summaries and sensor status responses |
| Token | A credential returned after login | Identifies the signed-in user in later requests |
| Model | A Dart object representing a type of data | Users, journeys, graph samples and device status |

# Creating and Organising the Project

The original Flutter project was created with:

```powershell
flutter create driver_companion
```

This generated the application template. The login, screens, graph and API connection were then implemented in Dart. The reviewed app was added to the shared repository under **`mobile_app`**.

## Why Use Several Files?

Keeping everything in `main.dart` would make the application harder to read. Each folder has a clear purpose:

| File or folder | What it does |
| --- | --- |
| `lib/main.dart` | Starts Flutter and begins session restoration |
| `lib/app.dart` | Sets the theme and chooses the login screen or main interface |
| `lib/config/api_config.dart` | Holds the default backend address and validates an entered address |
| `lib/screens/` | Contains the pages the user opens |
| `lib/models/models.dart` | Converts API responses into structured Dart objects |
| `lib/services/api_client.dart` | Sends HTTP requests and handles response errors |
| `lib/services/app_session.dart` | Handles login, session restoration, sign-out and demo selection |
| `lib/services/journey_repository.dart` | Retrieves journey lists, details, graph samples and status |
| `lib/services/local_store.dart` | Handles local storage; native secure storage and browser memory |
| `lib/data/demo_repository.dart` | Provides invented examples for explicit demo mode |
| `lib/widgets/` | Contains reusable cards, loading/error displays and the speed chart |
| `lib/theme/` | Defines shared colours and appearance |
| `test/` | Contains automated tests |
| `pubspec.yaml` | Declares the app's packages and SDK requirements |
| `android/` and `web/` | Contain platform configuration and launch files |

# Building the Interface

The design uses a light background, white cards, teal controls and a dark driving-score card.

| Screen | What the user can do |
| --- | --- |
| Login | Enter the API address and sign in using an existing project account |
| Overview | Review the latest completed eligible journey and its score |
| History | Browse up to 100 recent completed journeys, including short journeys |
| Journey details | Read a summary, view the speed graph and check harsh-event counts |
| Device | Check the linked devices, upload freshness, GPS/IMU messages and last known position |

Registration, device management and personal places remain on the website.

## Widgets and State

A **StatelessWidget** describes a widget without its own mutable state. A **StatefulWidget** has a separate State object for information that can change.

For example, History became stateful when we added a selected date:

```dart
DateTime? _selectedDate;
```

The `?` means the value can be `null`. Here, `null` means **no date filter is selected**.

When a user chooses a date, `setState` tells Flutter to rebuild the relevant interface:

```dart
setState(() {
  _selectedDate = picked;
});
```

> [!TIP]
> Rebuilding a widget updates its display. It does not automatically mean that the whole app restarts or another database query is made.

# Connecting Flutter to the Backend

## Login

1. The user enters their username and password.
2. Flutter sends a `POST` request to `/api/auth/login`.
3. The backend checks the credentials and returns a token and public user details.
4. Flutter includes the token in subsequent authenticated requests.

The request header has this structure:

```http
Authorization: Bearer <TOKEN_RETURNED_AFTER_LOGIN>
```

> [!WARNING]
> The token above is a placeholder. Never put a real token, password, database connection string or ThingSpeak key in these notes or in committed Flutter source files.

Remembered sign-in is optional on Android and uses secure storage. Passwords are not saved by our app. In the browser preview, the token stays in memory and is lost on reload.

## Retrieving Journey Data

| Request | Purpose |
| --- | --- |
| `GET /api/auth/me` | Verify a remembered session |
| `GET /api/trips?limit=1&all=false` | Find the latest completed eligible journey with an ID |
| `GET /api/trips?limit=100&all=true` | Load History, including short journeys |
| `GET /api/trips/:id` | Load one journey's summary and event counts |
| `GET /api/trips/:id/track` | Load the samples used in its speed graph |
| `GET /api/status` | Load the user's device status |

`:id` means the identifier of the journey being opened.

The compact `/api/trips/latest` response in the reviewed backend had no journey ID. Our Overview therefore uses the list and detail endpoints so it can open the correct journey and graph.

## What Happens After Refresh?

1. The screen asks the repository to load data.
2. The repository uses `ApiClient` to send an authenticated HTTP request.
3. Express checks the token and reads the user's data from Neon.
4. The API returns JSON.
5. The models convert that JSON into Dart objects.
6. Flutter displays the result, or a clear loading, empty or error message.

Network calls are asynchronous. A `Future` represents a result that will arrive later, and `await` lets the function wait for that result without blocking the interface's event loop.

```dart
// Simplified example inside an asynchronous repository method.
final response = await client.request('/api/trips/$id');
final trip = Trip.fromJson(object(response));
```

# Where the Score and Harsh Events Come From

The backend processes the recorded measurements. Flutter displays the returned score, rating and counts rather than calculating another version on the phone.

For example, a journey response can contain:

```json
{
  "events": {
    "accel": 31,
    "brake": 0,
    "corner": 4,
    "total": 35
  }
}
```

The app displays **31 acceleration events, 0 braking events and 4 cornering events**. These values are an example from a journey checked during integration testing; each journey has its own results.

> [!NOTE]
> A score of `0` is a real score. A `null` score means no score was supplied. Missing readings must not be turned into zero values.

# History Date Filter

The calendar button filters the journeys already loaded in History. It does not change anything in the database or download older journeys beyond the 100-row limit.

The API timestamps are UTC. Our display and date filtering use **Mauritius time, UTC+4**:

```dart
final localStart = startedAt.toUtc().add(const Duration(hours: 4));

return localStart.year == selected.year &&
    localStart.month == selected.month &&
    localStart.day == selected.day;
```

For **23 October 2026**, the list shows journeys that **started** on that Mauritius calendar date. Opening one shows that journey's details. **Clear filter** restores the loaded list.

If no journeys match, the page displays **No journeys found for this date**.

# Graph and Device Status

The speed graph is drawn from API samples using a Flutter `CustomPainter`. Its horizontal positions use elapsed time, rather than treating every sample as equally spaced. Missing speeds and long gaps break the line so the app does not invent continuous data.

The Device page displays a server snapshot:

| Information | Meaning |
| --- | --- |
| Checked time | When the backend assessed the devices |
| Last upload | Timestamp of the newest stored sample |
| Data age | How old that sample was at the check |
| GPS/IMU message | Sensor state reported by the backend |
| Last known position | Most recent available GPS position; it may be older than the newest sample |

> [!NOTE]
> **Device offline** and **server unavailable** are different. An offline response means the backend answered but has no recent vehicle upload. A server error means the app could not obtain a usable response. Old data cannot prove whether a sensor is currently working.

# Running the App on the Laptop

Use **two separate terminals** for connected testing.

## Terminal 1: Backend

```powershell
cd "C:\Users\hooha\Desktop\car-tracker-rater\server"
npm.cmd run dev
```

The server needs its correctly configured private `.env`. Check it in a browser:

```text
http://localhost:5000/health
```

Expected response:

```json
{"ok": true}
```

This confirms that the API is listening. Successful login and data retrieval are separate checks of database-backed functionality.

## Terminal 2: Flutter

```powershell
cd "C:\Users\hooha\Desktop\car-tracker-rater\mobile_app"
flutter pub get
flutter run -d chrome --web-port=5173
```

Set the app's **Server address** to:

```text
http://localhost:5000
```

> [!IMPORTANT]
> Stop the React website if it occupies port `5173`. The reviewed backend allows browser origin `http://localhost:5173`, so Flutter Chrome uses that port for connected testing. Native Android does not enforce browser CORS rules.

The React website does not need to run for Flutter to use the API.

# Running on an Android Phone

1. Keep the laptop backend running and connect both devices to the same Wi-Fi.
2. Connect the phone by USB, enable USB debugging and accept the debugging prompt.
3. From `mobile_app`, list the available devices:

```powershell
flutter devices
```

4. Launch using the phone's actual device identifier:

```powershell
flutter run -d YOUR_DEVICE_ID
```

5. Find the laptop's active Wi-Fi IPv4 address with:

```powershell
ipconfig
```

6. On the phone's browser, test `http://YOUR-LAPTOP-IP:5000/health`.
7. In the **app's Server address field**, enter `http://YOUR-LAPTOP-IP:5000`, without `/health`, and sign in.

Replace the placeholders with real values. The project includes Android Internet permission and permits local HTTP in debug builds.

| Connection | Purpose |
| --- | --- |
| USB | Installs the app and connects the debugger |
| Shared Wi-Fi | Lets the phone reach the laptop's API |

After installation, the USB cable can be removed. Press **`d`** in the attached Flutter terminal to detach while leaving the app running. **`q`** stops the app being run by Flutter.

> [!IMPORTANT]
> On a phone, `localhost` means the phone itself. Use the laptop's Wi-Fi address. If that address changes, update the app's Server address.

# Commands Used During Development

Run these checks from `mobile_app`:

```powershell
dart format lib test
flutter analyze
flutter test
```

| Command | Purpose |
| --- | --- |
| `flutter pub get` | Downloads packages declared in `pubspec.yaml` |
| `dart format lib test` | Formats Dart source and test files |
| `flutter analyze` | Checks types, imports and lint rules |
| `flutter test` | Runs automated tests |
| `flutter run` | Builds and launches the app on a selected target |

> [!TIP]
> Run commands from the folder containing the relevant package file: Flutter uses `mobile_app/pubspec.yaml`; npm uses `server/package.json` or `client/package.json`.

# Testing and What We Learned

During the recorded development sessions:

- Code analysis reported **No issues found** and the **seven included automated tests passed**.
- Real account login and journey retrieval worked in Chrome.
- Journey score, harsh-event counts and the speed trace were compared with the website for the same journey.
- The Device page retrieved the linked vehicle and its stale-data/offline status.
- The Android app was built, installed and successfully connected using the laptop's Wi-Fi address.
- The History date filter was added and committed. Its selection, empty-date and clear-filter actions should be checked after future changes; the existing seven tests do not constitute dedicated date-filter coverage.

Small differences in duration and numerical precision were identified as display formatting differences. Matching data does not mean that the sensor calibration or scoring has been independently validated by the mobile app.

Demo mode remains useful for interface demonstrations. It uses invented examples and is selected explicitly; API failures do not silently replace real data with demo values.

# Limits and Keeping Secrets Private

- The API currently runs on a laptop. The phone needs network access to it, so our demonstrated setup uses the same Wi-Fi.
- Stopping the backend prevents new login and fresh data requests. Already loaded information may remain visible; an available saved Overview summary is labelled as saved data.
- The saved summary is not full offline history or offline login. Restoring a remembered native session requires backend verification.
- Internet-wide access would require a reachable hosted API or tunnel. A public tunnel was attempted but was not completed; it is not part of the demonstrated setup.
- Historical data is retrieved on request; the mobile speed graph is not live streaming.
- A complete system test also needs a fresh ESP32 journey flowing through ThingSpeak, the backend and the apps.

> [!WARNING]
> Never commit populated `.env` files, `secrets.h`, passwords, private tokens or ThingSpeak keys. The phone needs the API address, not `DATABASE_URL`, `JWT_SECRET` or `ENCRYPTION_KEY`.

The app lives in `mobile_app/`. Work was developed on the **`mobile` branch**, reviewed through Git changes and merged into **`main`**. Before each new session, check `git status`, save any unfinished work, and update the appropriate branch before editing.

---

**Main lesson:** the ESP32 gathers the measurements, the backend processes and controls access to them, and Flutter presents the results through a simple mobile interface.
