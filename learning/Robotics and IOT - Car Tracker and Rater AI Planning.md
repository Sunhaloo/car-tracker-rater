# Car Tracker and Driver Rater — Architecture

Status (2026-10-25): backend finished and tested with real data (database, sync, trips, scoring, accounts, devices, status, places). The firmware records and uploads. Scoring thresholds still need calibration on clean drives (board rigidly mounted). The web app (`client/`) is being built now; the Flutter app is built by the teammate.
Course: IoT / Robotics module, University of Mauritius (final-year ICT). The scope is self-defined by the team.
Team: Shehzaad (hardware, firmware, backend, web app) and a teammate (Flutter mobile app).

This file is the single source of truth for what we are building and why. It records the decisions, the contracts between components and the questions we asked on the way. It is written for the team and for AI agents (see section 14).

---

## 1. What we are building

An ESP32 in a car records speed, acceleration, cornering and GPS position once per second and uploads it through a phone hotspot to ThingSpeak. A backend copies the data into a Postgres database, splits it into trips, detects harsh driving events and gives each trip a score from 0 to 10. A web dashboard shows the trip on a map with charts. A simple mobile app shows a text summary. The driver uses it to check and correct their own driving. Comparing with past trips is possible, but comparing between people is not the goal.

The app has user accounts. Each user registers, adds their own ThingSpeak channel (channel ID and read key) in the settings page, and only ever sees their own devices, trips and places.

Goals:
- See the data even when the car and the ESP32 are off.
- Show whether the ESP32 and its sensors are alive (hardware status page).
- Keep driver data private: our own database, per-user access control, no third-party tracking service beyond ThingSpeak.

Non-goals (for now): live tracking with second-level latency, scoring of speed, comparing drivers against each other, public hosting or production deployment (see decision 36), password reset and email verification, roles or admin users.

---

## 2. System overview

```
ESP32 ──push (HTTP, ~every 20 s)──▶ ThingSpeak ◀──pull (HTTP, every 30 s)── Node API (sync, all devices)
(GPS + IMU)                         (cloud inbox)                                │
                                                                                 ▼
                                      Web app (React)  ◀──reads──  Express API ──▶ Neon Postgres
                                      Mobile app (Flutter) ◀──reads──┘   (login with JWT)
```

- The ESP32 never receives anything. It only pushes rows to ThingSpeak.
- ThingSpeak is the always-on inbox. It keeps all data even when our laptops are off.
- Our own Node/Express API (running on a developer laptop, localhost) pulls new rows from ThingSpeak into Neon (`sync`) for every registered device, and serves the web and mobile apps.
- Web and mobile apps only ever talk to our API, never to ThingSpeak or the database directly. Every request except register, login and `/health` carries a login token.
- "The API" in this document always means our Express API. ThingSpeak's own endpoints are called "ThingSpeak read API" and "ThingSpeak write API".

---

## 3. Hardware and firmware

Hardware: ESP32-D (ESP-32D), u-blox NEO-6M GPS, MPU6500 IMU (accelerometer and gyroscope, no magnetometer).

Notes:
- The gyroscope gives angular rates (°/s), not roll/pitch/yaw angles. We use only the yaw rate. Roll and pitch were dropped.
- The firmware connects through a phone hotspot (5 GHz hotspot was tested and worked).
- Timestamps come from NTP over the hotspot connection, in UTC. The firmware does not log rows until the clock is synced; this is the only condition that stops logging. (GPS time is not used.)
- The accelerometer measures gravity as well as motion. Tilting the board, or holding it in the hand, creates fake G values. The board must be fixed rigidly in the car, level, with its axes aligned with the car, and it must be calibrated while parked on level ground (calibration runs in `setup()` before logging starts). Data recorded with the board held in the hand is not usable for scoring.
- The ESP32 logs one row per second whether or not the car moves, as long as it has power and WiFi. A long stop with the engine on stays inside one trip.

Firmware behaviour (implemented in `firmware/car_tracker/car_tracker.ino`; mounting calibration and the reboot at engine start are still being refined):
1. 1 Hz loop. Within each second, keep the sample with the largest magnitude per value (see the data contract).
2. Keep rows in a RAM buffer. Every ~20 s send the buffer to ThingSpeak with one `bulk_update` request.
3. Check the HTTP response code. 202 means accepted (not necessarily stored). 429 comes back as plain text "Retry later" and means the 15 s minimum between bulk requests was violated; keep the buffer and retry.
4. Compute the status bits every second (see section 4).
5. LED logic mirrors the status colours. The LEDs have no effect on logging.
6. IMU mounting calibration: the axes depend on how the board is fixed in the car. Calibrate at rest and apply the sign rules in section 4.
7. If power is cut, the rows still in the RAM buffer (up to ~20 s) are lost. Accepted limitation.
8. Rows without a GPS fix are still logged with G and yaw values (status bits show GPS talking but no fix, for example 5).

---

