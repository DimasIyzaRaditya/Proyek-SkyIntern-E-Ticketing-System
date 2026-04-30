import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import '../utils/helpers.dart';

class ApiClient {
  // Optional override via --dart-define=API_HOST=192.168.x.x
  static const String _forcedApiHost = String.fromEnvironment(
    'API_HOST',
    defaultValue: '',
  );

  // Default LAN host for physical devices when no override is provided.
  static const String _defaultLanApiHost = String.fromEnvironment(
    'API_LAN_HOST',
    defaultValue: '192.168.18.38',
  );

  static const String _apiPort = '3000';
  static const String _apiScheme = 'http';
  static const Duration _requestTimeout = Duration(seconds: 20);
  static const Duration _hostProbeTimeout = Duration(milliseconds: 800);

  static String? _resolvedHostCache;
  static Future<String>? _hostResolverFuture;

  static String _fallbackHost() {
    if (_forcedApiHost.trim().isNotEmpty) return _forcedApiHost.trim();

    if (kIsWeb) return 'localhost';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return '10.0.2.2';
      default:
        return _defaultLanApiHost;
    }
  }

  static String _baseUrlForHost(String host) => '$_apiScheme://$host:$_apiPort';

  static bool _isPrivateIpv4Host(String host) {
    final parts = host.split('.');
    if (parts.length != 4) return false;

    final octets = <int>[];
    for (final part in parts) {
      final value = int.tryParse(part);
      if (value == null || value < 0 || value > 255) return false;
      octets.add(value);
    }

    final first = octets[0];
    final second = octets[1];

    if (first == 10) return true;
    if (first == 127) return true;
    if (first == 192 && second == 168) return true;
    if (first == 172 && second >= 16 && second <= 31) return true;

    return false;
  }

  static bool _isLocalNetworkHost(String host) {
    final normalized = host.toLowerCase();
    if (normalized == 'localhost' || normalized == '0.0.0.0') return true;
    if (normalized == '10.0.2.2') return true;
    return _isPrivateIpv4Host(normalized);
  }

  static String? _extractMinioObjectKey(Uri uri) {
    final segments = uri.pathSegments;
    if (segments.length < 2) return null;

    // Expected shape: /<bucket>/<object-key...>
    final objectSegments = segments.skip(1).toList();
    if (objectSegments.isEmpty) return null;

    return objectSegments.join('/');
  }

  static List<String> _candidateHosts() {
    if (_forcedApiHost.trim().isNotEmpty) return [_forcedApiHost.trim()];

    if (kIsWeb) return ['localhost'];

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        // Android emulator first, then physical-device LAN fallback.
        return ['10.0.2.2', _defaultLanApiHost, 'localhost'];
      default:
        return [_defaultLanApiHost, 'localhost'];
    }
  }

  static Future<bool> _isHostReachable(String host) async {
    try {
      final response = await http
          .get(Uri.parse('${_baseUrlForHost(host)}/'))
          .timeout(_hostProbeTimeout);
      return response.statusCode >= 100;
    } catch (_) {
      return false;
    }
  }

  static Future<String> _resolveHost() async {
    if (_resolvedHostCache != null) return _resolvedHostCache!;
    if (_hostResolverFuture != null) return _hostResolverFuture!;

    _hostResolverFuture = () async {
      for (final host in _candidateHosts()) {
        if (await _isHostReachable(host)) {
          _resolvedHostCache = host;
          return host;
        }
      }

      _resolvedHostCache = _fallbackHost();
      return _resolvedHostCache!;
    }();

    final host = await _hostResolverFuture!;
    _hostResolverFuture = null;
    return host;
  }

  static String get _effectiveHostSync => _resolvedHostCache ?? _fallbackHost();

  static String get baseUrl => _baseUrlForHost(_effectiveHostSync);

  static Future<String> getBaseUrl() async {
    final host = await _resolveHost();
    return _baseUrlForHost(host);
  }

  static String normalizePublicUrl(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return trimmed;

    final uri = Uri.tryParse(trimmed);
    if (uri == null || !uri.hasScheme || uri.host.isEmpty) {
      return trimmed;
    }

    final host = uri.host.toLowerCase();
    if (!_isLocalNetworkHost(host)) return trimmed;

    final minioObjectKey = _extractMinioObjectKey(uri);
    if (minioObjectKey != null && uri.port == 9000) {
      final apiUri = Uri.parse(baseUrl);
      return apiUri
          .replace(path: '/api/files', queryParameters: {'key': minioObjectKey})
          .toString();
    }

    return uri.replace(host: _effectiveHostSync).toString();
  }

  static String? _authToken;
  static String? _refreshToken;

  static String? get authToken => _authToken;
  static String? get refreshToken => _refreshToken;

  static void setAuthToken(String token) {
    _authToken = token;
  }

  static void setRefreshToken(String token) {
    _refreshToken = token;
  }

  static void clearAuthToken() {
    _authToken = null;
  }

  static void clearRefreshToken() {
    _refreshToken = null;
  }

  static Future<bool> _refreshAccessToken() async {
    if (_refreshToken == null || _refreshToken!.isEmpty) return false;

    try {
      final resolvedBaseUrl = await getBaseUrl();
      final response = await http
          .post(
            Uri.parse('$resolvedBaseUrl/api/auth/refresh'),
            headers: {
              'Content-Type': 'application/json',
              'X-Platform': 'mobile',
            },
            body: json.encode({'refreshToken': _refreshToken}),
          )
          .timeout(_requestTimeout);

      if (response.statusCode != 200) return false;

      final body = json.decode(response.body) as Map<String, dynamic>;
      final newToken = body['token'] as String?;
      final newRefreshToken = body['refreshToken'] as String?;

      if (newToken == null || newToken.isEmpty) return false;

      setAuthToken(newToken);
      if (newRefreshToken != null && newRefreshToken.isNotEmpty) {
        setRefreshToken(newRefreshToken);
        await LocalStorage.saveRefreshToken(newRefreshToken);
      }

      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<http.Response> _sendWithAuthRetry(
    Future<http.Response> Function() send, {
    required bool requireAuth,
  }) async {
    final response = await send();
    if (response.statusCode != 401 || !requireAuth) return response;

    final refreshed = await _refreshAccessToken();
    if (!refreshed) return response;

    return await send();
  }

  static Future<Map<String, dynamic>> get(
    String endpoint, {
    bool requireAuth = false,
  }) async {
    try {
      final resolvedBaseUrl = await getBaseUrl();
      final headers = {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        if (requireAuth && _authToken != null)
          'Authorization': 'Bearer $_authToken',
      };

      final response = await _sendWithAuthRetry(
        () => http
            .get(Uri.parse('$resolvedBaseUrl$endpoint'), headers: headers)
            .timeout(_requestTimeout),
        requireAuth: requireAuth,
      );

      if (response.statusCode == 401) {
        clearAuthToken();
        clearRefreshToken();
        throw Exception('Sesi login tidak valid. Silakan login kembali.');
      }

      if (response.statusCode == 403) {
        clearAuthToken();
        throw Exception(
          'ACCOUNT_BLOCKED: Akun Anda telah diblokir. Hubungi admin untuk bantuan.',
        );
      }

      if (response.statusCode != 200) {
        final errorBody = json.decode(response.body);
        throw Exception(errorBody['message'] ?? 'Request failed');
      }

      return json.decode(response.body) as Map<String, dynamic>;
    } on TimeoutException {
      throw Exception(
        'Koneksi ke server timeout. Cek API di ${ApiClient.baseUrl} dan jaringan Anda.',
      );
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
      final resolvedBaseUrl = await getBaseUrl();
      final headers = {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        if (requireAuth && _authToken != null)
          'Authorization': 'Bearer $_authToken',
      };

      final response = await _sendWithAuthRetry(
        () => http
            .post(
              Uri.parse('$resolvedBaseUrl$endpoint'),
              headers: headers,
              body: json.encode(body),
            )
            .timeout(_requestTimeout),
        requireAuth: requireAuth,
      );

      if (response.statusCode == 401 && requireAuth) {
        clearAuthToken();
        clearRefreshToken();
        throw Exception('Sesi login tidak valid. Silakan login kembali.');
      }

      if (response.statusCode == 403) {
        clearAuthToken();
        throw Exception(
          'ACCOUNT_BLOCKED: Akun Anda telah diblokir. Hubungi admin untuk bantuan.',
        );
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
      throw Exception(
        'Koneksi ke server timeout. Cek API di ${ApiClient.baseUrl} dan jaringan Anda.',
      );
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
      final resolvedBaseUrl = await getBaseUrl();
      final headers = {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        if (requireAuth && _authToken != null)
          'Authorization': 'Bearer $_authToken',
      };

      final response = await _sendWithAuthRetry(
        () => http
            .put(
              Uri.parse('$resolvedBaseUrl$endpoint'),
              headers: headers,
              body: json.encode(body),
            )
            .timeout(_requestTimeout),
        requireAuth: requireAuth,
      );

      if (response.statusCode == 401) {
        clearAuthToken();
        clearRefreshToken();
        throw Exception('Sesi login tidak valid. Silakan login kembali.');
      }

      if (response.statusCode == 403) {
        clearAuthToken();
        throw Exception(
          'ACCOUNT_BLOCKED: Akun Anda telah diblokir. Hubungi admin untuk bantuan.',
        );
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
      throw Exception(
        'Koneksi ke server timeout. Cek API di ${ApiClient.baseUrl} dan jaringan Anda.',
      );
    } catch (e) {
      rethrow;
    }
  }

  static Future<void> delete(
    String endpoint, {
    bool requireAuth = false,
  }) async {
    try {
      final resolvedBaseUrl = await getBaseUrl();
      final headers = {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        if (requireAuth && _authToken != null)
          'Authorization': 'Bearer $_authToken',
      };

      final response = await _sendWithAuthRetry(
        () => http
            .delete(Uri.parse('$resolvedBaseUrl$endpoint'), headers: headers)
            .timeout(_requestTimeout),
        requireAuth: requireAuth,
      );

      if (response.statusCode == 401) {
        clearAuthToken();
        clearRefreshToken();
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
      throw Exception(
        'Koneksi ke server timeout. Cek API di ${ApiClient.baseUrl} dan jaringan Anda.',
      );
    } catch (e) {
      rethrow;
    }
  }

  static Future<
    ({Uint8List bytes, String? contentDisposition, String? contentType})
  >
  getBytes(String endpoint, {bool requireAuth = false}) async {
    try {
      final resolvedBaseUrl = await getBaseUrl();
      final headers = {
        'X-Platform': 'mobile',
        if (requireAuth && _authToken != null)
          'Authorization': 'Bearer $_authToken',
      };

      final response = await _sendWithAuthRetry(
        () => http
            .get(Uri.parse('$resolvedBaseUrl$endpoint'), headers: headers)
            .timeout(_requestTimeout),
        requireAuth: requireAuth,
      );

      if (response.statusCode == 401) {
        clearAuthToken();
        clearRefreshToken();
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
        throw Exception(
          message ?? 'Download gagal (status ${response.statusCode})',
        );
      }

      return (
        bytes: response.bodyBytes,
        contentDisposition: response.headers['content-disposition'],
        contentType: response.headers['content-type'],
      );
    } on TimeoutException {
      throw Exception(
        'Koneksi ke server timeout. Cek API di ${ApiClient.baseUrl} dan jaringan Anda.',
      );
    } catch (e) {
      rethrow;
    }
  }
}
