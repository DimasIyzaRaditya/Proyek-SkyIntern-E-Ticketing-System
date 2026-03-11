import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/app_theme.dart';
import '../utils/helpers.dart';
import '../widgets/common_widgets.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen>
    with SingleTickerProviderStateMixin {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _showPass = false;
  bool _showConfirm = false;
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _fadeAnim = CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero)
        .animate(
            CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic));
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim().toLowerCase();
    final password = _passCtrl.text;
    final confirm = _confirmCtrl.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      showSnackBar(context, 'Isi semua field terlebih dahulu', isError: true);
      return;
    }
    if (password != confirm) {
      showSnackBar(context, 'Password tidak cocok', isError: true);
      return;
    }
    if (password.length < 6) {
      showSnackBar(context, 'Password minimal 6 karakter', isError: true);
      return;
    }

    try {
      await context
          .read<AuthProvider>()
          .register(name: name, email: email, password: password);
      if (mounted) {
        showSnackBar(context, 'Registrasi berhasil! Selamat datang.');
        Navigator.of(context).pushReplacementNamed('/dashboard');
      }
    } catch (e) {
      if (mounted) showSnackBar(context, e.toString(), isError: true);
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
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: size.height * 0.28,
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
                    horizontal: isWide ? size.width * 0.2 : 24, vertical: 16),
                child: FadeTransition(
                  opacity: _fadeAnim,
                  child: SlideTransition(
                    position: _slideAnim,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 12),
                        Center(
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: Colors.white.withOpacity(0.4),
                                      width: 2),
                                ),
                                child: const Icon(Icons.flight_rounded,
                                    size: 36, color: Colors.white),
                              ),
                              const SizedBox(height: 8),
                              const Text('SkyIntern',
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  )),
                            ],
                          ),
                        ),
                        const SizedBox(height: 28),

                        GlassCard(
                          padding: const EdgeInsets.all(28),
                          borderRadius: 24,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Text('Buat Akun Baru',
                                  style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary)),
                              const SizedBox(height: 4),
                              const Text('Bergabung dengan SkyIntern sekarang',
                                  style: TextStyle(
                                      fontSize: 13,
                                      color: AppColors.textSecondary)),
                              const SizedBox(height: 24),

                              InputField(
                                label: 'Nama Lengkap',
                                hint: 'John Doe',
                                controller: _nameCtrl,
                                keyboardType: TextInputType.name,
                                prefixIcon: const Icon(Icons.person_outline,
                                    color: AppColors.textHint, size: 20),
                                textInputAction: TextInputAction.next,
                              ),
                              const SizedBox(height: 16),

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
                                textInputAction: TextInputAction.next,
                              ),
                              const SizedBox(height: 16),

                              InputField(
                                label: 'Konfirmasi Password',
                                hint: '••••••••',
                                controller: _confirmCtrl,
                                obscureText: !_showConfirm,
                                prefixIcon: const Icon(Icons.lock_outline,
                                    color: AppColors.textHint, size: 20),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _showConfirm
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                    color: AppColors.textHint,
                                    size: 20,
                                  ),
                                  onPressed: () => setState(
                                      () => _showConfirm = !_showConfirm),
                                ),
                                textInputAction: TextInputAction.done,
                                onFieldSubmitted: (_) => _handleRegister(),
                              ),
                              const SizedBox(height: 24),

                              Consumer<AuthProvider>(
                                builder: (_, auth, __) => PrimaryButton(
                                  label: 'Daftar',
                                  isLoading: auth.isLoading,
                                  onPressed: _handleRegister,
                                ),
                              ),
                              const SizedBox(height: 20),
                              const LabelDivider(label: 'sudah punya akun?'),
                              const SizedBox(height: 12),

                              OutlinedButton(
                                onPressed: () =>
                                    Navigator.pushReplacementNamed(
                                        context, '/login'),
                                style: OutlinedButton.styleFrom(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 14),
                                  side: const BorderSide(
                                      color: AppColors.primary, width: 1.5),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14)),
                                  foregroundColor: AppColors.primary,
                                ),
                                child: const Text('Masuk ke Akun',
                                    style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),
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