## 4. Data contract (ESP32 → ThingSpeak)

ThingSpeak channel: free tier, private, 8 numbered fields max.

| Field | Meaning | Unit / sign |
|---|---|---|
| field1 | Speed | km/h |
| field2 | Longitudinal G | + acceleration, − braking |
| field3 | Lateral G | + when the car accelerates to the right (turning right), − left |
| field4 | Yaw rate | °/s, + when turning right |
| field5 | Uptime | seconds since ESP32 boot; a drop means a reboot and a new trip |
| field6 | Status bits | see below |
| field7–8 | Reserved | unused |

Built-in ThingSpeak keys (per row, not numbered fields):
- `latitude`, `longitude`, `elevation` — read back with `location=true`.
- `status` text, e.g. `sats:7` (satellite count) — read back with `status=true`.

Rules:
- Each row holds the value with the largest magnitude seen in that second.
- No GPS fix: omit latitude and longitude. Never send 0,0.
- Values missing because a sensor is not responding are omitted (they come back as null).
- 1 row per second. Batches every ~20 s via `bulk_update`.
- Timestamps in `created_at` as ISO 8601 UTC, distinct per row. Use `created_at` for every row in a batch (do not mix with `delta_t`).

Lateral G sign rule: lateral G is positive when the car accelerates to the right, i.e. when turning right. Occupants feel the force in the opposite direction, but all stored data and all charts use the car-direction convention.

### Status bits (field6)

| Bit | Value | Meaning |
|---|---|---|
| 0 | 1 | GPS talking (data arriving from the module) |
| 1 | 2 | GPS has a fix |
| 2 | 4 | IMU responding |
| 3+ | | Reserved |

| field6 | GPS indicator | IMU indicator |
|---|---|---|
| 0 | grey | grey |
| 1 | orange | grey |
| 3 | green | grey |
| 4 | grey | green |
| 5 | orange | green |
| 7 | green | green |
| 2, 6 | invalid (a fix without talking) | |

Colours: grey = no data / not responding, orange = talking but no fix, green = OK.

The bit masks live in `server/config/index.js` (`statusBits`) and must match the firmware.

ESP32 online/offline is decided from data age, not from the bits: newest row older than 90 s (`offlineAfterMs`) = offline. The age is measured on the rows already in our database, so it includes the firmware batch delay (~20 s) and the sync interval (30 s), about 51 s in the worst case for a healthy device. When offline, the API reports every sensor as "unknown" (grey) and the status page labels the last known position.

### ThingSpeak facts that matter

- Free tier: 15 s minimum between writes, 4 channels, 8 fields per channel.
- `bulk_update`: `POST https://api.thingspeak.com/channels/<id>/bulk_update.json`, up to 960 rows per request on the free tier, at least 15 s between bulk calls.
- Duplicate timestamps are silently dropped even when the response is 202.
- ThingSpeak keeps all data. The "last hour" is only a chart display window. The default `feeds.json` window is 1 day. A read returns at most 8000 rows (about 2 h 13 min at 1 row per second).
- Private channels need `api_key=<READ_KEY>` on reads. Values come back as strings, missing values as null, timestamps in UTC. The URL of a read contains the key: never log it.
- `feeds/last_data_age.json` returns the seconds since the newest entry's `created_at`.
- Mauritius is UTC+4. Store and transport UTC, convert only for display.

Test approach used so far: a `data.json` of 12 rows covering all six status values, posted with
`curl -i -X POST -H "Content-Type: application/json" -d @data.json "https://api.thingspeak.com/channels/<CHANNEL_ID>/bulk_update.json"`
and read back with `.../feeds.json?api_key=<READ_KEY>&location=true&status=true`. Nulls and status text round-trip correctly.

---

## 5. Database (Neon Postgres, managed with Knex migrations)

Neon requires SSL and may suspend when idle (free tier limits to check). Use Knex migrations (CommonJS files in `server/db/migrations/`). The generated column `resultant_g` is created with raw SQL inside the migration. Postgres returns `bigint` as a string and `timestamptz` as a JavaScript `Date`; the API converts ids to numbers.

### `users` — one row per account

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | Primary key; the login token's `sub` |
| `username` | text, not null, unique | Stored lowercase; used to log in |
| `email` | text, not null, unique | Stored lowercase |
| `password_hash` | text, not null | bcrypt (bcryptjs, 10 rounds) |
| `created_at` | timestamptz | |

### `devices` — one ThingSpeak channel per row, owned by a user

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | Primary key |
| `user_id` | bigint, not null | FK → `users.id`, ON DELETE CASCADE; index |
| `label` | text, not null | e.g. "Mazda 3" |
| `thingspeak_channel_id` | integer, not null, unique | One channel cannot belong to two accounts |
| `read_key_encrypted` | text, not null | AES-256-GCM, format `iv:authTag:ciphertext` (base64); never returned by the API |
| `created_at` | timestamptz | |

The ThingSpeak write key is never stored: only the ESP32 needs it.

