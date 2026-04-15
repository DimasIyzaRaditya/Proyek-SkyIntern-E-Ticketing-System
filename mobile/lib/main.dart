import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:app_links/app_links.dart';
import 'dart:async';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'utils/app_theme.dart';
import 'utils/helpers.dart';
import 'providers/auth_provider.dart';
import 'providers/flight_provider.dart';
import 'providers/booking_provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/search_screen.dart';
import 'screens/search_results_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/flight_detail_screen.dart';
import 'screens/booking_seat_screen.dart';
import 'screens/booking_passenger_screen.dart';
import 'screens/booking_payment_screen.dart';
import 'screens/bookings_screen.dart';
import 'screens/eticket_screen.dart';
import 'screens/edit_profile_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/reset_password_screen.dart';
import 'screens/booking_verify_screen.dart';
import 'screens/login_2fa_screen.dart';
import 'screens/chatbot_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'screens/admin_airlines_screen.dart';
import 'screens/admin_airports_screen.dart';
import 'screens/admin_users_screen.dart';
import 'screens/admin_schedules_screen.dart';
import 'screens/admin_seats_screen.dart';
import 'screens/admin_transactions_screen.dart';
import 'screens/admin_promos_screen.dart';
import 'screens/admin_scan_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID', null);
  runApp(const MyApp());
}

/// Guard widget: hanya user dengan role 'admin' yang bisa mengakses halaman admin.
/// Jika belum login → redirect ke /login.
/// Jika sudah login tapi bukan admin → redirect ke /dashboard.
class AdminGuard extends StatelessWidget {
  final Widget child;
  const AdminGuard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (!auth.isInitialized) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (!auth.isAuthenticated) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacementNamed(context, '/login');
          });
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (auth.user?.role != 'admin') {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Akses ditolak. Halaman ini hanya untuk admin.'),
                backgroundColor: Colors.red,
              ),
            );
            Navigator.pushReplacementNamed(context, '/search');
          });
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        return child;
      },
    );
  }
}

class AuthGuard extends StatelessWidget {
  final Widget child;
  const AuthGuard({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (!auth.isInitialized) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (!auth.isAuthenticated) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacementNamed(context, '/login');
          });
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        return child;
      },
    );
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const _AppShell();
  }
}

class _AppShell extends StatefulWidget {
  const _AppShell();

  @override
  State<_AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<_AppShell> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  AppLinks? _appLinks;
  StreamSubscription<Uri>? _deepLinkSub;
  bool _didHandleInitialLink = false;
  bool _enableSplashSound = true;

  @override
  void initState() {
    super.initState();
    _initDeepLinks();
    _initPreferences();
  }

  Future<void> _initPreferences() async {
    final enabled = await LocalStorage.isSplashSoundEnabled();
    if (!mounted) return;
    setState(() => _enableSplashSound = enabled);
  }

  Future<void> _initDeepLinks() async {
    if (kIsWeb) return;

    try {
      _appLinks = AppLinks();

      if (!_didHandleInitialLink) {
        final initialUri = await _appLinks!.getInitialLink();
        if (initialUri != null) {
          _handleDeepLink(initialUri);
        }
        _didHandleInitialLink = true;
      }

      _deepLinkSub = _appLinks!.uriLinkStream.listen(_handleDeepLink);
    } catch (_) {
      // Ignore deep link setup errors so app can continue normally.
    }
  }

  @override
  void dispose() {
    _deepLinkSub?.cancel();
    super.dispose();
  }

