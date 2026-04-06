import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../services/api_client.dart';
import '../services/promo_service.dart';
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
  List<PromoItem> _promos = const [];
  bool _promoLoading = false;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _animCtrl.forward();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      setState(() => _promoLoading = true);
      await Future.wait([
        context.read<BookingProvider>().loadBookings(),
        _loadPromos(),
      ]);
    } catch (_) {
      if (mounted) showSnackBar(context, 'Gagal memuat data', isError: true);
    } finally {
      if (mounted) {
        setState(() => _promoLoading = false);
      }
    }
  }

  Future<void> _loadPromos() async {
    final promos = await PromoService.getActivePromos();
    if (!mounted) return;
    setState(() {
      _promos = promos.take(5).toList();
    });
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
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(isWide ? 32 : 16, 0, isWide ? 32 : 16, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome card
              FadeTransition(
                opacity: _fade(0.0, 0.5),
                child: SlideTransition(
                    position: _slide(0.0, 0.5),
                    child: _buildWelcomeCard(isWide)),
              ),
              const SizedBox(height: 20),

              // Quick actions
              FadeTransition(
                opacity: _fade(0.15, 0.6),
                child: SlideTransition(
                    position: _slide(0.15, 0.6),
                    child: _buildQuickActions(context, isWide)),
              ),
              const SizedBox(height: 20),

              // Stats
              FadeTransition(
                opacity: _fade(0.3, 0.75),
                child: SlideTransition(
                    position: _slide(0.3, 0.75),
                    child: _buildStats(isWide)),
              ),
              const SizedBox(height: 20),

              // Promo section (parity with web dashboard)
              FadeTransition(
                opacity: _fade(0.37, 0.82),
                child: SlideTransition(
                  position: _slide(0.37, 0.82),
                  child: _buildPromoSection(isWide),
                ),
              ),
              const SizedBox(height: 20),

              // Recent bookings
              FadeTransition(
                opacity: _fade(0.45, 1.0),
                child: SlideTransition(
                    position: _slide(0.45, 1.0),
                    child: _buildRecentBookings(context, isWide)),
              ),
            ],
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
          child: Row(
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
                    Text('Halo, selamat datang!',
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(user.fullName,
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: isWide ? 22 : 18,
                            fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        DateFormatter.formatDate(DateTime.now()),
                        style: const TextStyle(
                            color: Colors.white, fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickActions(BuildContext context, bool isWide) {
    final actions = [
      {
        'label': 'Cari Penerbangan',
        'icon': Icons.flight_takeoff_rounded,
        'gradient': AppColors.primaryGradient,
        'route': '/search',
      },
      {
        'label': 'Booking Saya',
        'icon': Icons.confirmation_number_outlined,
        'gradient': AppColors.cardGradient,
        'route': '/bookings',
      },
      {
        'label': 'Edit Profil',
        'icon': Icons.person_outline_rounded,
        'gradient': AppColors.warmGradient,
        'route': '/edit-profile',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
            title: 'Aksi Cepat', subtitle: 'Apa yang ingin kamu lakukan?'),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: isWide ? 3 : 3,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.0,
          ),
          itemCount: actions.length,
          itemBuilder: (ctx, i) {
            final a = actions[i];
            return TweenAnimationBuilder<double>(
              duration: Duration(milliseconds: 400 + i * 100),
              tween: Tween(begin: 0.0, end: 1.0),
              curve: Curves.easeOutBack,
              builder: (_, v, child) =>
                  Transform.scale(scale: v, child: child),
              child: GradientCard(
                gradient: a['gradient'] as Gradient,
                padding: const EdgeInsets.all(16),
                borderRadius: 18,
                onTap: () => Navigator.pushNamed(ctx, a['route'] as String),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(a['icon'] as IconData,
                        color: Colors.white, size: 28),
                    const SizedBox(height: 8),
                    Text(a['label'] as String,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600),
                        textAlign: TextAlign.center,
                        maxLines: 2),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildStats(bool isWide) {
    return Consumer<BookingProvider>(
      builder: (_, bp, __) {
        final all = bp.bookings.length;
        final active = bp.bookings
            .where((b) => ['PENDING', 'PAID'].contains(b.status.toUpperCase()))
            .length;
        final done = bp.bookings
            .where((b) => b.ticket != null)
            .length;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(
                title: 'Statistik Kamu',
                subtitle: 'Ringkasan perjalananmu'),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                    child: StatCard(
                        label: 'Total',
                        value: '$all',
                        icon: Icons.airplane_ticket_outlined,
                        gradient: AppColors.primaryGradient)),
                const SizedBox(width: 10),
                Expanded(
                    child: StatCard(
                        label: 'Aktif',
                        value: '$active',
                        icon: Icons.schedule_rounded,
                        gradient: AppColors.cardGradient)),
                const SizedBox(width: 10),
                Expanded(
                    child: StatCard(
                        label: 'Selesai',
                        value: '$done',
                        icon: Icons.check_circle_outline_rounded,
                        gradient: AppColors.warmGradient)),
              ],
            ),
          ],
        );
      },
    );
  }

  Widget _buildPromoSection(bool isWide) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          title: 'Promo Aktif',
          subtitle: 'Promo tampil seperti iklan untuk user',
        ),
        const SizedBox(height: 12),
        if (_promoLoading)
          ...List.generate(
            2,
            (_) => const Padding(
              padding: EdgeInsets.only(bottom: 10),
              child: ShimmerBox(width: double.infinity, height: 84, borderRadius: 14),
            ),
          ),
        if (!_promoLoading && _promos.isEmpty)
          const GlassCard(
            padding: EdgeInsets.all(14),
            child: Row(
              children: [
                Icon(Icons.local_offer_outlined, color: AppColors.textSecondary),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Belum ada promo aktif saat ini.',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              ],
            ),
          ),
        if (!_promoLoading && _promos.isNotEmpty)
          SizedBox(
            height: isWide ? 170 : 160,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _promos.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) {
                final promo = _promos[i];
                final until = promo.endDate != null
                    ? DateFormatter.formatDate(promo.endDate!)
                    : null;

                return SizedBox(
                  width: isWide ? 360 : 300,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        if (promo.isFlightPromo &&
                            promo.flightId != null &&
                            promo.flightId!.isNotEmpty) {
                          Navigator.pushNamed(
                            context,
                            '/flight-detail',
                            arguments: {
                              'flightId': promo.flightId,
                              'origin': promo.origin ?? '',
                              'destination': promo.destination ?? '',
                              'adults': 1,
                              'children': 0,
                            },
                          );
                          return;
                        }

                        Navigator.pushNamed(context, '/search');
                      },
                      child: Ink(
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x1F1F3A5F),
                              blurRadius: 12,
                              offset: Offset(0, 4),
                            )
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      'HEMAT ${promo.discount}%',
                                      style: const TextStyle(
                                        color: AppColors.primaryDark,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  Icon(
                                    promo.isFlightPromo
                                        ? Icons.flight_takeoff_rounded
                                        : Icons.public_rounded,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                promo.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                ),
                              ),
                              if ((promo.description ?? '').trim().isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  promo.description!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Color(0xFFEAF1FF),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                              const Spacer(),
                              Text(
                                promo.sourceLabel ?? 'Promo SkyIntern',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 11,
                                ),
                              ),
                              if (until != null)
                                Text(
                                  'Berlaku sampai $until',
                                  style: const TextStyle(
                                    color: Color(0xFFDCE7FF),
                                    fontSize: 11,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildRecentBookings(BuildContext context, bool isWide) {
    return Consumer<BookingProvider>(
      builder: (_, bp, __) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: 'Booking Terbaru',
              action: TextButton(
                onPressed: () => Navigator.pushNamed(context, '/bookings'),
                child: const Text('Lihat Semua',
                    style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 12),
            if (bp.isLoading)
              ...List.generate(
                  2,
                  (i) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ShimmerBox(
                            width: double.infinity,
                            height: 80,
                            borderRadius: 16),
                      )),
            if (!bp.isLoading && bp.bookings.isEmpty)
              EmptyState(
                title: 'Belum ada booking',
                subtitle: 'Mulai perjalananmu dengan memesan tiket pertama!',
                icon: Icons.flight_takeoff_outlined,
                action: PrimaryButton(
                  label: 'Cari Penerbangan',
                  icon: Icons.search_rounded,
                  onPressed: () => Navigator.pushNamed(context, '/search'),
                  width: 200,
                ),
              ),
            if (!bp.isLoading && bp.bookings.isNotEmpty)
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: bp.bookings.take(3).length,
                itemBuilder: (ctx, i) {
                  final b = bp.bookings[i];
                  return TweenAnimationBuilder<double>(
                    duration: Duration(milliseconds: 350 + i * 80),
                    tween: Tween(begin: 0.0, end: 1.0),
                    curve: Curves.easeOut,
                    builder: (_, v, child) =>
                        Opacity(opacity: v, child: child),
                    child: GlassCard(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.flight_rounded,
                                color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(b.bookingCode,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        color: AppColors.textPrimary)),
                                const SizedBox(height: 4),
                                Text(
                                    '${b.flight.originCode} → ${b.flight.destinationCode}',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary)),
                              ],
                            ),
                          ),
                          StatusBadge.fromStatus(b.status),
                        ],
                      ),
                    ),
                  );
                },
              ),
          ],
        );
      },
    );
  }

}
