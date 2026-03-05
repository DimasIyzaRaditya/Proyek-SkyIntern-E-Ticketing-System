import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/common_widgets.dart';
import '../utils/helpers.dart';

class RegisterScreen extends StatefulWidget {
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final nameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  bool showPassword = false;
  bool showConfirmPassword = false;

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> handleRegister() async {
    final name = nameController.text.trim();
    final email = emailController.text.trim().toLowerCase();
    final password = passwordController.text;
    final confirmPassword = confirmPasswordController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      showSnackBar(context, 'Isi semua field terlebih dahulu', isError: true);
      return;
    }

    if (password != confirmPassword) {
      showSnackBar(context, 'Password tidak cocok', isError: true);
      return;
    }

    if (password.length < 6) {
      showSnackBar(context, 'Password minimal 6 karakter', isError: true);
      return;
    }

    try {
      final authProvider = context.read<AuthProvider>();
      await authProvider.register(
        name: name,
        email: email,
        password: password,
      );

      if (mounted) {
        showSnackBar(context, 'Registrasi berhasil! Silakan login.');
        Navigator.of(context).pushReplacementNamed('/login');
      }
    } catch (e) {
      showSnackBar(context, e.toString(), isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              children: [
                SizedBox(height: 40),
                Icon(Icons.flight, size: 60, color: Colors.blue.shade600),
                SizedBox(height: 16),
                Text(
                  'SkyIntern',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue.shade600,
                  ),
                ),
                Text(
                  'E-Ticketing System',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                SizedBox(height: 40),
                Text(
                  'Daftar',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Buat akun SkyIntern Anda',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                SizedBox(height: 32),
                InputField(
                  label: 'Nama Lengkap',
                  hint: 'John Doe',
                  controller: nameController,
                  keyboardType: TextInputType.name,
                ),
                SizedBox(height: 16),
                InputField(
                  label: 'Email',
                  hint: 'nama@gmail.com',
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                ),
                SizedBox(height: 16),
                InputField(
                  label: 'Password',
                  hint: '••••••••',
                  controller: passwordController,
                  obscureText: !showPassword,
                  suffixIcon: IconButton(
                    icon: Icon(
                      showPassword ? Icons.visibility : Icons.visibility_off,
                      color: Colors.grey.shade500,
                    ),
                    onPressed: () {
                      setState(() {
                        showPassword = !showPassword;
                      });
                    },
                  ),
                ),
                SizedBox(height: 16),
                InputField(
                  label: 'Konfirmasi Password',
                  hint: '••••••••',
                  controller: confirmPasswordController,
                  obscureText: !showConfirmPassword,
                  suffixIcon: IconButton(
                    icon: Icon(
                      showConfirmPassword ? Icons.visibility : Icons.visibility_off,
                      color: Colors.grey.shade500,
                    ),
                    onPressed: () {
                      setState(() {
                        showConfirmPassword = !showConfirmPassword;
                      });
                    },
                  ),
                ),
                SizedBox(height: 24),
                Consumer<AuthProvider>(
                  builder: (context, authProvider, _) {
                    return PrimaryButton(
                      label: authProvider.isLoading ? 'Memproses...' : 'Daftar',
                      isLoading: authProvider.isLoading,
                      isDisabled: authProvider.isLoading,
                      onPressed: () async {
                        if (!authProvider.isLoading) {
                          await handleRegister();
                        }
                      },
                    );
                  },
                ),
                SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Sudah punya akun? ', style: TextStyle(color: Colors.grey.shade600)),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pushReplacementNamed('/login');
                      },
                      child: Text('Login'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
