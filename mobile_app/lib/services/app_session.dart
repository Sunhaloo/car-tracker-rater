import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../data/demo_repository.dart';
import '../models/models.dart';
import 'api_client.dart';
import 'journey_repository.dart';
import 'local_store.dart';

class AppSession extends ChangeNotifier {
  final LocalStore store;
  AppSession({LocalStore? store}) : store = store ?? LocalStore();
  String serverUrl = ApiConfig.baseUrl;
  AppUser? user;
  JourneyRepository? repository;
  ApiClient? _client;
  bool initializing = true;
  bool demo = false;
  int navigationVersion = 0;
  String? notice;
  String _tokenKey(String url) => 'session:$url';

  Future<void> restore() async {
    try {
      serverUrl = ApiConfig.normalize(ApiConfig.baseUrl);
      // Browser tokens deliberately stay in memory for this session only.
      final token = kIsWeb ? null : await store.read(_tokenKey(serverUrl));
      if (token != null) {
        final client = ApiClient(serverUrl, onUnauthorized: _expire)
          ..token = token;
        _client = client;
        try {
          final result = object(await client.request('/api/auth/me'));
          user = AppUser.fromJson(result);
          repository = ApiJourneyRepository(client, store, user!.id);
        } on ApiException catch (error) {
          if (error.status == 401) {
            await store.delete(_tokenKey(serverUrl));
          }
          notice = error.status == 401
              ? 'Your session expired. Please sign in again.'
              : 'Could not restore the session. Check the server and sign in again.';
          client.close();
          _client = null;
        }
      }
    } catch (_) {
      notice = 'Saved sign-in could not be restored. You can sign in below.';
      _client?.close();
      _client = null;
    } finally {
      initializing = false;
      notifyListeners();
    }
  }

  Future<void> signIn(
    String address,
    String username,
    String password, {
    required bool remember,
  }) async {
    final url = ApiConfig.normalize(address);
    final client = ApiClient(url, onUnauthorized: _expire);
    try {
      final result = object(
        await client.request(
          '/api/auth/login',
          method: 'POST',
          body: {'username': username.trim(), 'password': password},
          authenticated: false,
        ),
      );
      final token = text(result['token']);
      if (token == null) {
        throw const FormatException('Login response has no token.');
      }
      final account = AppUser.fromJson(object(result['user']));
      client.token = token;
      notice = null;
      try {
        if (remember && !kIsWeb) {
          await store.write(_tokenKey(url), token);
        } else {
          await store.delete(_tokenKey(url));
        }
      } catch (_) {
        notice = 'Signed in for this session. Secure storage is unavailable.';
      }
      _client?.close();
      _client = client;
      serverUrl = url;
      user = account;
      demo = false;
      repository = ApiJourneyRepository(client, store, account.id);
      navigationVersion++;
      notifyListeners();
    } catch (_) {
      client.close();
      rethrow;
    }
  }

  void enterDemo() {
    _client?.close();
    _client = null;
    user = const AppUser('demo', 'Demo driver');
    repository = DemoRepository();
    demo = true;
    notice = null;
    navigationVersion++;
    notifyListeners();
  }

  void _expire() {
    if (user != null && !demo) {
      notice = 'Your session expired. Please sign in again.';
      logout(keepNotice: true);
    }
  }

  Future<void> logout({bool keepNotice = false}) async {
    final account = user;
    final url = serverUrl;
    final wasDemo = demo;
    user = null;
    repository = null;
    demo = false;
    _client?.close();
    _client = null;
    if (!keepNotice) notice = null;
    navigationVersion++;
    notifyListeners();
    if (!wasDemo) {
      try {
        await store.delete(_tokenKey(url));
        if (account != null) await store.delete('journey:$url:${account.id}');
      } catch (_) {
        /* Session is already removed from memory. */
      }
    }
  }

  @override
  void dispose() {
    _client?.close();
    super.dispose();
  }
}
