import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';

class ApiClient {
  // Optional override saat run app:
  // flutter run --dart-define=API_HOST=192.168.1.7 --dart-define=API_PORT=3000
  static const String _apiHostOverride = String.fromEnvironment('API_HOST', defaultValue: '');
  static const String _apiPort = String.fromEnvironment('API_PORT', defaultValue: '3000');
  static const Duration _requestTimeout = Duration(seconds: 20);

  static String get _resolvedHost {
    if (_apiHostOverride.isNotEmpty) return _apiHostOverride;

    // Default yang aman per platform, tanpa perlu edit manual.
    if (kIsWeb) return 'localhost';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return '10.0.2.2'; // Android emulator -> host machine
      default:
        return 'localhost'; // Desktop/iOS simulator
    }
  }

  static String get baseUrl => 'http://$_resolvedHost:$_apiPort';

  static String? _authToken;
  
  static String? get authToken => _authToken;

  static void setAuthToken(String token) {
    _authToken = token;
  }

  static void clearAuthToken() {
    _authToken = null;
  }

  static Future<Map<String, dynamic>> get(
    String endpoint, {
    bool requireAuth = false,
  }) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        if (requireAuth && _authToken != null) 'Authorization': 'Bearer $_authToken',
      };

      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
      ).timeout(_requestTimeout);

      if (response.statusCode == 401) {
        clearAuthToken();
        throw Exception('Sesi login tidak valid. Silakan login kembali.');
      }

      if (response.statusCode == 403) {
        clearAuthToken();
        throw Exception('ACCOUNT_BLOCKED: Akun Anda telah diblokir. Hubungi admin untuk bantuan.');
      }

      if (response.statusCode != 200) {
        final errorBody = json.decode(response.body);
        throw Exception(errorBody['message'] ?? 'Request failed');
      }

      return json.decode(response.body) as Map<String, dynamic>;
    } on TimeoutException {
      throw Exception('Koneksi ke server timeout. Cek API di $baseUrl dan jaringan Anda.');
    } catch (e) {
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> post(
    String endpoint, {
    required Map<String, dynamic> body,
    bool requireAuth = false,
  }) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        if (requireAuth && _authToken != null) 'Authorization': 'Bearer $_authToken',
      };

      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: json.encode(body),
      ).timeout(_requestTimeout);

      if (response.statusCode == 401 && requireAuth) {
        clearAuthToken();
        throw Exception('Sesi login tidak valid. Silakan login kembali.');
      }

      if (response.statusCode == 403) {
        clearAuthToken();
        throw Exception('ACCOUNT_BLOCKED: Akun Anda telah diblokir. Hubungi admin untuk bantuan.');
      }

      if (response.statusCode != 200 && response.statusCode != 201) {
        try {
          final errorBody = json.decode(response.body);
          throw Exception(errorBody['message'] ?? 'Request gagal');
        } on FormatException {
          throw Exception('Request gagal (status ${response.statusCode})');
        }
      }

      return json.decode(response.body) as Map<String, dynamic>;
    } on TimeoutException {
      throw Exception('Koneksi ke server timeout. Cek API di $baseUrl dan jaringan Anda.');
    } catch (e) {
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> put(
    String endpoint, {
    required Map<String, dynamic> body,
    bool requireAuth = false,
  }) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        if (requireAuth && _authToken != null) 'Authorization': 'Bearer $_authToken',
      };

      final response = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
        body: json.encode(body),
      ).timeout(_requestTimeout);

      if (response.statusCode == 401) {
        clearAuthToken();
        throw Exception('Sesi login tidak valid. Silakan login kembali.');
      }

      if (response.statusCode == 403) {
        clearAuthToken();
        throw Exception('ACCOUNT_BLOCKED: Akun Anda telah diblokir. Hubungi admin untuk bantuan.');
      }

      if (response.statusCode != 200) {
        try {
          final errorBody = json.decode(response.body);
          throw Exception(errorBody['message'] ?? 'Request gagal');
        } on FormatException {
          throw Exception('Request gagal (status ${response.statusCode})');
        }
      }

      return json.decode(response.body) as Map<String, dynamic>;
    } on TimeoutException {
      throw Exception('Koneksi ke server timeout. Cek API di $baseUrl dan jaringan Anda.');
    } catch (e) {
      rethrow;
    }
  }

  static Future<void> delete(
    String endpoint, {
    bool requireAuth = false,
  }) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        if (requireAuth && _authToken != null) 'Authorization': 'Bearer $_authToken',
      };

      final response = await http.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: headers,
      ).timeout(_requestTimeout);

      if (response.statusCode == 401) {
        clearAuthToken();
        throw Exception('Sesi login tidak valid. Silakan login kembali.');
      }

      if (response.statusCode != 200 && response.statusCode != 204) {
        try {
          final errorBody = json.decode(response.body);
          throw Exception(errorBody['message'] ?? 'Hapus gagal');
        } on FormatException {
          throw Exception('Hapus gagal (status ${response.statusCode})');
        }
      }
    } on TimeoutException {
      throw Exception('Koneksi ke server timeout. Cek API di $baseUrl dan jaringan Anda.');
    } catch (e) {
      rethrow;
    }
  }
}