### `samples` — one row per second, copy of ThingSpeak

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | Primary key |
| `device_id` | bigint, not null | FK → `devices.id`, ON DELETE CASCADE |
| `created_at` | timestamptz, not null | From ThingSpeak; unique together with `device_id`, which makes `sync` idempotent |
| `thingspeak_entry_id` | integer | |
| `speed` | real | km/h |
| `long_g` | real | + accel, − brake |
| `lat_g` | real | + right |
| `resultant_g` | real | Generated: sqrt(long_g² + lat_g²); null if either is null |
| `yaw_rate` | real | °/s |
| `uptime` | integer | seconds |
| `status_bits` | smallint | field6 |
| `latitude` | double precision | |
| `longitude` | double precision | |
| `elevation` | real | |
| `sats` | smallint | Parsed from `sats:N` |
| `step_distance_m` | real | speed/3.6 × seconds since previous row (capped, see section 6); set by `sync` |
| `trip_id` | bigint | FK → `trips.id`, ON DELETE SET NULL; set by `sync` |

All columns except `id`, `device_id` and `created_at` are nullable. Unique constraint on `(device_id, created_at)`. Index on `(trip_id, created_at)`.

### `trips` — summary cache, one row per trip

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | Primary key |
| `device_id` | bigint | FK → `devices.id`, ON DELETE CASCADE; index on `(device_id, started_at)` |
| `driver` | text | Not used by the API |
| `started_at` | timestamptz, not null | |
| `ended_at` | timestamptz | Null while in progress |
| `distance_m` | real | Sum of `step_distance_m` |
| `max_speed` | real | km/h |
| `max_accel_g` | real | max `long_g` (never below 0) |
| `max_brake_g` | real | −min `long_g` (never below 0) |
| `max_right_g` | real | max `lat_g` (never below 0) |
| `max_left_g` | real | −min `lat_g` (never below 0) |
| `max_resultant_g` | real | |
| `score` | real | 0–10; null under the minimum distance |
| `start_latitude`, `start_longitude` | double precision | First row with a GPS fix |
| `end_latitude`, `end_longitude` | double precision | Last row with a GPS fix |
| `start_label`, `end_label` | text | Place names, written when the trip is finalized |

### `places` — personal named places, owned by a user

| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | Primary key |
| `user_id` | bigint, not null | FK → `users.id`, ON DELETE CASCADE; index |
| `label` | text, not null | e.g. "Home", "University of Mauritius" |
| `latitude`, `longitude` | double precision, not null | Centre of the place |
| `radius_m` | integer, not null | Metres around the centre that count as "at" this place (20 to 2000, default 150) |

### Database rules

- Raw `samples` columns are never edited. `sync` only fills `trip_id` and `step_distance_m`.
- `trips` is a cache written at trip end and can be rebuilt from `samples` at any time (for example after changing thresholds), with `node scripts/rebuild-trips.js <deviceId|all>`.
- The rating label (Bad / Normal / Good) is derived from `score`, not stored.
- `places` holds home and workplace coordinates, so it lives in the database, never in the git repo.
- Deleting a device deletes its samples and trips (cascade). Deleting a user deletes their devices and places.
- At the end of the project all tables are emptied before the repository is made public.

---

## 6. Ingestion (`sync`)

`sync` is a function in the Node API (it is not an Arduino function). It copies new rows from ThingSpeak into Neon for every device. It is safe to run at any time and any number of times. It runs by itself when the API starts; nobody runs it by hand.

Steps for each device in `devices` (a failing device is logged and does not stop the others):
1. Decrypt the device's read key.
2. Find the newest `created_at` of that device in `samples`.
3. Ask the ThingSpeak read API for rows from that time on (`start=`, `results=8000`, `location=true`, `status=true`). If exactly 8000 rows come back, a warning is logged; the next tick continues from where this one stopped.
4. Normalise the rows (strings to numbers, missing values stay null, never 0,0, `sats:N` parsed, `-0` becomes 0).
5. Insert the rows in chunks of 500 with `onConflict(["device_id","created_at"]).ignore()`; duplicates are skipped.
6. Process the device's trips (below): fill `trip_id` and `step_distance_m`, close finished trips, finalize summaries and labels.

Triggers: once when the API starts (catch-up), then every 30 s with `setInterval` (`syncIntervalMs`). A `running` flag prevents overlapping runs, and errors are caught (a failed ThingSpeak call is logged and retried on the next tick).

Known cost: every tick queries Neon (the devices list and the newest row), so the database never idles while the API runs. Caching the devices list is a possible later improvement.

