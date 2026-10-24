import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final String message;
  final int? status;
  const ApiException(this.message, {this.status});
  @override
  String toString() => message;
}

class ApiClient {
  final String baseUrl;
  final http.Client _http;
  final void Function()? onUnauthorized;
  String? token;
  ApiClient(this.baseUrl, {http.Client? client, this.onUnauthorized})
    : _http = client ?? http.Client();

  Future<Object?> request(
    String path, {
    String method = 'GET',
    Map<String, String>? query,
    Map<String, dynamic>? body,
    bool authenticated = true,
  }) async {
    if (authenticated && token == null) {
      throw const ApiException('Please sign in.', status: 401);
    }
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    final headers = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      if (authenticated && token != null) 'Authorization': 'Bearer $token',
    };
    http.Response response;
    try {
      response =
          await (method == 'POST'
                  ? _http.post(uri, headers: headers, body: jsonEncode(body))
                  : _http.get(uri, headers: headers))
              .timeout(const Duration(seconds: 20));
    } on TimeoutException {
      throw const ApiException('The server timed out. Try again.');
    } on http.ClientException {
      throw const ApiException(
        'Cannot reach the server. Check its address, network and browser CORS settings.',
      );
    }
    Object? decoded;
    try {
      decoded = response.body.isEmpty ? null : jsonDecode(response.body);
    } on FormatException {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        throw const ApiException('The server did not return valid JSON.');
      }
    }
    if (response.statusCode == 401 && authenticated) onUnauthorized?.call();
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error = decoded is Map ? decoded['error']?.toString() : null;
      throw ApiException(
        error ?? 'Server request failed (${response.statusCode}).',
        status: response.statusCode,
      );
    }
    return decoded;
  }

  void close() => _http.close();
}
