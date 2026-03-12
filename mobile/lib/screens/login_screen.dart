import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/app_theme.dart';
import '../utils/helpers.dart';
import '../widgets/common_widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _showPass = false;
  String? _loginError;
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _fadeAnim =
        CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero)
        .animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic));
    _animCtrl.forward();
    _emailCtrl.addListener(_clearError);
    _passCtrl.addListener(_clearError);
  }

  void _clearError() {
    if (_loginError != null) setState(() => _loginError = null);
  }

  @override
  void dispose() {
    _emailCtrl.removeListener(_clearError);
    _passCtrl.removeListener(_clearError);
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _animCtrl.dispose();
    super.dispose();
  }

  String _parseError(Object e) {
    final msg = e.toString();
    if (msg.startsWith('Exception: ')) return msg.substring(11);
    return msg;
  }

  Future<void> _handleLogin() async {
    final email = _emailCtrl.text.trim().toLowerCase();
    final password = _passCtrl.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() => _loginError = 'Isi email dan password terlebih dahulu');
      return;
    }

    setState(() => _loginError = null);

    try {
      final auth = context.read<AuthProvider>();
      await auth.login(email: email, password: password);
      if (mounted) {
        showSnackBar(context, 'Selamat datang kembali!');
        final user = context.read<AuthProvider>().user;
        if (user?.role == 'admin') {
          Navigator.of(context).pushReplacementNamed('/admin');
        } else {
          Navigator.of(context).pushReplacementNamed('/dashboard');
        }
      }
    } catch (e) {
      if (mounted) setState(() => _loginError = _parseError(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 600;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Sky gradient background header
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: size.height * 0.38,
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(40),
                  bottomRight: Radius.circular(40),
                ),
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(
                    horizontal: isWide ? size.width * 0.2 : 24,
                    vertical: 24),
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SlideTransition(
                    position: _slideAnim,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 24),
                        // Logo
                        Center(
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: Colors.white.withValues(alpha: 0.4),
                                      width: 2),
                                ),
                                child: const Icon(Icons.flight_rounded,
                                    size: 48, color: Colors.white),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'SkyIntern',
                                style: TextStyle(
                                  fontSize: 30,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  letterSpacing: 1,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'E-Ticketing System',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.white.withValues(alpha: 0.85),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 40),

                        // Card form
                        GlassCard(
                          padding: const EdgeInsets.all(28),
                          borderRadius: 24,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Text(
                                'Masuk ke Akun',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Selamat datang kembali di SkyIntern',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary),
                              ),
                              const SizedBox(height: 28),

                              InputField(
                                label: 'Email',
                                hint: 'nama@gmail.com',
                                controller: _emailCtrl,
                                keyboardType: TextInputType.emailAddress,
                                prefixIcon: const Icon(Icons.email_outlined,
                                    color: AppColors.textHint, size: 20),
                                textInputAction: TextInputAction.next,
                              ),
                              const SizedBox(height: 16),

                              InputField(
                                label: 'Password',
                                hint: '••••••••',
                                controller: _passCtrl,
                                obscureText: !_showPass,
                                prefixIcon: const Icon(Icons.lock_outline,
                                    color: AppColors.textHint, size: 20),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _showPass
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                    color: AppColors.textHint,
                                    size: 20,
                                  ),
                                  onPressed: () =>
                                      setState(() => _showPass = !_showPass),
                                ),
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _handleLogin(),
                              ),

                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () => Navigator.pushNamed(
                                      context, '/forgot-password'),
                                  style: TextButton.styleFrom(
                                      foregroundColor: AppColors.primary),
                                  child: const Text('Lupa Password?',
                                      style:
                                          TextStyle(fontWeight: FontWeight.w600)),
                                ),
                              ),
                              // Inline error banner
                              AnimatedSize(
                                duration: const Duration(milliseconds: 250),
                                curve: Curves.easeInOut,
                                child: _loginError != null
                                    ? Container(
                                        margin: const EdgeInsets.only(
                                            top: 8, bottom: 4),
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 14, vertical: 12),
                                        decoration: BoxDecoration(
                                          color: AppColors.errorLight,
                                          borderRadius:
                                              BorderRadius.circular(12),
                                          border: Border.all(
                                              color: AppColors.error.withValues(alpha: 0.4)),
                                        ),
                                        child: Row(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            const Icon(
                                              Icons.error_outline_rounded,
                                              color: AppColors.error,
                                              size: 18,
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Text(
                                                _loginError!,
                                                style: const TextStyle(
                                                  color: AppColors.error,
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      )
                                    : const SizedBox.shrink(),
                              ),

                              const SizedBox(height: 8),

                              Consumer<AuthProvider>(
                                builder: (_, auth, __) => PrimaryButton(
                                  label: 'Masuk',
                                  isLoading: auth.isLoading,
                                  onPressed: _handleLogin,
                                ),
                              ),

                              const SizedBox(height: 20),
                              const LabelDivider(label: 'atau'),
                              const SizedBox(height: 20),

                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Text('Belum punya akun?',
                                      style: TextStyle(
                                          color: AppColors.textSecondary)),
                                  TextButton(
                                    onPressed: () => Navigator.pushNamed(
                                        context, '/register'),
                                    style: TextButton.styleFrom(
                                        foregroundColor: AppColors.primary),
                                    child: const Text('Daftar Sekarang',
                                        style: TextStyle(
                                            fontWeight: FontWeight.w700)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