Trip rules:
- A new trip starts on the first sample, when `uptime` drops (ESP32 rebooted), or when two consecutive rows are more than **5 minutes** apart (`tripGapMs`).
- Step distance is speed/3.6 × the seconds since the previous row, capped at `maxStepSeconds` (5 s) so a gap does not create a long fake step; a null speed adds 0.
- A trip is **closed** (`ended_at` set, summary, score and labels written) when its newest row is older than **3 minutes** of wall-clock time (`tripCloseWaitMs`).
- Late rows (hotspot dropout: the ESP32 keeps logging and uploads later with correct timestamps) can land in a trip that was already closed. In that case the trip summary is recomputed.
- Trips shorter than **1 km** (`minTripDistanceKm`) get no score. Short sessions (reboots, no GPS fix) are normal and are hidden from the past-trips list by default.

Distance is computed from speed × time, not from GPS position differences, because GPS jitters when stopped.

Running two APIs at once (both developers) is safe for inserts because of the unique key. The close step is safe to run twice.

---

## 7. Scoring

- Speed is **not** scored. Speed is displayed only.
- Three event types, equal weight: hard acceleration (`long_g` above +threshold), hard braking (`long_g` below −threshold), hard cornering (`|lat_g|` above threshold, left or right).
- Starting threshold: **0.30 g** for each (`eventThresholdG`). Hardcoded in one config file, tuned later from real drives (smooth driving, and rougher driving by willing, informed drivers).
- Reasoning: no universal standard exists. Fleet telematics vendors use about 0.2–0.4 g (GPS Insight about 0.37–0.38 g; Positrace 0.20 / 0.25 / 0.30 g). No average-driver dataset was found, so we calibrate ourselves.
- An **event** is a run of consecutive over-threshold rows of one type, counted once (`detectEvents` in `server/services/scoring.js`).
- `events_per_10km = events / (distance_km / 10)`.
- Formula (implemented, not yet calibrated): `score = clamp(10 − 10 × events_per_10km / rBad, 0, 10)`, where `rBad` is the event rate that gives a score of 0. `rBad` is a tunable config value; the current value (5) is a placeholder. Only `rBad` is tuned; `badBelow` and `goodFrom` stay fixed.
- Rating: score below 4 (`badBelow`) = **Bad**, 4 to below 8 = **Normal**, 8 or more (`goodFrom`) = **Good**. The API derives it from the score (`ratingFromScore`).
- Trips under 1 km: no score, no rating.
- Event debounce (a minimum event length, for example 2 consecutive seconds, and ignoring the first ~30 s after boot) is not decided yet.
- Changing the config and rebuilding `trips` re-scores old trips.
- Calibration status: the first real drives were recorded with the board held in the hand and are not usable. Calibrate `rBad` and the thresholds on clean drives with a rigidly mounted board.

---

## 8. Place names (reverse geocoding, DIY)

Decided: no online geocoding API. Labels come from the `places` table and a built-in town list.

Lookup (`labelFor` in `server/services/geo.js`, a pure function), done for the start and end points of a trip when the trip is finalized:
1. A `places` row of the same user whose `radius_m` contains the point → its `label`. If several match, the closest centre wins.
2. Otherwise the nearest entry of the built-in town list (`server/config/towns.js`, about 26 towns with approximate public coordinates, committed to git) within `townMaxDistanceM` (6 km) → the town name.
3. Otherwise the raw coordinates, written with 4 decimals.

Distance between two lat/lon points uses the haversine formula. The radius turns one saved point into an area, covering GPS error (5–10 m) and parking in different spots. Keep radii small: about 100–200 m for a house, 500–1000 m for the university campus. The server accepts 20 to 2000 m; the default is 150 m.

Labels are written once, when the trip is finalized (`labelTrip`), never on page view. Adding or changing a place does not change old trips by itself: `POST /api/places/relabel` rewrites the labels of all of the user's finished trips, and the web app calls it after every change. A later nice-to-have: a "name this place" button on a trip's start or end marker, which would call `POST /api/places` with those coordinates.

---

## 9. API (Express, our own)

All routes are under `/api`, send and receive JSON, and use these status codes: 400 invalid input, 401 missing or invalid token, 404 not found **or not yours**, 409 duplicate, 500 anything unexpected. Errors always look like `{ "error": "message" }`. A request body that is not valid JSON gives 400 `Invalid JSON body`.

Authentication: `Authorization: Bearer <token>` on every route except register, login and `/health`. The token is a JWT (HS256, 7 days) whose `sub` is the user id. There are no server-side sessions: logout is the client deleting its token.

Ownership: every query goes through the logged-in user's devices (trips) or `user_id` (places, devices). A resource of someone else gives the same 404 as one that does not exist.

