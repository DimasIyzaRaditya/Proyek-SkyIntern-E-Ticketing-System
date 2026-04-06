import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/api_client.dart';
import '../services/websocket_service.dart';
import '../utils/helpers.dart';

class AuthProvider extends ChangeNotifier {
  UserSession? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;
  bool _isInitialized = false;

  UserSession? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isInitialized => _isInitialized;
  bool get isAuthenticated => _token != null && _user != null;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    final token = await LocalStorage.getToken();
    final user = await LocalStorage.getUser();
    if (token != null && user != null) {
      _token = token;
      _user = user;
      ApiClient.setAuthToken(token);
      WebSocketService.instance.connect(token: token);
    }
    _isInitialized = true;
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await AuthService.register(name: name, email: email, password: password, phone: phone);
      // Auto-login after registration
      await login(email: email, password: password);
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<LoginResult> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final loginResult = await AuthService.login(email: email, password: password);

      if (loginResult.requiresTwoFactor) {
        _isLoading = false;
        notifyListeners();
        return loginResult;
      }

      _token = loginResult.token;
      final user = await AuthService.getProfile();
      _user = user;
      await LocalStorage.saveUser(_user!, _token!);
      await LocalStorage.saveRecentAccount(_user!);
      WebSocketService.instance.connect(token: _token!);
      _isLoading = false;
      notifyListeners();
      return loginResult;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> verifyTwoFactorLogin({
    required String twoFactorToken,
    required String code,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await AuthService.verifyTwoFactorLogin(
        twoFactorToken: twoFactorToken,
        code: code,
      );
      _token = token;
      final user = await AuthService.getProfile();
      _user = user;
      await LocalStorage.saveUser(_user!, _token!);
      await LocalStorage.saveRecentAccount(_user!);
      WebSocketService.instance.connect(token: _token!);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> resendTwoFactorCode({
    required String twoFactorToken,
  }) async {
    await AuthService.resendTwoFactorCode(twoFactorToken: twoFactorToken);
  }

  Future<void> getProfile() async {
    if (!isAuthenticated) throw Exception('Not authenticated');

    try {
      final user = await AuthService.getProfile();
      _user = user;
      if (_token != null) await LocalStorage.saveUser(_user!, _token!);
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
  }) async {
    if (!isAuthenticated) throw Exception('Not authenticated');

    try {
      final user = await AuthService.updateProfile(
        name: name,
        phone: phone,
      );
      _user = user;
      if (_token != null) await LocalStorage.saveUser(_user!, _token!);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> uploadAvatar({
    required List<int> bytes,
    required String fileName,
    required String mimeType,
  }) async {
    if (!isAuthenticated) throw Exception('Not authenticated');

    try {
      final user = await AuthService.uploadAvatar(
        bytes: bytes,
        fileName: fileName,
        mimeType: mimeType,
      );
      _user = user;
      if (_token != null) await LocalStorage.saveUser(_user!, _token!);
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updateTwoFactorSetting({required bool enabled}) async {
    if (!isAuthenticated) throw Exception('Not authenticated');

    try {
      final user = await AuthService.updateTwoFactorSetting(enabled: enabled);
      _user = user;
      if (_token != null) await LocalStorage.saveUser(_user!, _token!);
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
    WebSocketService.instance.disconnect();
    await LocalStorage.clearAll();
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}

