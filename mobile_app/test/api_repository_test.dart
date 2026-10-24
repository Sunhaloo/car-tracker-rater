import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:driver_companion/services/api_client.dart';
import 'package:driver_companion/services/journey_repository.dart';
import 'package:driver_companion/services/local_store.dart';

class MemoryStore extends LocalStore {
  final data = <String, String>{};
  @override
  Future<String?> read(String key) async => data[key];
  @override
  Future<void> write(String key, String value) async {
    data[key] = value;
  }

  @override
  Future<void> delete(String key) async {
    data.remove(key);
  }
}

void main() {
  test(
    'Latest completed uses list id, bearer token and detail schema',
    () async {
      final calls = <String>[];
      final client = ApiClient(
        'http://example.test',
        client: MockClient((req) async {
          expect(req.headers['Authorization'], 'Bearer sample');
          calls.add(req.url.path);
          if (req.url.path == '/api/trips') {
            expect(req.url.queryParameters, {'all': 'false', 'limit': '1'});
            return http.Response('[{"id":"7","in_progress":false}]', 200);
          }
          return http.Response(
            jsonEncode({
              'id': '7',
              'in_progress': false,
              'score': '8.5',
              'events': {'accel': 1, 'brake': 0, 'corner': 0, 'total': 1},
            }),
            200,
          );
        }),
      )..token = 'sample';
      final repo = ApiJourneyRepository(client, MemoryStore(), '1');
      final latest = await repo.latestCompleted();
      expect(calls, ['/api/trips', '/api/trips/7']);
      expect(latest.trip!.score, 8.5);
      expect(latest.trip!.events!.braking, 0);
      client.close();
    },
  );
  test(
    'Network outage permits a scoped saved summary, 401 never does',
    () async {
      final store = MemoryStore();
      store.data['journey:http://example.test:1'] = jsonEncode({
        'saved_at': '2026-10-24T00:00:00Z',
        'trip': {'id': '7', 'in_progress': false},
      });
      var unauthorized = 0;
      var status = 503;
      final client = ApiClient(
        'http://example.test',
        onUnauthorized: () {
          unauthorized++;
        },
        client: MockClient(
          (req) async => http.Response('{"error":"Unavailable"}', status),
        ),
      )..token = 'sample';
      final repo = ApiJourneyRepository(client, store, '1');
      expect((await repo.latestCompleted()).savedCopy, isTrue);
      status = 401;
      await expectLater(
        repo.latestCompleted(),
        throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)),
      );
      expect(unauthorized, 1);
      // An account with a different id cannot read user 1's cached journey.
      status = 503;
      await expectLater(
        ApiJourneyRepository(client, store, '2').latestCompleted(),
        throwsA(isA<ApiException>()),
      );
      client.close();
    },
  );
}