| Route | Purpose |
|---|---|
| `GET /health` | `{ "ok": true }` (no token) |
| `POST /api/auth/register` | `{ username, email, password }` → 201 with a token; 409 if the username or email exists; password at least 8 characters |
| `POST /api/auth/login` | `{ username, password }` → token; one generic 401 `Invalid username or password` for every failure |
| `GET /api/auth/me` | The logged-in user: id, username, email, created_at |
| `GET /api/trips?limit=&all=` | Finished trips, newest first (`limit` 1–100, default 20). Trips under 1 km are left out unless `all=true` |
| `GET /api/trips/latest` | Payload for the mobile app: newest trip that is in progress or at least 1 km; 404 `No trips yet` if none |
| `GET /api/trips/:id` | Trip summary + `events: { accel, brake, corner, total }` |
| `GET /api/trips/:id/track` | One point per second: `time`, `latitude`, `longitude` (null without a fix), `speed`, `long_g`, `lat_g`, `resultant_g` |
| `GET /api/trips/:id/events` | Harsh events: `type` (accel, brake or corner), `started_at`, `ended_at`, `duration_s`, `peak_g` (signed), `speed_kmh`, `latitude`, `longitude` (null if no fix) |
| `GET /api/status` | `{ checked_at, devices: [...] }` — per device: `device_id`, `label`, `online`, `last_seen`, `data_age_s`, `gps` and `imu` as `{ state: "ok" \| "warning" \| "unknown", message }`, `last_position` (`latitude`, `longitude`, `time`, or null) |
| `GET /api/devices` | The user's devices: `id`, `label`, `thingspeak_channel_id`, `has_read_key`, `created_at` (the key is never returned) |
| `POST /api/devices` | `{ label, thingspeak_channel_id, read_key }`. Tests the channel with ThingSpeak first; 400 if it is rejected, 409 if the channel is already registered |
| `PATCH /api/devices/:id` | Any of `label`, `thingspeak_channel_id`, `read_key`; the final channel + key combination is tested again |
| `DELETE /api/devices/:id` | 204; also deletes the device's samples and trips |
| `GET /api/places`, `POST /api/places` | List and add places: `{ label, latitude, longitude, radius_m? }`; 0,0 is rejected |
| `PATCH /api/places/:id`, `DELETE /api/places/:id` | Change or remove a place (204) |
| `POST /api/places/relabel` | Rewrite the labels of the user's finished trips; returns `{ relabelled_trips }` |

Trip summary fields (`GET /api/trips` items and `GET /api/trips/:id`): `id`, `in_progress`, `started_at`, `ended_at`, `distance_km`, `max_speed_kmh`, `max_accel_g`, `max_brake_g`, `max_right_g`, `max_left_g`, `max_resultant_g`, `score`, `rating`, `start` and `end` as `{ latitude, longitude, label }`. Values the trip does not have are null.

Mobile payload (`GET /api/trips/latest`):
```json
{ "in_progress": false, "start": "...", "end": "...", "start_label": "Home", "end_label": "University of Mauritius",
  "distance_km": 12.4, "max_speed_kmh": 78, "max_g": 0.52, "score": 7.4, "label": "Normal" }
```
The mobile app is text only: start and end places, max G, max speed, distance, rating text and number. While a trip is in progress `end` and `label` are null. The code in `server/routes/` and `server/services/*Queries.js` is the exact reference for names and nullability.

Notes for the Flutter app:
- CORS only affects browsers, so it does not apply to the Flutter app.
- Android emulator: `localhost` is the emulator itself; use `10.0.2.2` for the host machine. A real phone needs the laptop's network address on the same WiFi/hotspot, or a tunnel (Tailscale or ngrok).
- The Express server listens on all network interfaces (`0.0.0.0`), not only on `localhost`.
- The browser CORS rule allows only the origin `http://localhost:5173` (the Vite dev server), with the headers `Content-Type` and `Authorization`.

Accounts and secrets:
- Passwords are hashed with bcrypt. Usernames and emails are stored lowercase.
- ThingSpeak read keys are encrypted with AES-256-GCM using the master key `ENCRYPTION_KEY` (64 hex characters) from `server/.env`. Changing `ENCRYPTION_KEY` makes the stored keys unreadable.
- Tokens are signed with `JWT_SECRET` from `server/.env`.

---

## 10. Web app

Stack: Vite + React (JSX) + Tailwind + shadcn/ui + Recharts (via shadcn's chart component) + react-leaflet + react-router-dom. The API URL comes from `VITE_API_URL` (default `http://localhost:5000`); `VITE_` variables are public, so never put a secret there.

Pages:
1. **Login / Register**: username and password (register also asks for an email). The token is kept in `localStorage` (every access wrapped in try/catch) and sent by one API helper; a 401 clears it and returns the user to the login page.
2. **Past trips** (home): table of finished, rated trips (1 km or more) with a switch to show short sessions; "last 5" comparison and a hardcoded baseline.
3. **Trip view** (main): score and rating, event counts per type, route map, speed and G traces, direction-meter.
4. **Hardware status**: ESP32 online/offline, GPS and IMU colours (grey / orange / green), data age, last known position; refreshed every 10 s.
5. **Settings**: ThingSpeak devices (add, edit, delete; the read key is write-only) and personal places (map click, radius slider with circle preview; relabel after each change).

### Map
- Leaflet + OpenStreetMap (open-source library BSD-2-Clause; OSM data ODbL, keep the "© OpenStreetMap contributors" credit). No account, no API key. The free OSM tile server is for light use only, which is fine at project scale.
- One `<TripMap>` component, so the library could be swapped later.
- Route drawn from rows that have latitude/longitude, coloured by resultant G in a few buckets (merge consecutive same-colour segments into one polyline; enable `preferCanvas`). `map.fitBounds` frames the route.
- Event pins at the harsh-event rows, plus start and end markers. Use circle markers or `divIcon`, not Leaflet's default image icons (they break under Vite's bundling).
- Hovering a chart moves a dot on the route (shared timestamps).
- When drawing, ignore rows with a speed near 0 (about 3 km/h or less) to avoid the GPS scribble while stopped. The track endpoint does not return the satellite count, so speed is the only filter. Raw data stays untouched.
- Data is near-live at best (batches every ~20 s plus sync interval).

