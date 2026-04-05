import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../utils/app_theme.dart';
import '../utils/helpers.dart';
import '../widgets/common_widgets.dart';

class LoginTwoFactorScreen extends StatefulWidget {
  final String twoFactorToken;
  final String email;

  const LoginTwoFactorScreen({
    super.key,
    required this.twoFactorToken,
    required this.email,
  });

  @override
  State<LoginTwoFactorScreen> createState() => _LoginTwoFactorScreenState();
}

class _LoginTwoFactorScreenState extends State<LoginTwoFactorScreen> {
  final _codeCtrl = TextEditingController();
  bool _resending = false;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  String _normalizeError(Object e) {
    final raw = e.toString();
    return raw.startsWith('Exception: ') ? raw.substring(11) : raw;
  }

  Future<void> _verify() async {
    final code = _codeCtrl.text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(code)) {
      showSnackBar(context, 'Masukkan 6 digit kode verifikasi.', isError: true);
      return;
    }

    try {
      await context.read<AuthProvider>().verifyTwoFactorLogin(
            twoFactorToken: widget.twoFactorToken,
            code: code,
          );
      if (!mounted) return;
      showSnackBar(context, 'Verifikasi 2FA berhasil.');
      final user = context.read<AuthProvider>().user;
      Navigator.of(context).pushNamedAndRemoveUntil(
        user?.role == 'admin' ? '/admin' : '/dashboard',
        (route) => false,
      );
    } catch (e) {
      if (!mounted) return;
      showSnackBar(context, _normalizeError(e), isError: true);
    }
  }

  Future<void> _resendCode() async {
    setState(() => _resending = true);
    try {
      await context.read<AuthProvider>().resendTwoFactorCode(
            twoFactorToken: widget.twoFactorToken,
          );
      if (mounted) {
        showSnackBar(context, 'Kode baru sudah dikirim ke email Anda.');
      }
    } catch (e) {
      if (mounted) {
        showSnackBar(context, _normalizeError(e), isError: true);
      }
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(title: 'Verifikasi 2FA', showBackButton: true),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: GlassCard(
              padding: const EdgeInsets.all(24),
              borderRadius: 24,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Masukkan Kode Verifikasi',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Kode 6 digit sudah dikirim ke ${widget.email}.',
                    style: const TextStyle(color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: _codeCtrl,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 10,
                    ),
                    decoration: InputDecoration(
                      hintText: '000000',
                      counterText: '',
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Consumer<AuthProvider>(
                    builder: (_, auth, __) => PrimaryButton(
                      label: 'Verifikasi & Login',
                      isLoading: auth.isLoading,
                      onPressed: _verify,
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: _resending ? null : _resendCode,
                    child: Text(_resending ? 'Mengirim ulang...' : 'Kirim Ulang Kode'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
