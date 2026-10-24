typedef JsonMap = Map<String, dynamic>;

double? number(Object? value) {
  final result = value is num ? value.toDouble() : double.tryParse('$value');
  return result != null && result.isFinite ? result : null;
}

DateTime? date(Object? value) =>
    value == null ? null : DateTime.tryParse('$value')?.toUtc();
String? text(Object? value) {
  if (value == null || '$value'.trim().isEmpty) return null;
  return '$value';
}

JsonMap object(Object? value) =>
    value is Map ? Map<String, dynamic>.from(value) : {};

class AppUser {
  final String id;
  final String username;
  const AppUser(this.id, this.username);
  factory AppUser.fromJson(JsonMap json) {
    final id = text(json['id']);
    final username = text(json['username']);
    if (id == null || username == null) {
      throw const FormatException('Invalid user response');
    }
    return AppUser(id, username);
  }
}

class EventCounts {
  final int? acceleration;
  final int? braking;
  final int? cornering;
  final int? total;
  const EventCounts({
    this.acceleration,
    this.braking,
    this.cornering,
    this.total,
  });
  factory EventCounts.fromJson(JsonMap json) => EventCounts(
    acceleration: number(json['accel'])?.toInt(),
    braking: number(json['brake'])?.toInt(),
    cornering: number(json['corner'])?.toInt(),
    total: number(json['total'])?.toInt(),
  );
}

class Trip {
  final String id;
  final bool inProgress;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final double? distanceKm;
  final double? maxSpeedKmh;
  final double? maxBrakeG;
  final double? score;
  final String? rating;
  final String? startLabel;
  final String? endLabel;
  final EventCounts? events;
  const Trip({
    required this.id,
    required this.inProgress,
    this.startedAt,
    this.endedAt,
    this.distanceKm,
    this.maxSpeedKmh,
    this.maxBrakeG,
    this.score,
    this.rating,
    this.startLabel,
    this.endLabel,
    this.events,
  });
  factory Trip.fromJson(JsonMap json) {
    final id = text(json['id']);
    if (id == null) throw const FormatException('Journey response has no id');
    return Trip(
      id: id,
      inProgress: json['in_progress'] == true,
      startedAt: date(json['started_at']),
      endedAt: date(json['ended_at']),
      distanceKm: number(json['distance_km']),
      maxSpeedKmh: number(json['max_speed_kmh']),
      maxBrakeG: number(json['max_brake_g']),
      score: number(json['score']),
      rating: text(json['rating']),
      startLabel: text(object(json['start'])['label']),
      endLabel: text(object(json['end'])['label']),
      events: json['events'] is Map
          ? EventCounts.fromJson(object(json['events']))
          : null,
    );
  }
  String get displayRating =>
      inProgress ? 'In progress' : rating ?? 'Rating unavailable';
}

class TrackPoint {
  final DateTime time;
  final double? speedKmh;
  const TrackPoint(this.time, this.speedKmh);
  factory TrackPoint.fromJson(JsonMap json) {
    final time = date(json['time']);
    if (time == null) throw const FormatException('Invalid graph timestamp');
    return TrackPoint(time, number(json['speed']));
  }
}

class SensorStatus {
  final String state;
  final String message;
  const SensorStatus(this.state, this.message);
  factory SensorStatus.fromJson(JsonMap json) => SensorStatus(
    text(json['state']) ?? 'unknown',
    text(json['message']) ?? 'No recent data',
  );
}

class DeviceStatus {
  final String id;
  final String label;
  final bool online;
  final int? ageSeconds;
  final DateTime? lastSeen;
  final SensorStatus gps;
  final SensorStatus imu;
  final DateTime? lastPositionTime;
  final double? latitude;
  final double? longitude;
  const DeviceStatus({
    required this.id,
    required this.label,
    required this.online,
    this.ageSeconds,
    this.lastSeen,
    required this.gps,
    required this.imu,
    this.lastPositionTime,
    this.latitude,
    this.longitude,
  });
  factory DeviceStatus.fromJson(JsonMap json) {
    final pos = object(json['last_position']);
    return DeviceStatus(
      id: '${json['device_id']}',
      label: text(json['label']) ?? 'Device',
      online: json['online'] == true,
      ageSeconds: number(json['data_age_s'])?.toInt(),
      lastSeen: date(json['last_seen']),
      gps: SensorStatus.fromJson(object(json['gps'])),
      imu: SensorStatus.fromJson(object(json['imu'])),
      lastPositionTime: date(pos['time']),
      latitude: number(pos['latitude']),
      longitude: number(pos['longitude']),
    );
  }
}

class StatusSnapshot {
  final DateTime? checkedAt;
  final List<DeviceStatus> devices;
  const StatusSnapshot(this.checkedAt, this.devices);
  factory StatusSnapshot.fromJson(JsonMap json) {
    if (json['devices'] is! List) {
      throw const FormatException('Invalid device response');
    }
    return StatusSnapshot(
      date(json['checked_at']),
      (json['devices'] as List)
          .map((e) => DeviceStatus.fromJson(object(e)))
          .toList(),
    );
  }
}

class LatestJourney {
  final Trip? trip;
  final bool savedCopy;
  final DateTime? savedAt;
  const LatestJourney(this.trip, {this.savedCopy = false, this.savedAt});
}

class TripDetails {
  final Trip trip;
  final List<TrackPoint> track;
  const TripDetails(this.trip, this.track);
}