### Charts
- **Direction-meter (priority):** radar chart with axes Accelerating, Braking, Left turn, Right turn, plotting max G per direction (from the trip summary), on a **fixed scale** (about 0.6 g) so trips are comparable. Can overlay the average of the last 5 trips. Show the 0.30 g threshold if the component allows it. Labels describe the manoeuvre, using the car-direction sign rule.
- **Event counts per type** next to the score, so the driver learns what to correct. The left/right bias of cornering comes from the signed `peak_g` of the corner events.
- **G-meter (stretch goal):** dot cloud of lat_g (x) against long_g (y) for the trip, with rings at 0.1, 0.2 and 0.3 g. Same data and same sign rule. Flipping to the "felt force" convention would be a sign change.
- Speed and G traces as line charts. A track can hold thousands of points: downsample to about 600 points for the charts, keeping the peak per bucket so spikes are not hidden.
- The 0.30 g threshold is not exposed by the API; the client keeps it in one constant (`src/lib/constants.js`) that must match `server/config/index.js`.

---

## 11. Stack summary

| Layer | Choice |
|---|---|
| Firmware | Arduino C++ on ESP32-D |
| Cloud inbox | ThingSpeak (free tier) |
| Database | Neon Postgres |
| Backend | Node.js, Express 5, Knex, pg (plain JavaScript, no TypeScript); bcryptjs, jsonwebtoken, Node's built-in `crypto` (AES-256-GCM), cors, dotenv; nodemon for development |
| Web | Vite, React (JSX), Tailwind, shadcn/ui (`tsx: false`), Recharts, react-leaflet, react-router-dom |
| Mobile | Flutter (Dart), owned by the teammate |
| Hosting | localhost on a developer laptop; Neon is shared |

