import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../utils/helpers.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _isLoading = false;
  bool _success = false;
  String? _token;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _handleDeepLink();
    });
  }

  void _handleDeepLink() {
    // First try to get token from route arguments
    final modalRoute = ModalRoute.of(context);
    if (modalRoute?.settings.arguments != null) {
      final args = modalRoute!.settings.arguments as Map<String, dynamic>;
      _token = args['token'] as String?;
    }

    // If no token from arguments, check URL query parameters
    if (_token == null || _token!.isEmpty) {
      final uri = Uri.base;
      if (uri.queryParameters.containsKey('token')) {
        _token = uri.queryParameters['token'];
      }
    }

    // If still no token, try to parse from current URL path
    if (_token == null || _token!.isEmpty) {
      final currentUrl = Uri.base.toString();
      final regex = RegExp(r'[?&]token=([^&]+)');
      final match = regex.firstMatch(currentUrl);
      if (match != null) {
        _token = match.group(1);
      }
    }

    // Debug: print the token and URL for troubleshooting
    print('Debug - Current URL: ${Uri.base}');
    print('Debug - Token found: $_token');

    if (_token == null || _token!.isEmpty) {
      if (mounted) {
        showSnackBar(context, 'Token reset password tidak valid atau tidak ditemukan', isError: true);
        Navigator.pushReplacementNamed(context, '/login');
      }
    }
  }

  @override
  void dispose() {
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate() || _token == null) return;

    setState(() => _isLoading = true);

    try {
      await AuthService.resetPassword(
        resetToken: _token!,
        newPassword: _passwordCtrl.text.trim(),
      );

      if (mounted) {
        setState(() {
          _success = true;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        showSnackBar(
          context,
          e.toString().replaceFirst('Exception: ', ''),
          isError: true,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
            boxShadow: [BoxShadow(color: Color(0x220EA5E9), blurRadius: 12, offset: Offset(0, 4))],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            automaticallyImplyLeading: false,
            title: const Text('Reset Password', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: _success ? _buildSuccess() : _buildForm(),
      ),
    );
  }

  Widget _buildSuccess() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.check_circle_outline,
          size: 80,
          color: Colors.green.shade400,
        ),
        const SizedBox(height: 24),
        const Text(
          'Password Berhasil Direset!',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          'Password Anda telah berhasil diperbarui.\nSilakan login dengan password baru.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey.shade600),
        ),
        const SizedBox(height: 32),
        PrimaryButton(
          label: 'Login Sekarang',
          onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.lock_reset,
            size: 64,
            color: Colors.blue.shade400,
          ),
          const SizedBox(height: 16),
          const Text(
            'Reset Password',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Masukkan password baru untuk akun Anda.',
            style: TextStyle(color: Colors.grey.shade600),
          ),
          const SizedBox(height: 32),

          // New Password Field
          InputField(
            label: 'Password Baru',
            controller: _passwordCtrl,
            obscureText: _obscurePassword,
            suffixIcon: IconButton(
              icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Password baru wajib diisi';
              }
              if (value.length < 6) {
                return 'Password minimal 6 karakter';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Confirm Password Field
          InputField(
            label: 'Konfirmasi Password',
            controller: _confirmPasswordCtrl,
            obscureText: _obscureConfirmPassword,
            suffixIcon: IconButton(
              icon: Icon(_obscureConfirmPassword ? Icons.visibility : Icons.visibility_off),
              onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Konfirmasi password wajib diisi';
              }
              if (value != _passwordCtrl.text) {
                return 'Password tidak cocok';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),

          PrimaryButton(
            label: 'Reset Password',
            onPressed: _handleResetPassword,
            isLoading: _isLoading,
          ),
          const SizedBox(height: 16),

          Center(
            child: TextButton(
              onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
              child: const Text('Kembali ke Login'),
            ),
          ),
        ],
      ),
    );
  }
}