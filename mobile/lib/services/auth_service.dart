import '../models/user_model.dart';
import 'api_client.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

class LoginResult {
  final String? token;
  final bool requiresTwoFactor;
  final String? twoFactorToken;

  const LoginResult({
    this.token,
    this.requiresTwoFactor = false,
    this.twoFactorToken,
  });
}

class AuthService {
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    return await ApiClient.post(
      '/api/auth/register',
      body: {
        'name': name,
        'email': email,
        'password': password,
        if (phone != null) 'phone': phone,
      },
    );
  }

  static Future<LoginResult> login({
    required String email,
    required String password,
  }) async {
    final loginResponse = await ApiClient.post(
      '/api/auth/login',
      body: {
        'email': email,
        'password': password,
      },
    );

    final needsTwoFactor = loginResponse['requiresTwoFactor'] == true;
    if (needsTwoFactor) {
      final twoFactorToken = loginResponse['twoFactorToken'] as String?;
      if (twoFactorToken == null || twoFactorToken.isEmpty) {
        throw Exception('Token 2FA tidak tersedia. Silakan ulangi login.');
      }
      return LoginResult(
        requiresTwoFactor: true,
        twoFactorToken: twoFactorToken,
      );
    }

    final token = loginResponse['token'] as String?;
    if (token == null) throw Exception('Token not found in response');

    ApiClient.setAuthToken(token);
    return LoginResult(token: token);
  }

  static Future<String> verifyTwoFactorLogin({
    required String twoFactorToken,
    required String code,
  }) async {
    final verifyResponse = await ApiClient.post(
      '/api/auth/login/2fa/verify',
      body: {
        'twoFactorToken': twoFactorToken,
        'code': code,
      },
    );

    final token = verifyResponse['token'] as String?;
    if (token == null || token.isEmpty) {
      throw Exception('Token login tidak tersedia setelah verifikasi 2FA.');
    }

    ApiClient.setAuthToken(token);
    return token;
  }

  static Future<void> resendTwoFactorCode({
    required String twoFactorToken,
  }) async {
    await ApiClient.post(
      '/api/auth/login/2fa/resend',
      body: {'twoFactorToken': twoFactorToken},
    );
  }

  static Future<UserSession> updateTwoFactorSetting({
    required bool enabled,
  }) async {
    final response = await ApiClient.put(
      '/api/auth/2fa',
      body: {'enabled': enabled},
      requireAuth: true,
    );

    final userJson = response['user'] as Map<String, dynamic>?;
    if (userJson == null) throw Exception('User not found in response');

    return UserSession.fromJson(userJson);
  }

  static Future<UserSession> getProfile() async {
    final response = await ApiClient.get(
      '/api/auth/profile',
      requireAuth: true,
    );

    final userJson = response['user'] as Map<String, dynamic>?;
    if (userJson == null) throw Exception('User not found in response');

    return UserSession.fromJson(userJson);
  }

  static Future<UserSession> updateProfile({
    String? name,
    String? phone,
  }) async {
    final response = await ApiClient.put(
      '/api/auth/profile',
      body: {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
      },
      requireAuth: true,
    );

    final userJson = response['user'] as Map<String, dynamic>?;
    if (userJson == null) throw Exception('User not found in response');

    return UserSession.fromJson(userJson);
  }

  static Future<UserSession> uploadAvatar({
    required List<int> bytes,
    required String fileName,
    required String mimeType,
  }) async {
    final token = ApiClient.authToken;
    if (token == null || token.isEmpty) {
      throw Exception('Sesi login tidak valid. Silakan login kembali.');
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('${ApiClient.baseUrl}/api/auth/avatar'),
    )
      ..headers['Authorization'] = 'Bearer $token'
      ..headers['X-Platform'] = 'mobile';

    final mimeParts = mimeType.split('/');
    final mediaType = mimeParts.length == 2
        ? MediaType(mimeParts[0], mimeParts[1])
      : MediaType('image', 'jpeg');

    request.files.add(
      http.MultipartFile.fromBytes(
        'avatar',
        bytes,
        filename: fileName,
        contentType: mediaType,
      ),
    );

    final streamed = await request.send();
    final responseBody = await streamed.stream.bytesToString();

    if (streamed.statusCode == 401) {
      ApiClient.clearAuthToken();
      throw Exception('Sesi login tidak valid. Silakan login kembali.');
    }

    if (streamed.statusCode != 200) {
      try {
        final body = responseBody.isEmpty
            ? <String, dynamic>{}
            : Map<String, dynamic>.from(jsonDecode(responseBody) as Map);
        throw Exception(body['message']?.toString() ?? 'Upload avatar gagal');
      } catch (_) {
        throw Exception('Upload avatar gagal (status ${streamed.statusCode})');
      }
    }

    final parsed = Map<String, dynamic>.from(
      jsonDecode(responseBody) as Map<String, dynamic>,
    );
    final userJson = parsed['user'] as Map<String, dynamic>?;
    if (userJson == null) throw Exception('User not found in response');

    return UserSession.fromJson(userJson);
  }

  static Future<void> forgotPassword({required String email}) async {
    await ApiClient.post(
      '/api/auth/forgot-password',
      body: {'email': email},
    );
  }

  static Future<void> resetPassword({
    required String resetToken,
    required String newPassword,
  }) async {
    await ApiClient.post(
      '/api/auth/reset-password',
      body: {
        'resetToken': resetToken,
        'newPassword': newPassword,
      },
    );
  }
}