TypeScript was considered and rejected for now: JavaScript/JSX throughout the web and backend, because every planned library supports it (checked: shadcn's `components.json` has a `tsx` option that generates `.jsx` files). A `jsconfig.json` (also needed for the `@/` import alias) with JSDoc comments can add editor hints later. shadcn examples are written in TypeScript, so drop type annotations when copying.

---

## 12. Repository layout (one repo)

```
car-tracker-rater/
  README.md
  AGENTS.md                  short guide for AI agents, points here
  docs/
    ARCHITECTURE.md         this file
  firmware/
    car_tracker/car_tracker.ino
    secrets.h.example       WiFi + ThingSpeak keys go in a git-ignored secrets.h
  server/
    app.js                  wires Express, mounts the routers, starts the sync timer
    knexfile.js
    .env.example            names only
    config/
      index.js              thresholds, rBad, rating limits, timings, status bit masks, place limits
      towns.js              built-in town list for place names
    db/
      knex.js               shared Knex instance
      migrations/           users, devices, samples, trips, places, ownership columns
      test-connection.js
    middleware/
      auth.js               'authenticate': checks the Bearer token
    routes/                 thin Express routers: authRoutes, tripRoutes, statusRoutes, deviceRoutes, placeRoutes
    services/
      encryption.js         encrypt / decrypt the ThingSpeak read key
      thingspeak.js         fetch rows after a timestamp, normalise them
      sync.js               fetch, insert, then process trips for every device
      trips.js              assign trips, step distances, finalize, rebuild
      scoring.js            pure: detect events, score, rating
      geo.js                pure: haversine, label lookup
      tripQueries.js        reads for the trips routes (always through the user's devices)
      statusQueries.js      reads for the status route
      deviceService.js      ThingSpeak channel check, hides the key
      placeQueries.js       places CRUD, trip labelling
    scripts/
      seed-dev.js           create the development user and device (arguments: username email password)
      rebuild-trips.js      rebuild the trips of one device or all
    test-*.js               manual checks (sync, ThingSpeak, encryption, geo)
  client/                   Vite + React (JSX)
  mobile/                   Flutter
```

Running locally:
- Backend: `cd server && npm run dev` (nodemon). The sync starts by itself; nothing else has to be run by hand for new data.
- Schema: `npx knex migrate:latest` (inside `server/`).
- Development account: `node scripts/seed-dev.js <username> <email> <password>` (reads the channel from `THINGSPEAK_CHANNEL_ID` and `THINGSPEAK_READ_KEY` in `.env`).
- After changing `server/config/` values: stop the API, run `node scripts/rebuild-trips.js <deviceId|all>`, start the API again.
- Web app: `cd client && npm run dev` (port 5173).

One repo keeps the API contract next to both consumers and avoids drift. The folders are disjoint, so parallel work causes few merge conflicts. Each app keeps its own toolchain.

Secrets never go in git: ThingSpeak read and write keys, the Neon connection string, `JWT_SECRET`, `ENCRYPTION_KEY`, the WiFi password, raw token dumps. They live in `server/.env` and `firmware/secrets.h`, each with a committed `.example` file showing names only. The ThingSpeak read key was pasted into chat during testing and should be regenerated before the repository is made public.

Backend design rules:
- Routes are thin: read the request, call a service, return JSON.
- Pure logic (haversine, event detection, score, place labelling) takes plain data and returns plain data, with no database or network calls, so it can be tested with made-up numbers.
- All tunable numbers live in `server/config/`.
- Express 5 forwards errors thrown in async handlers to the error handler at the end of `app.js`.

---

## 13. Decision log (questions asked → decision)

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | ThingSpeak only shows "the last hour" — is old data lost? | No. It is only the chart window; the data is kept. | Confirmed with a CSV export and a read-back |
| 2 | Keep ThingSpeak or host everything locally? | ThingSpeak as inbox, our own Postgres as the main store | Data stays available when the ESP32 is off |
| 3 | Can the hardware status be seen when the laptop is at home? | Yes. ThingSpeak is always on; "online" = data age under 90 s | Always-on inbox, status computed on read; 90 s because batch (~20 s) + sync (30 s) already take ~51 s |
| 4 | How many fields / channels? | One channel with 6 fields used (+2 reserved), plus built-in lat/lon/elevation/status text | Free tier limit of 8 fields; per-row location keys exist |
| 5 | How to encode sensor health? | Bit flags in field6 (GPS talking, GPS fix, IMU responding) | Compact, all combinations representable |
| 6 | Where do timestamps come from? | NTP over the hotspot, UTC | Reliable once connected; GPS time not needed |
| 7 | How should data be uploaded? | 1 row per second, `bulk_update` every ~20 s | Respects the 15 s limit, tolerant of short dropouts |
| 8 | What database and backend? | Neon Postgres, Node + Express + Knex | Existing experience |
| 9 | Is a trips table needed or are samples enough? | Both: `samples` raw, `trips` rebuildable cache | Fast lists and comparison without recomputing |
| 10 | How is distance computed? | Speed × time | GPS position differences jitter when stopped |
| 11 | How are trips split? | Uptime drop, or gap of more than 5 minutes | ESP32 reboots each time the car starts |
| 12 | How are drivers rated? | Score 0–10, Bad / Normal / Good | Simple and readable |
| 13 | Is speed part of the score? | No | Only acceleration, braking, cornering matter for smooth driving |
| 14 | Do braking, cornering and acceleration weigh differently? | No, equal weight | The tool is for self-correction, not ranking |
| 15 | What thresholds? | 0.30 g each, hardcoded and tuned on real drives | No universal standard or driver dataset exists |
| 16 | How do coordinates become names? | DIY `places` table with radius + built-in town fallback + raw coordinates | Private, free, personal labels |
| 17 | Which map library? | Leaflet + OpenStreetMap | Open source, no key, no billing account |
| 18 | How is the route coloured? | By resultant G, in buckets | It is the point of the project |
| 19 | What should the G chart show? | Direction-meter (radar) first; real G-meter as stretch goal | Non-technical users read manoeuvres more easily |
| 20 | Which sign convention for lateral G? | Car direction: + when turning right | One rule for firmware, database and charts |
| 21 | Where does the API run? | localhost on a developer laptop | Project scope, no hosting cost |
| 22 | When does ingestion run? | On API start (catch-up) and every 30 s | Laptop may be off during drives |
| 23 | When is a trip finished? | 3 minutes after its last row | Batch (~20 s) and timer (≤60 s) delays make 2 minutes too tight |
| 24 | JS or TypeScript? | JavaScript/JSX | All libraries support it; avoids too many new things at once |
| 25 | UI library? | shadcn/ui with Tailwind | Includes radar and other charts, code is owned by us |
| 26 | One repo or several? | One repo with `firmware/`, `server/`, `client/`, `mobile/`, `docs/` | Contract next to both consumers |
| 27 | Single user or several accounts? | Several: register with username + email, log in with username + password | More than one driver can use the app, each with their own channel |
| 28 | How is login done? | JWT (HS256, 7 days) in a Bearer header; bcrypt password hashes; logout = the client deletes the token | Stateless and simple; no session storage |
| 29 | Where do ThingSpeak credentials live? | Per user in `devices`; the read key is encrypted (AES-256-GCM, master key in `.env`) and never returned; the write key is never stored | The sync must reuse the read key; only the ESP32 needs the write key |
| 30 | How is data kept apart between users? | Every query goes through the user's devices or `user_id`; someone else's resource gives 404 | No cross-user reads, and the API does not reveal which ids exist |
| 31 | Should places or coordinates be encrypted? | No | Trip start/end and samples reveal the same locations and must stay queryable in SQL; protection comes from access control, TLS and keeping data out of git |
| 32 | What about trips that are only a few metres long? | No score under 1 km; the past-trips list hides them by default (`all=true` shows them) | Reboot fragments and desk tests are not drives |
| 33 | When are trip labels written? | When a trip is finalized; `POST /api/places/relabel` rewrites them after a place changes | No lookups on page view; old trips stay correct on demand |
| 34 | How are old trips re-scored after a config change? | Stop the API, run `scripts/rebuild-trips.js`, start the API | The trips table is a rebuildable cache |
| 35 | Does the board need to be fixed in the car? | Yes: rigid, level, axes aligned, calibrated while parked on level ground | The accelerometer measures gravity; a hand-held or tilted board gives fake G values |
| 36 | Can the API be hosted on Vercel? | Not as it is: the sync is a long-running process with a timer. Production would need a persistent host for the API; the web client could be static hosting | Out of scope for the assignment |

---

## 14. Guide for AI agents

Read this file first. Section 9 is the API reference; the exact field names and nullability are in `server/routes/` and `server/services/*Queries.js`. If code and this file disagree, ask the owner which one is right before changing either.

Invariants — do not break these:
- Never edit raw `samples` values. `sync` may only set `trip_id` and `step_distance_m`.
- Every query on trips, samples, devices or places must be limited to the logged-in user (through the user's devices, or `user_id`). Another user's resource answers 404.
- Never return or log a ThingSpeak read key, a password hash or a token. Never log a ThingSpeak URL (it contains the key).
- Never reverse-geocode on page view. Place labels are written once when a trip is finalized, or by the relabel route.
- Never call an online geocoding API for labels.
- Never commit keys, connection strings, `JWT_SECRET`, `ENCRYPTION_KEY`, WiFi passwords, raw token dumps or the contents of `places`.
- Never send or accept 0,0 as a position. A missing fix means omitted latitude/longitude.
- Store and transport UTC; convert to Mauritius time (UTC+4) only for display.
- Never score speed.
- Keep all thresholds and timings in `server/config/`. Do not scatter magic numbers.
- Keep `sync` idempotent and safe to run twice.
- Use plain JavaScript and JSX. Do not introduce TypeScript.
- Keep charts and the map using the car-direction sign rule (lateral G positive when turning right).

Conventions:
- Pure functions for haversine, event detection, scoring and labelling; no I/O inside them. Test them with fixed inputs.
- Routes stay thin; logic goes in `services/`.
- Errors are always `{ "error": "message" }`.
- Schema changes go through Knex migrations, one file at a time. The generated column `resultant_g` needs raw SQL.
- The database is the source of truth for trip data; the web app does not keep its own copy.
- Work on the client must not change server code. If the API lacks something, report it.

Working with the owner:
- The owner is a student on a university assignment and wants to understand every part. Prefer explaining and small reviewable steps over large generated blocks, and say which choices were made and why.
- The assignment allows AI use but requires the prompts used to be included as references, so keep them.

---

## 15. Open items

Data and scoring:
- Record clean drives with the board rigidly mounted, then calibrate `rBad` and the 0.30 g thresholds (smooth vs rough, with the drivers' knowledge) and rebuild the trips.
- Decide event debounce (minimum event length) and a warm-up skip after boot; consider smoothing in the firmware before the per-second peak.
- Add the first real `places` rows (Home, University of Mauritius) through the API, never through a committed file.

Firmware:
- IMU mounting calibration and axis signs, checked in the car.
- Investigate the ESP32 reboots (possible power dips at engine start or a loose connection) and the gaps in the ThingSpeak data (a separate upload task is one option).
- Keep the batch interval at ~20 s and check HTTP return codes.

Team:
- Decide how the mobile app reaches the API on demo day (same WiFi/hotspot or a tunnel).
- Check Neon free-tier limits (idle suspension, compute hours); the running sync keeps the database awake.

Before the repository is made public:
- Search the git history for secrets, remove real coordinates and raw tokens from notes, regenerate the ThingSpeak read key, rotate the Neon password if it was ever exposed, delete the test users and empty all tables (`truncate table users, devices, samples, trips, places restart identity cascade;`).

Later / stretch:
- Real G-meter beside the direction-meter.
- "Name this place" button on the trip map.
- Rate limiting on login and register; an "erase my account" route; caching the devices list in the sync.
- OpenAPI file for Flutter model generation.
- TanStack Table if the past-trips page needs sorting and filtering.
- Optional JSDoc for editor hints.
