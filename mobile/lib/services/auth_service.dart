import '../models/user_model.dart';
import 'api_client.dart';

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
    String? avatarUrl,
  }) async {
    final response = await ApiClient.put(
      '/api/auth/profile',
      body: {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      },
      requireAuth: true,
    );

    final userJson = response['user'] as Map<String, dynamic>?;
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
