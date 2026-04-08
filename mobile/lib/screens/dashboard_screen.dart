import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
import '../services/websocket_service.dart';
import '../utils/app_theme.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import '../widgets/common_widgets.dart';
import '../widgets/mobile_side_menu.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  Animation<double> _fade(double start, double end) => CurvedAnimation(
        parent: _animCtrl,
        curve: Interval(start, end, curve: Curves.easeOut),
      );

  Animation<Offset> _slide(double start, double end) =>
      Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
        CurvedAnimation(
            parent: _animCtrl,
            curve: Interval(start, end, curve: Curves.easeOutCubic)),
      );

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 600;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(context),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/search'),
        icon: const Icon(Icons.search_rounded),
        label: const Text('Cari Penerbangan',
            style: TextStyle(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(isWide ? 32 : 16, 0, isWide ? 32 : 16, 100),
        child: FadeTransition(
          opacity: _fade(0.0, 1.0),
          child: SlideTransition(
            position: _slide(0.0, 1.0),
            child: _buildWelcomeCard(isWide),
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return PreferredSize(
      preferredSize: const Size.fromHeight(kToolbarHeight),
      child: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.primaryGradient,
          boxShadow: [
            BoxShadow(
                color: Color(0x222563EB), blurRadius: 12, offset: Offset(0, 4))
          ],
        ),
        child: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Row(
            children: const [
              Icon(Icons.flight_rounded, size: 26, color: Colors.white),
              SizedBox(width: 8),
              Text('SkyIntern',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 20)),
            ],
          ),
          actions: [
            AnimatedBuilder(
              animation: WebSocketService.instance,
              builder: (_, __) {
                final connected = WebSocketService.instance.isConnected;
                return Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: Icon(
                    connected ? Icons.wifi_tethering_rounded : Icons.wifi_tethering_error_rounded,
                    color: connected ? Colors.lightGreenAccent : Colors.orangeAccent,
                    size: 20,
                  ),
                );
              },
            ),
            IconButton(
              tooltip: 'SkyIntern Assistant',
              icon: const Icon(Icons.smart_toy_outlined, color: Colors.white),
              onPressed: () => Navigator.pushNamed(context, '/chatbot'),
            ),
            Consumer<AuthProvider>(
              builder: (_, auth, __) {
                return IconButton(
                  tooltip: 'Menu',
                  onPressed: () => MobileSideMenu.show(context, activeItem: 'Dashboard'),
                  icon: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white30),
                      color: Colors.white10,
                    ),
                    child: const Icon(Icons.menu_rounded, color: Colors.white, size: 20),
                  ),
                );
              },
            ),
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeCard(bool isWide) {
    return Consumer<AuthProvider>(
      builder: (_, auth, __) {
        final user = auth.user;
        if (user == null) return const SizedBox();

        ImageProvider? avatarImage;
        if (user.avatarUrl != null && user.avatarUrl!.startsWith('data:image')) {
          final base64Data = user.avatarUrl!.split(',').last;
          avatarImage = MemoryImage(base64Decode(base64Data));
        } else if (user.avatarUrl != null && user.avatarUrl!.isNotEmpty) {
          avatarImage = NetworkImage(ApiClient.normalizePublicUrl(user.avatarUrl!));
        }

        return GradientCard(
          padding: const EdgeInsets.all(20),
          margin: const EdgeInsets.only(top: 16),
          borderRadius: 24,
          child: Column(
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: isWide ? 36 : 30,
                    backgroundColor: Colors.white.withValues(alpha: 0.25),
                    backgroundImage: avatarImage,
                    child: avatarImage == null
                        ? Text(
                            StringHelper.getInitials(user.fullName),
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: isWide ? 22 : 18),
                          )
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Profil Akun',
                            style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.85),
                                fontSize: 13,
                                fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text(user.fullName,
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: isWide ? 22 : 18,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text(
                          user.email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              color: Color(0xFFEAF1FF), fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _profilePill(
                      icon: Icons.calendar_today_rounded,
                      value: DateFormatter.formatDate(DateTime.now()),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _profilePill(
                      icon: Icons.person_outline_rounded,
                      value: user.role.toUpperCase(),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _profilePill({required IconData icon, required String value}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

}
