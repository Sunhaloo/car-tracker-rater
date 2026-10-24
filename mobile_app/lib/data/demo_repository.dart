import '../models/models.dart';
import '../services/journey_repository.dart';
import '../services/api_client.dart';

// Explicit demo mode only. API errors never switch the app into this mode.
class DemoRepository implements JourneyRepository {
  String statusScenario = 'normal';
  JsonMap _trip(int id) => {
    'id': '$id',
    'in_progress': false,
    'started_at': '2026-10-24T04:15:00Z',
    'ended_at': id == 3 ? '2026-10-24T04:19:00Z' : '2026-10-24T04:39:00Z',
    'distance_km': id == 3 ? 0.7 : 12.4,
    'max_speed_kmh': id == 3 ? 24 : 64,
    'max_brake_g': 0.42,
    'score': id == 3
        ? null
        : id == 2
        ? 9.1
        : 7.4,
    'rating': id == 3
        ? 'Not enough data'
        : id == 2
        ? 'Good'
        : 'Normal',
    'start': {'label': 'Home'},
    'end': {'label': id == 3 ? 'Nearby shop' : 'University of Mauritius'},
    'events': {'accel': 1, 'brake': 2, 'corner': 1, 'total': 4},
  };
  @override
  Future<List<Trip>> trips() async =>
      [1, 2, 3].map((id) => Trip.fromJson(_trip(id))).toList();
  @override
  Future<LatestJourney> latestCompleted() async =>
      LatestJourney(Trip.fromJson(_trip(1)), savedAt: DateTime.now().toUtc());
  @override
  Future<TripDetails> details(String id) async {
    final trip = Trip.fromJson(_trip(int.tryParse(id) ?? 1));
    final speeds = id == '3'
        ? <double?>[0, 12, 24, 10, 0]
        : <double?>[0, 25, 42, 35, 64, null, 45, 30, 0, 28, 40, 15, 0];
    final step = id == '3' ? 1 : 2;
    return TripDetails(trip, [
      for (var i = 0; i < speeds.length; i++)
        TrackPoint(trip.startedAt!.add(Duration(minutes: i * step)), speeds[i]),
    ]);
  }

  @override
  Future<StatusSnapshot> status() async {
    if (statusScenario == 'server') {
      throw const ApiException(
        'Demo: server unavailable. Select another demo scenario to recover.',
      );
    }
    return StatusSnapshot.fromJson({
      'checked_at': DateTime.now().toUtc().toIso8601String(),
      'devices': [
        {
          'device_id': '1',
          'label': 'Demo vehicle',
          'online': true,
          'data_age_s': 25,
          'last_seen': DateTime.now()
              .toUtc()
              .subtract(const Duration(seconds: 25))
              .toIso8601String(),
          'gps': {
            'state': statusScenario == 'gps' ? 'warning' : 'ok',
            'message': statusScenario == 'gps'
                ? 'No GPS fix yet — example'
                : 'GPS fix — example',
          },
          'imu': {'state': 'ok', 'message': 'IMU working — example'},
        },
        {
          'device_id': '2',
          'label': 'Offline example',
          'online': false,
          'data_age_s': 300,
          'gps': {'state': 'unknown', 'message': 'No recent data'},
          'imu': {'state': 'unknown', 'message': 'No recent data'},
        },
      ],
    });
  }
}
