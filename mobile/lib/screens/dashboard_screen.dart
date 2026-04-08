import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/booking_model.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
import '../services/booking_service.dart';
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
  List<Booking> _bookings = [];
  bool _loadingBookings = false;
  String? _bookingError;
  String _historySearch = '';
  String _historySort = 'newest';
  int _historyPage = 1;
  int _historyPerPage = 10;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _animCtrl.forward();
    _loadBookings();
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
          curve: Interval(start, end, curve: Curves.easeOutCubic),
        ),
      );

  Future<void> _loadBookings() async {
    setState(() {
      _loadingBookings = true;
      _bookingError = null;
    });
    try {
      final data = await BookingService.getMyBookings();
      if (!mounted) return;
      setState(() {
        _bookings = data;
        final totalPages = _historyTotalPages;
        if (_historyPage > totalPages) _historyPage = totalPages;
      });
    } catch (e) {
      if (!mounted) return;
      setState(
        () => _bookingError = e.toString().replaceFirst('Exception: ', ''),
      );
    } finally {
      if (mounted) setState(() => _loadingBookings = false);
    }
  }

  int get _historyTotalPages {
    if (_processedHistory.isEmpty) return 1;
    return (_processedHistory.length / _historyPerPage).ceil();
  }

  DateTime _parseDate(String? raw) =>
      DateTime.tryParse(raw ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);

  String _bookingName(Booking b) {
    if (b.passengers.isNotEmpty) {
      final p = b.passengers.first;
      return '${p.firstName} ${p.lastName}'.trim();
    }
    return b.flight.airline;
  }

  List<Booking> get _processedHistory {
    final q = _historySearch.trim().toLowerCase();
    final data = _bookings.where((b) {
      if (q.isEmpty) return true;
      final id = b.id.toString();
      final code = b.bookingCode.toLowerCase();
      final name = _bookingName(b).toLowerCase();
      final route = '${b.flight.originCode} ${b.flight.destinationCode}'
          .toLowerCase();
      return id.contains(q) ||
          code.contains(q) ||
          name.contains(q) ||
          route.contains(q);
    }).toList();

    data.sort((x, y) {
      switch (_historySort) {
        case 'id':
          return x.id.compareTo(y.id);
        case 'name':
          return _bookingName(
            x,
          ).toLowerCase().compareTo(_bookingName(y).toLowerCase());
        case 'oldest':
          return _parseDate(x.createdAt).compareTo(_parseDate(y.createdAt));
        case 'newest':
        default:
          return _parseDate(y.createdAt).compareTo(_parseDate(x.createdAt));
      }
    });

    return data;
  }

  List<Booking> get _paginatedHistory {
    final data = _processedHistory;
    final start = (_historyPage - 1) * _historyPerPage;
    final end = (start + _historyPerPage).clamp(0, data.length);
    if (start >= data.length) return [];
    return data.sublist(start, end);
  }

  int _countStatus(Set<String> statuses) {
    return _bookings
        .where((b) => statuses.contains(b.status.toUpperCase()))
        .length;
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 600;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(context),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/search'),
        icon: const Icon(Icons.search_rounded),
        label: const Text(
          'Cari Penerbangan',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          isWide ? 32 : 16,
          0,
          isWide ? 32 : 16,
          100,
        ),
        child: FadeTransition(
          opacity: _fade(0.0, 1.0),
          child: SlideTransition(
            position: _slide(0.0, 1.0),
            child: Column(
              children: [
                _buildWelcomeCard(isWide),
                const SizedBox(height: 14),
                _buildBookingSummary(isWide),
                const SizedBox(height: 12),
                _buildBookingHistory(),
              ],
            ),
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
              color: Color(0x222563EB),
              blurRadius: 12,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Row(
            children: const [
              Icon(Icons.flight_rounded, size: 26, color: Colors.white),
              SizedBox(width: 8),
              Text(
                'SkyIntern',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                ),
              ),
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
                    connected
                        ? Icons.wifi_tethering_rounded
                        : Icons.wifi_tethering_error_rounded,
                    color: connected
                        ? Colors.lightGreenAccent
                        : Colors.orangeAccent,
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
                  onPressed: () =>
                      MobileSideMenu.show(context, activeItem: 'Dashboard'),
                  icon: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white30),
                      color: Colors.white10,
                    ),
                    child: const Icon(
                      Icons.menu_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
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
        if (user.avatarUrl != null &&
            user.avatarUrl!.startsWith('data:image')) {
          final base64Data = user.avatarUrl!.split(',').last;
          avatarImage = MemoryImage(base64Decode(base64Data));
        } else if (user.avatarUrl != null && user.avatarUrl!.isNotEmpty) {
          avatarImage = NetworkImage(
            ApiClient.normalizePublicUrl(user.avatarUrl!),
          );
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
                              fontSize: isWide ? 22 : 18,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Profil Akun',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.85),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user.fullName,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: isWide ? 22 : 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          user.email,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFFEAF1FF),
                            fontSize: 12,
                          ),
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

  Widget _buildBookingSummary(bool isWide) {
    final pendingCount = _countStatus({'PENDING'});
    final paidCount = _countStatus({'PAID'});
    final issuedCount = _bookings.where((b) => b.ticket != null).length;
    final cancelledCount = _countStatus({'CANCELLED', 'EXPIRED', 'FAILED'});

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: StatCard(
                icon: Icons.confirmation_num_rounded,
                value: '${_bookings.length}',
                label: 'Total Booking',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: StatCard(
                icon: Icons.pending_actions_rounded,
                value: '$pendingCount',
                label: 'Pending',
                gradient: const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFFB7185)],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: StatCard(
                icon: Icons.payments_rounded,
                value: '$paidCount',
                label: 'Dibayar',
                gradient: const LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF6366F1)],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: StatCard(
                icon: Icons.airplane_ticket_rounded,
                value: '$issuedCount',
                label: 'Issued',
                gradient: const LinearGradient(
                  colors: [Color(0xFF059669), Color(0xFF10B981)],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: StatCard(
                icon: Icons.cancel_rounded,
                value: '$cancelledCount',
                label: 'Batal',
                gradient: const LinearGradient(
                  colors: [Color(0xFFDC2626), Color(0xFFF43F5E)],
                ),
              ),
            ),
          ],
        ),
        if (!isWide) const SizedBox(height: 2),
      ],
    );
  }

  Widget _buildBookingHistory() {
    return GlassCard(
      borderRadius: 20,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Riwayat Pemesanan',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                TextButton.icon(
                  onPressed: _loadingBookings ? null : _loadBookings,
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: const Text('Refresh'),
                ),
              ],
            ),
            if (_loadingBookings)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 18),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_bookingError != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(
                  _bookingError!,
                  style: const TextStyle(color: AppColors.error),
                ),
              )
            else if (_bookings.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: EmptyState(
                  icon: Icons.airplane_ticket_outlined,
                  title: 'Belum ada booking',
                  subtitle: 'Riwayat booking Anda akan tampil di sini.',
                ),
              )
            else ...[
              ListQueryControls(
                searchQuery: _historySearch,
                sortValue: _historySort,
                rowsPerPage: _historyPerPage,
                searchHint:
                    'Cari riwayat booking berdasarkan kode, nama, rute, atau ID...',
                onSearchChanged: (v) => setState(() {
                  _historySearch = v;
                  _historyPage = 1;
                }),
                onSortChanged: (v) => setState(() {
                  _historySort = v;
                  _historyPage = 1;
                }),
                onRowsPerPageChanged: (v) => setState(() {
                  _historyPerPage = v;
                  _historyPage = 1;
                }),
              ),
              const SizedBox(height: 10),
              if (_processedHistory.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: EmptyState(
                    icon: Icons.search_off_rounded,
                    title: 'Data tidak ditemukan',
                    subtitle: 'Coba kata kunci lain untuk pencarian Anda.',
                  ),
                ),
              ..._paginatedHistory.map(
                (b) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(14),
                    onTap: () => Navigator.pushNamed(context, '/bookings'),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.flight_rounded,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  b.bookingCode,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${b.flight.originCode} -> ${b.flight.destinationCode} • ${DateFormatter.formatDate(DateTime.tryParse(b.createdAt) ?? DateTime.now())}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          StatusBadge.fromStatus(b.status),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              ListPaginationBar(
                currentPage: _historyPage,
                totalItems: _processedHistory.length,
                itemsPerPage: _historyPerPage,
                onPageChanged: (next) => setState(() => _historyPage = next),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
