import 'package:flutter_test/flutter_test.dart';
import 'package:driver_companion/config/api_config.dart';
import 'package:driver_companion/models/models.dart';
import 'package:driver_companion/widgets/speed_chart.dart';

void main() {
  test(
    'Postgres string numbers and missing readings remain distinct from zero',
    () {
      final trip = Trip.fromJson({
        'id': '9007199254740993',
        'in_progress': false,
        'distance_km': '0.7',
        'max_speed_kmh': null,
        'score': null,
        'rating': 'Not enough data',
        'start': null,
        'end': {'label': null},
      });
      expect(trip.id, '9007199254740993');
      expect(trip.distanceKm, 0.7);
      expect(trip.score, isNull);
      expect(trip.maxSpeedKmh, isNull);
      expect(trip.events, isNull);
      expect(trip.startLabel, isNull);
      expect(trip.displayRating, 'Not enough data');
      expect(number(0), 0);
      expect(number('NaN'), isNull);
    },
  );
  test('A null speed and a long sample gap split graph lines', () {
    final start = DateTime.utc(2026, 10, 24);
    TrackPoint point(int second, double? speed) =>
        TrackPoint(start.add(Duration(seconds: second)), speed);
    final segments = speedSegments([
      point(0, 0),
      point(1, 30),
      point(2, null),
      point(3, 40),
      point(4, 45),
      point(20, 50),
    ], const Duration(seconds: 5));
    expect(segments.map((s) => s.length), [2, 2, 1]);
  });
  test(
    'Base URL accepts an origin and rejects embedded credentials or paths',
    () {
      expect(
        ApiConfig.normalize(' http://10.0.2.2:5000/ '),
        'http://10.0.2.2:5000',
      );
      expect(
        () => ApiConfig.normalize('http://localhost:5000/health'),
        throwsFormatException,
      );
      expect(
        () => ApiConfig.normalize('https://person:secret@example.com'),
        throwsFormatException,
      );
    },
  );
  test(
    'No sample is not misrepresented as working GPS or an actual position',
    () {
      final status = DeviceStatus.fromJson({
        'device_id': 1,
        'label': 'Car',
        'online': false,
        'data_age_s': null,
        'last_position': null,
      });
      expect(status.online, isFalse);
      expect(status.gps.state, 'unknown');
      expect(status.latitude, isNull);
      expect(status.ageSeconds, isNull);
    },
  );
}
