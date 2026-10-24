import 'dart:convert';
import '../models/models.dart';
import 'api_client.dart';
import 'local_store.dart';

abstract class JourneyRepository {
  Future<List<Trip>> trips();
  Future<LatestJourney> latestCompleted();
  Future<TripDetails> details(String id);
  Future<StatusSnapshot> status();
}

class ApiJourneyRepository implements JourneyRepository {
  final ApiClient client;
  final LocalStore store;
  final String userId;
  ApiJourneyRepository(this.client, this.store, this.userId);
  String get cacheKey => 'journey:${client.baseUrl}:$userId';

  Future<List<Trip>> _list({bool all = true, int limit = 100}) async {
    final result = await client.request(
      '/api/trips',
      query: {'limit': '$limit', 'all': '$all'},
    );
    if (result is! List) throw const FormatException('Invalid journey list');
    return result.map((row) => Trip.fromJson(object(row))).toList();
  }

  @override
  Future<List<Trip>> trips() => _list();

  // The uploaded /latest response has no journey id. This safely uses the newest
  // completed trip with an id instead, without changing the shared backend.
  @override
  Future<LatestJourney> latestCompleted() async {
    try {
      final list = await _list(all: false, limit: 1);
      if (list.isEmpty) {
        try {
          await store.delete(cacheKey);
        } catch (_) {
          /* Optional cache. */
        }
        return const LatestJourney(null);
      }
      final raw = object(
        await client.request(
          '/api/trips/${Uri.encodeComponent(list.first.id)}',
        ),
      );
      final trip = Trip.fromJson(raw);
      final now = DateTime.now().toUtc();
      try {
        await store.write(
          cacheKey,
          jsonEncode({'saved_at': now.toIso8601String(), 'trip': raw}),
        );
      } catch (_) {
        /* A storage failure must not hide successfully downloaded data. */
      }
      return LatestJourney(trip, savedAt: now);
    } on ApiException catch (error) {
      // Never bypass an authentication/access failure with cached information.
      if (error.status != null && error.status! < 500) rethrow;
      try {
        final saved = await store.read(cacheKey);
        if (saved != null) {
          final entry = object(jsonDecode(saved));
          return LatestJourney(
            Trip.fromJson(object(entry['trip'])),
            savedCopy: true,
            savedAt: date(entry['saved_at']),
          );
        }
      } catch (_) {
        /* No usable saved copy. Preserve the original error. */
      }
      rethrow;
    }
  }

  @override
  Future<TripDetails> details(String id) async {
    final path = '/api/trips/${Uri.encodeComponent(id)}';
    final raw = object(await client.request(path));
    final rows = await client.request('$path/track');
    if (rows is! List) throw const FormatException('Invalid graph response');
    final points = rows.map((row) => TrackPoint.fromJson(object(row))).toList()
      ..sort((a, b) => a.time.compareTo(b.time));
    return TripDetails(Trip.fromJson(raw), points);
  }

  @override
  Future<StatusSnapshot> status() async =>
      StatusSnapshot.fromJson(object(await client.request('/api/status')));
}
