import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800));
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  Animation<double> _fade(double s, double e) => CurvedAnimation(
      parent: _animCtrl, curve: Interval(s, e, curve: Curves.easeOut));

  Animation<Offset> _slide(double s, double e) =>
      Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
          CurvedAnimation(
              parent: _animCtrl,
              curve: Interval(s, e, curve: Curves.easeOutCubic)));

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isWide = MediaQuery.of(context).size.width > 600;

    final menus = [
      {'label': 'Maskapai', 'icon': Icons.flight_rounded, 'gradient': AppColors.primaryGradient, 'route': '/admin/airlines'},
      {'label': 'Bandara', 'icon': Icons.location_city_rounded, 'gradient': const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF0EA5E9)]), 'route': '/admin/airports'},
      {'label': 'Jadwal', 'icon': Icons.schedule_rounded, 'gradient': const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFEF4444)]), 'route': '/admin/schedules'},
      {'label': 'Kursi', 'icon': Icons.event_seat_rounded, 'gradient': const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)]), 'route': '/admin/seats'},
      {'label': 'Transaksi', 'icon': Icons.receipt_long_rounded, 'gradient': const LinearGradient(colors: [Color(0xFFEF4444), Color(0xFFF59E0B)]), 'route': '/admin/transactions'},
      {'label': 'Pengguna', 'icon': Icons.group_rounded, 'gradient': const LinearGradient(colors: [Color(0xFF0D9488), Color(0xFF6366F1)]), 'route': '/admin/users'},
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
            boxShadow: [
              BoxShadow(color: Color(0x220EA5E9), blurRadius: 12, offset: Offset(0, 4))
            ],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: const Icon(Icons.admin_panel_settings_rounded, color: Colors.white),
            title: const Text('Admin Panel',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            actions: [
              IconButton(
                icon: const Icon(Icons.logout_rounded, color: Colors.white),
                tooltip: 'Keluar',
                onPressed: () => _showLogoutDialog(context),
              ),
              const SizedBox(width: 8),
            ],
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(
            horizontal: isWide ? 40 : 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Welcome banner
            FadeTransition(
              opacity: _fade(0.0, 0.5),
              child: SlideTransition(
                position: _slide(0.0, 0.5),
                child: GradientCard(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.admin_panel_settings_rounded,
                            color: Colors.white, size: 32),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Selamat Datang, Admin!',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(user?.fullName ?? 'Administrator',
                                style: TextStyle(
                                    color: Colors.white.withOpacity(0.85),
                                    fontSize: 13)),
                            const SizedBox(height: 4),
                            Text('SkyIntern Admin Dashboard',
                                style: TextStyle(
                                    color: Colors.white.withOpacity(0.7),
                                    fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Management grid
            FadeTransition(
              opacity: _fade(0.2, 0.7),
              child: SlideTransition(
                position: _slide(0.2, 0.7),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionHeader(
                        title: 'Manajemen Data',
                        subtitle: 'Kelola seluruh data sistem'),
                    const SizedBox(height: 14),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: isWide ? 3 : 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.05,
                      ),
                      itemCount: menus.length,
                      itemBuilder: (ctx, i) {
                        final m = menus[i];
                        return TweenAnimationBuilder<double>(
                          duration: Duration(milliseconds: 350 + i * 70),
                          tween: Tween(begin: 0.0, end: 1.0),
                          curve: Curves.easeOutBack,
                          builder: (_, v, child) =>
                              Transform.scale(scale: v, child: child),
                          child: GradientCard(
                            gradient: m['gradient'] as Gradient,
                            padding: const EdgeInsets.all(18),
                            borderRadius: 18,
                            onTap: () => Navigator.pushNamed(
                                ctx, m['route'] as String),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(m['icon'] as IconData,
                                      color: Colors.white, size: 28),
                                ),
                                const SizedBox(height: 12),
                                Text(m['label'] as String,
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold),
                                    textAlign: TextAlign.center),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Quick link to user view
            FadeTransition(
              opacity: _fade(0.5, 1.0),
              child: SlideTransition(
                position: _slide(0.5, 1.0),
                child: GlassCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.search_rounded,
                            color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Cari Penerbangan',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary)),
                            const SizedBox(height: 2),
                            const Text('Lihat jadwal sebagai pengguna',
                                style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded,
                          color: AppColors.textHint),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Keluar',
            style: TextStyle(
                fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        content: const Text('Anda yakin ingin keluar dari akun admin?',
            style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal',
                  style: TextStyle(color: AppColors.textSecondary))),
          ElevatedButton(
            onPressed: () {
              context.read<AuthProvider>().logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12))),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
  }
}