  void _handleDeepLink(Uri uri) {
    final code = (uri.queryParameters['code'] ?? '').trim();
    final token = (uri.queryParameters['token'] ?? '').trim();

    final host = uri.host.toLowerCase();
    final path = uri.path.toLowerCase();
    final fullPath = '/$host$path';

    final isETicketLink = fullPath.contains('/bookings/e-ticket');
    final isVerifyLink = fullPath.contains('/bookings/verify');
    final isResetPasswordLink =
        fullPath.contains('/auth/reset-password') ||
        path.contains('/reset-password');

    final navigator = _navigatorKey.currentState;
    if (navigator == null) return;

    if (isResetPasswordLink) {
      if (token.isEmpty) return;
      navigator.pushNamed('/reset-password', arguments: {'token': token});
      return;
    }

    if (code.isEmpty) return;
    final normalizedCode = code.toUpperCase();

    if (isETicketLink) {
      navigator.pushNamed('/e-ticket', arguments: {'code': normalizedCode});
      return;
    }

    if (isVerifyLink) {
      navigator.pushNamed('/booking-verify', arguments: {'code': normalizedCode});
      return;
    }

    navigator.pushNamed('/booking-verify', arguments: {'code': normalizedCode});
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => FlightProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
      ],
      child: MaterialApp(
        navigatorKey: _navigatorKey,
        title: 'SkyIntern - E-Ticketing System',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.theme,
        home: Consumer<AuthProvider>(
          builder: (context, authProvider, _) {
            // On web, check if initial URL is a reset-password link
            if (kIsWeb) {
              final uri = Uri.base;
              if (uri.path.contains('reset-password') &&
                  uri.queryParameters.containsKey('token')) {
                return const ResetPasswordScreen();
              }
            }
            return SplashGate(
              role: authProvider.user?.role,
              isAppReady: authProvider.isInitialized,
              enableIntroSound: _enableSplashSound,
              child: authProvider.isInitialized
                  ? const SearchScreen()
                  : const Scaffold(
                      body: Center(child: CircularProgressIndicator()),
                    ),
            );
          },
        ),
        routes: {
          '/login': (_) => const LoginScreen(),
          '/register': (_) => const RegisterScreen(),
          '/search': (_) => const SearchScreen(),
          '/search-results': (_) => const SearchResultsScreen(),
          '/dashboard': (_) => const AuthGuard(child: DashboardScreen()),
          '/admin': (_) => const AdminGuard(child: AdminDashboardScreen()),
          '/admin/airlines': (_) =>
              const AdminGuard(child: AdminAirlinesScreen()),
          '/admin/airports': (_) =>
              const AdminGuard(child: AdminAirportsScreen()),
          '/admin/users': (_) => const AdminGuard(child: AdminUsersScreen()),
          '/bookings': (_) => const AuthGuard(child: BookingsScreen()),
          '/edit-profile': (_) => const AuthGuard(child: EditProfileScreen()),
          '/forgot-password': (_) => const ForgotPasswordScreen(),
          '/chatbot': (_) => const ChatBotScreen(),
        },
        // Global smooth page transition
        onGenerateRoute: (settings) => _buildRoute(settings),
      ),
    );
  }
}

Route<dynamic>? _buildRoute(RouteSettings settings) {
  Widget? page;

  switch (settings.name) {
    case '/flight-detail':
      page = const FlightDetailScreen();
    case '/booking-seat':
      page = const AuthGuard(child: BookingSeatScreen());
    case '/booking-passenger':
      page = const AuthGuard(child: BookingPassengerScreen());
    case '/booking-payment':
      page = const AuthGuard(child: BookingPaymentScreen());
    case '/e-ticket':
      page = const AuthGuard(child: ETicketScreen());
    case '/booking-verify':
      page = const AuthGuard(child: BookingVerifyScreen());
    case '/reset-password':
      page = const ResetPasswordScreen();
    case '/login-2fa':
      final rawArg = settings.arguments;
      final args = rawArg is Map
          ? Map<String, dynamic>.from(rawArg)
          : <String, dynamic>{};
      page = LoginTwoFactorScreen(
        twoFactorToken: (args['twoFactorToken'] ?? '').toString(),
        email: (args['email'] ?? '').toString(),
      );
    case '/admin/schedules':
      page = const AdminGuard(child: AdminSchedulesScreen());
    case '/admin/seats':
      final rawArg = settings.arguments;
      final flightArg = rawArg is Map
          ? Map<String, dynamic>.from(rawArg)
          : null;
      page = AdminGuard(child: AdminSeatsScreen(flight: flightArg));
    case '/admin/transactions':
      page = const AdminGuard(child: AdminTransactionsScreen());
    case '/admin/promos':
      page = const AdminGuard(child: AdminPromosScreen());
    case '/admin/scan':
      page = const AdminGuard(child: AdminScanScreen());
    default:
      if (settings.name?.startsWith('/reset-password') == true) {
        final uri = Uri.parse(settings.name ?? '');
        final existingArgs = settings.arguments is Map
            ? Map<String, dynamic>.from(settings.arguments as Map)
            : <String, dynamic>{};
        final token = existingArgs['token']?.toString() ?? uri.queryParameters['token'];
        return _slideRoute(
          const ResetPasswordScreen(),
          RouteSettings(name: settings.name, arguments: {'token': token}),
        );
      }
      return null;
  }

  return _slideRoute(page, settings);
}

PageRouteBuilder<dynamic> _slideRoute(Widget page, RouteSettings settings) {
  return PageRouteBuilder(
    settings: settings,
    pageBuilder: (_, __, ___) => page,
    transitionDuration: const Duration(milliseconds: 320),
    reverseTransitionDuration: const Duration(milliseconds: 260),
    transitionsBuilder: (_, animation, __, child) {
      final slide = Tween<Offset>(
        begin: const Offset(0.06, 0),
        end: Offset.zero,
      ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));
      final fade = CurvedAnimation(parent: animation, curve: Curves.easeOut);
      return FadeTransition(
        opacity: fade,
        child: SlideTransition(position: slide, child: child),
      );
    },
  );
}
