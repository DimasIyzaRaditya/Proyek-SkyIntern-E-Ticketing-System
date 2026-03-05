import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/user_model.dart';
import 'api_client.dart';

class AuthService {
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
  }) async {
    return await ApiClient.post(
      '/api/auth/register',
      body: {
        'name': name,
        'email': email,
        'password': password,
      },
    );
  }

  static Future<String> login({
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

    final token = loginResponse['token'] as String?;
    if (token == null) throw Exception('Token not found in response');

    ApiClient.setAuthToken(token);
    return token;
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
