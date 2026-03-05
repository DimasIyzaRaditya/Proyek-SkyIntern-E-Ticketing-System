import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/api_client.dart';

class AuthProvider extends ChangeNotifier {
  UserSession? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;

  UserSession? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _token != null && _user != null;

  Future<void> register({
    required String name,
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await AuthService.register(
        name: name,
        email: email,
        password: password,
      );
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await AuthService.login(
        email: email,
        password: password,
      );

      _token = token;
      final user = await AuthService.getProfile();
      _user = user;

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> getProfile() async {
    if (!isAuthenticated) throw Exception('Not authenticated');

    try {
      final user = await AuthService.getProfile();
      _user = user;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updateProfile({
    String? name,
    String? phone,
    String? avatarUrl,
  }) async {
    if (!isAuthenticated) throw Exception('Not authenticated');

    try {
      final user = await AuthService.updateProfile(
        name: name,
        phone: phone,
        avatarUrl: avatarUrl,
      );
      _user = user;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    _error = null;
    ApiClient.clearAuthToken();
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
