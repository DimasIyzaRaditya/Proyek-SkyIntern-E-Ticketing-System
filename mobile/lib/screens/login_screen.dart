import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/common_widgets.dart';
import '../utils/helpers.dart';

class LoginScreen extends StatefulWidget {
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  bool showPassword = false;

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> handleLogin() async {
    final email = emailController.text.trim().toLowerCase();
    final password = passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      showSnackBar(context, 'Isi email dan password terlebih dahulu', isError: true);
      return;
    }

    try {
      final authProvider = context.read<AuthProvider>();
      await authProvider.login(email: email, password: password);

      if (mounted) {
        showSnackBar(context, 'Login berhasil!');
        Navigator.of(context).pushReplacementNamed('/dashboard');
      }
    } catch (e) {
      showSnackBar(
        context,
        e.toString(),
        isError: true,
      );
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
                  'Login',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Masuk ke akun SkyIntern Anda',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade600,
                  ),
                ),
                SizedBox(height: 32),
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
                SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.of(context).pushNamed('/forgot-password');
                    },
                    child: Text('Lupa Password?'),
                  ),
                ),
                SizedBox(height: 24),
                Consumer<AuthProvider>(
                  builder: (context, authProvider, _) {
                    return PrimaryButton(
                      label: authProvider.isLoading ? 'Memproses...' : 'Login',
                      isLoading: authProvider.isLoading,
                      isDisabled: authProvider.isLoading,
                      onPressed: () async {
                        if (!authProvider.isLoading) {
                          await handleLogin();
                        }
                      },
                    );
                  },
                ),
                SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Belum punya akun? ', style: TextStyle(color: Colors.grey.shade600)),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pushNamed('/register');
                      },
                      child: Text('Buat Akun'),
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
