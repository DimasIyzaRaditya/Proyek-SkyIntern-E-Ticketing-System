import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/flight_provider.dart';
import 'providers/booking_provider.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/search_screen.dart';
import 'screens/search_results_screen.dart';
import 'screens/dashboard_screen.dart';
import 'widgets/common_widgets.dart';

void main() {
  runApp(const MyApp());
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
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
          useMaterial3: true,
          appBarTheme: AppBarTheme(
            elevation: 2,
            centerTitle: false,
          ),
        ),
        home: Consumer<AuthProvider>(
          builder: (context, authProvider, _) {
            if (authProvider.isAuthenticated) {
              return DashboardScreen();
            }
            return LoginScreen();
          },
        ),
        routes: {
          '/login': (_) => LoginScreen(),
          '/register': (_) => RegisterScreen(),
          '/search': (_) => SearchScreen(),
          '/search-results': (_) => SearchResultsScreen(),
          '/dashboard': (_) => DashboardScreen(),
        },
        onGenerateRoute: (settings) {
          // Flight detail screen
          if (settings.name == '/flight-detail') {
            final flightId = settings.arguments as String?;
            return MaterialPageRoute(
              builder: (context) => Scaffold(
                appBar: CustomAppBar(
                  title: 'Detail Penerbangan',
                  showBackButton: true,
                  onBackPressed: () => Navigator.pop(context),
                ),
                body: Center(
                  child: Text('Flight Detail: $flightId'),
                ),
              ),
            );
          }
          // Edit profile screen
          if (settings.name == '/edit-profile') {
            return MaterialPageRoute(
              builder: (context) => Scaffold(
                appBar: CustomAppBar(
                  title: 'Edit Profil',
                  showBackButton: true,
                  onBackPressed: () => Navigator.pop(context),
                ),
                body: Center(
                  child: Text('Edit Profile Screen'),
                ),
              ),
            );
          }
          // Forgot password screen
          if (settings.name == '/forgot-password') {
            return MaterialPageRoute(
              builder: (context) => Scaffold(
                appBar: CustomAppBar(
                  title: 'Lupa Password',
                  showBackButton: true,
                  onBackPressed: () => Navigator.pop(context),
                ),
                body: Center(
                  child: Text('Forgot Password Screen'),
                ),
              ),
            );
          }
          return null;
        },
      ),
    );
  }
}

