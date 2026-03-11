import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'utils/app_theme.dart';
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
import 'screens/admin_dashboard_screen.dart';
import 'screens/admin_airlines_screen.dart';
import 'screens/admin_airports_screen.dart';
import 'screens/admin_users_screen.dart';

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
            Navigator.pushReplacementNamed(context, '/dashboard');
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
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => FlightProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
      ],
      child: MaterialApp(
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
            if (!authProvider.isInitialized) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
            if (authProvider.isAuthenticated) {
              // Role-based home screen
              final user = authProvider.user;
              if (user?.role == 'admin') {
                return const AdminDashboardScreen();
              }
              return const DashboardScreen();
            }
            return const LoginScreen();
          },
        ),
        routes: {
          '/login': (_) => const LoginScreen(),
          '/register': (_) => const RegisterScreen(),
          '/search': (_) => const SearchScreen(),
          '/search-results': (_) => const SearchResultsScreen(),
          '/dashboard': (_) => const DashboardScreen(),
          '/admin': (_) => const AdminGuard(child: AdminDashboardScreen()),
          '/admin/airlines': (_) => const AdminGuard(child: AdminAirlinesScreen()),
          '/admin/airports': (_) => const AdminGuard(child: AdminAirportsScreen()),
          '/admin/users': (_) => const AdminGuard(child: AdminUsersScreen()),
          '/bookings': (_) => const BookingsScreen(),
          '/edit-profile': (_) => const EditProfileScreen(),
          '/forgot-password': (_) => const ForgotPasswordScreen(),
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
      page = const BookingSeatScreen();
    case '/booking-passenger':
      page = const BookingPassengerScreen();
    case '/booking-payment':
      page = const BookingPaymentScreen();
    case '/e-ticket':
      page = const ETicketScreen();
    case '/admin/schedules':
    case '/admin/seats':
    case '/admin/transactions':
      page = const AdminGuard(child: Placeholder());
    default:
      if (settings.name?.startsWith('/reset-password') == true) {
        final uri = Uri.parse(settings.name ?? '');
        final token = uri.queryParameters['token'];
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

