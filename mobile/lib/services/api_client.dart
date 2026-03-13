import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiClient {
  // ─── Ganti IP di sini sesuai komputer kamu ───────────────────────────────
  static const String _physicalDeviceIp = '192.168.18.39'; // ← ubah ini
  // ─────────────────────────────────────────────────────────────────────────

  // Ganti _usePhysicalDevice ke true saat run di HP, false saat di emulator/PC
  static const bool _usePhysicalDevice = true;

  static const String _emulatorUrl    = 'http://10.0.2.2:3000';   // Android emulator
  static const String _localhostUrl   = 'http://localhost:3000';   // Desktop / iOS sim
  static const String _physicalUrl    = 'http://$_physicalDeviceIp:3000'; // HP fisik

  static const String baseUrl = _usePhysicalDevice ? _physicalUrl : _localhostUrl;

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
      );

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
      );

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
      );

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
      );

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
    } catch (e) {
      rethrow;
    }
  }
}
