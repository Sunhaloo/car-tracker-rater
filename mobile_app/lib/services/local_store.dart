import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Web preview uses memory only. Android uses platform-backed encrypted storage.
class LocalStore {
  final FlutterSecureStorage _secure = const FlutterSecureStorage();
  final Map<String, String> _memory = {};
  Future<String?> read(String key) async {
    if (kIsWeb) return _memory[key];
    return _secure.read(key: key);
  }

  Future<void> write(String key, String value) async {
    if (kIsWeb) {
      _memory[key] = value;
    } else {
      await _secure.write(key: key, value: value);
    }
  }

  Future<void> delete(String key) async {
    if (kIsWeb) {
      _memory.remove(key);
    } else {
      await _secure.delete(key: key);
    }
  }
}
