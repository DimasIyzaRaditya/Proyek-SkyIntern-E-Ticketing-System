import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';

class ApiClient {
  // Ubah host ini jika pindah jaringan Wi-Fi (khusus device fisik).
  // Cukup edit nilai ini di source code lalu jalankan ulang `flutter run`.
  // Contoh: 192.168.1.10
  static const String _hardcodedApiHost = '192.168.18.38';

  static const String _apiPort = '3000';
  static const String _apiScheme = 'http';
  static const Duration _requestTimeout = Duration(seconds: 20);

  static String get _resolvedHost {
    if (_hardcodedApiHost.isNotEmpty) return _hardcodedApiHost;

    // Fallback default per platform jika hardcoded host dikosongkan.
    if (kIsWeb) return 'localhost';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return '10.0.2.2'; // Android emulator -> host machine
      default:
        return 'localhost'; // Desktop/iOS simulator
    }
  }

  static String get baseUrl => '$_apiScheme://$_resolvedHost:$_apiPort';

  static String normalizePublicUrl(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return trimmed;

    final uri = Uri.tryParse(trimmed);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      return trimmed;
    }

    final host = uri.host.toLowerCase();
    final shouldReplaceHost = host == 'localhost' ||
        host == '127.0.0.1' ||
        host == '10.0.2.2';

    if (!shouldReplaceHost) return trimmed;

    return uri.replace(host: _resolvedHost).toString();
  }

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

  static Future<({Uint8List bytes, String? contentDisposition, String? contentType})> getBytes(
    String endpoint, {
    bool requireAuth = false,
  }) async {
    try {
      final headers = {
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
        throw Exception('Tidak diizinkan mengakses tiket ini.');
      }

      if (response.statusCode != 200) {
        String? message;
        try {
          final parsed = json.decode(response.body) as Map<String, dynamic>;
          message = parsed['message']?.toString();
        } catch (_) {
          message = null;
        }
        throw Exception(message ?? 'Download gagal (status ${response.statusCode})');
      }

      return (
        bytes: response.bodyBytes,
        contentDisposition: response.headers['content-disposition'],
        contentType: response.headers['content-type'],
      );
    } on TimeoutException {
      throw Exception('Koneksi ke server timeout. Cek API di $baseUrl dan jaringan Anda.');
    } catch (e) {
      rethrow;
    }
  }
}
