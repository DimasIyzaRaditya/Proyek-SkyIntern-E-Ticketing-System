import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/booking_model.dart';
import '../utils/app_theme.dart';
import '../utils/ticket_download.dart';
import '../widgets/common_widgets.dart';
import '../services/admin_service.dart';
import '../services/booking_service.dart';

class AdminTransactionsScreen extends StatefulWidget {
  const AdminTransactionsScreen({super.key});

  @override
  State<AdminTransactionsScreen> createState() =>
      _AdminTransactionsScreenState();
}

class _AdminTransactionsScreenState extends State<AdminTransactionsScreen> {
  List<Map<String, dynamic>> _bookings = [];
  bool _isLoading = true;
  String? _error;
  String _selectedStatus = 'ALL';
  String _searchQuery = '';
  String _sortBy = 'newest';
  int _page = 1;
  int _perPage = 10;

  static const _statusFilters = [
    {'label': 'Semua', 'value': 'ALL'},
    {'label': 'Pending', 'value': 'PENDING'},
    {'label': 'Dibayar', 'value': 'PAID'},
    {'label': 'Dibatalkan', 'value': 'CANCELLED'},
  ];

  DateTime _parseDate(String? raw) =>
      DateTime.tryParse(raw ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);

  List<Map<String, dynamic>> get _processedBookings {
    final q = _searchQuery.trim().toLowerCase();
    var data = _bookings.where((b) {
      if (q.isEmpty) return true;
      final id = (b['id'] ?? '').toString().toLowerCase();
      final code = (b['bookingCode'] ?? '').toString().toLowerCase();
      final userName = ((b['user'] as Map?)?['name'] ?? '')
          .toString()
          .toLowerCase();
      final userEmail = ((b['user'] as Map?)?['email'] ?? '')
          .toString()
          .toLowerCase();
      return id.contains(q) ||
          code.contains(q) ||
          userName.contains(q) ||
          userEmail.contains(q);
    }).toList();

    data.sort((x, y) {
      switch (_sortBy) {
        case 'id':
          return ((x['id'] as num?)?.toInt() ?? 0).compareTo(
            (y['id'] as num?)?.toInt() ?? 0,
          );
        case 'name':
          final xn = ((x['user'] as Map?)?['name'] ?? x['bookingCode'] ?? '')
              .toString()
              .toLowerCase();
          final yn = ((y['user'] as Map?)?['name'] ?? y['bookingCode'] ?? '')
              .toString()
              .toLowerCase();
          return xn.compareTo(yn);
        case 'oldest':
          return _parseDate(
            x['createdAt']?.toString(),
          ).compareTo(_parseDate(y['createdAt']?.toString()));
        case 'newest':
        default:
          return _parseDate(
            y['createdAt']?.toString(),
          ).compareTo(_parseDate(x['createdAt']?.toString()));
      }
    });

    return data;
  }

  int get _totalPages => _processedBookings.isEmpty
      ? 1
      : (_processedBookings.length / _perPage).ceil();

  List<Map<String, dynamic>> get _pagedBookings {
    final data = _processedBookings;
    final start = (_page - 1) * _perPage;
    final end = (start + _perPage).clamp(0, data.length);
    if (start >= data.length) return [];
    return data.sublist(start, end);
  }

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final status = _selectedStatus == 'ALL' ? null : _selectedStatus;
      final bookings = await AdminService.getBookings(status: status);
      if (mounted) {
        setState(() {
          _bookings = bookings;
          if (_page > _totalPages) _page = _totalPages;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted)
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
    }
  }

  /// Hitung display status berdasarkan status booking + keberadaan tiket
  String _displayStatus(Map<String, dynamic> booking) {
    final status = booking['status'] as String?;
    if (status == 'CANCELLED' || status == 'EXPIRED') return 'CANCELLED';
    if (booking['ticket'] != null) return 'ISSUED';
    if (status == 'PAID') return 'PAID';
    return 'PENDING';
  }

  Color _statusColor(String? displayStatus) {
    switch (displayStatus) {
      case 'PAID':
        return AppColors.primary;
      case 'ISSUED':
        return AppColors.success;
      case 'CANCELLED':
        return AppColors.error;
      case 'PENDING':
      default:
        return const Color(0xFFF59E0B);
    }
  }

  String _statusLabel(String? displayStatus) {
    switch (displayStatus) {
      case 'PAID':
        return 'Dibayar';
      case 'ISSUED':
        return 'Issued';
      case 'CANCELLED':
        return 'Dibatalkan';
      case 'PENDING':
      default:
        return 'Pending';
    }
  }

  String _formatDateTime(String? dt) {
    if (dt == null) return '-';
    try {
      final d = DateTime.parse(dt).toLocal();
      return DateFormat('dd MMM yyyy HH:mm', 'id_ID').format(d);
    } catch (_) {
      return dt;
    }
  }

  String _formatPrice(num? price) {
    if (price == null) return '-';
    return 'Rp ${price.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}';
  }

  List<_ActionDef> _actionsFor(Map<String, dynamic> booking) {
    switch (_displayStatus(booking)) {
      case 'PENDING':
        return [
          _ActionDef(
            'markpaid',
            'Tandai Dibayar',
            Icons.check_circle_rounded,
            AppColors.primary,
          ),
          _ActionDef(
            'markissued',
            'Issue Tiket',
            Icons.airplane_ticket_rounded,
            AppColors.success,
          ),
          _ActionDef(
            'cancel',
            'Batalkan',
            Icons.cancel_rounded,
            AppColors.error,
          ),
        ];
      case 'PAID':
        return [
          _ActionDef(
            'markissued',
            'Issue Tiket',
            Icons.airplane_ticket_rounded,
            AppColors.success,
          ),
          _ActionDef(
            'markpending',
            'Reset ke Pending',
            Icons.undo_rounded,
            const Color(0xFFF59E0B),
          ),
          _ActionDef(
            'cancel',
            'Batalkan',
            Icons.cancel_rounded,
            AppColors.error,
          ),
        ];
      case 'ISSUED':
        return [
          _ActionDef(
            'markpaid',
            'Set ke Dibayar',
            Icons.payments_rounded,
            AppColors.primary,
          ),
          _ActionDef(
            'markpending',
            'Reset ke Pending',
            Icons.undo_rounded,
            const Color(0xFFF59E0B),
          ),
          _ActionDef(
            'cancel',
            'Batalkan',
            Icons.cancel_rounded,
            AppColors.error,
          ),
        ];
      case 'CANCELLED':
        return [
          _ActionDef(
            'markpending',
            'Aktifkan (Pending)',
            Icons.restore_rounded,
            const Color(0xFFF59E0B),
          ),
          _ActionDef(
            'markpaid',
            'Set ke Dibayar',
            Icons.payments_rounded,
            AppColors.primary,
          ),
          _ActionDef(
            'markissued',
            'Issue Tiket',
            Icons.airplane_ticket_rounded,
            AppColors.success,
          ),
        ];
      default:
        return [];
    }
  }

  Future<void> _doAction(String bookingId, String action) async {
    try {
      await AdminService.updateBookingStatus(
        bookingId: int.tryParse(bookingId) ?? 0,
        action: action,
      );
      _loadBookings();
      if (mounted) {
        final messages = {
          'issue': 'Tiket berhasil diterbitkan',
          'cancel': 'Booking berhasil dibatalkan',
          'markpaid': 'Pembayaran berhasil dikonfirmasi',
          'markpending': 'Booking direset ke pending',
          'markissued': 'Booking ditandai issued',
        };
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(messages[action] ?? 'Berhasil'),
            backgroundColor: action == 'cancel'
                ? AppColors.error
                : AppColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Booking _toBookingModel(Map<String, dynamic> booking) {
    final safe = Map<String, dynamic>.from(booking);

    final userFlight = Map<String, dynamic>.from(
      (safe['flight'] as Map?) ?? {},
    );
    final passengers =
        (safe['passengers'] as List?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList() ??
        <Map<String, dynamic>>[];

    final normalizedPassengers = passengers
        .map(
          (p) => {
            'firstName': (p['firstName'] ?? '').toString(),
            'lastName': (p['lastName'] ?? '').toString(),
            'type': (p['type'] ?? 'ADULT').toString(),
          },
        )
        .toList();

    return Booking.fromJson({
      'id': (safe['id'] as num?)?.toInt() ?? 0,
      'flightId': (safe['flightId'] as num?)?.toInt() ?? 0,
      'bookingCode': (safe['bookingCode'] ?? '').toString(),
      'status': (safe['status'] ?? 'PENDING').toString(),
      'createdAt': (safe['createdAt'] ?? '').toString(),
      'flight': userFlight,
      'passengers': normalizedPassengers,
      'ticket': safe['ticket'],
    });
  }

  void _openETicket(Map<String, dynamic> booking) {
    final model = _toBookingModel(booking);
    Navigator.of(context).pushNamed('/e-ticket', arguments: {'booking': model});
  }

  Future<void> _downloadTicket(Map<String, dynamic> booking) async {
    final ticket = booking['ticket'] as Map<String, dynamic>?;
    final ticketId = (ticket?['id'] as num?)?.toInt();
    if (ticketId == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Data tiket tidak ditemukan')),
      );
      return;
    }

    try {
      final model = _toBookingModel(booking);
      final downloaded = await BookingService.downloadTicket(ticketId);
      final saved = await saveTicketFile(
        booking: model,
        downloaded: downloaded,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            saved.opened
                ? 'E-tiket berhasil diunduh dan dibuka.'
                : 'E-tiket berhasil diunduh ke ${saved.filePath}',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    }
  }

  void _showDetailDialog(Map<String, dynamic> booking) {
    final user = booking['user'] as Map<String, dynamic>?;
    final flight = booking['flight'] as Map<String, dynamic>?;
    final origin = flight?['origin'] as Map<String, dynamic>?;
    final dest = flight?['destination'] as Map<String, dynamic>?;
    final passengers =
        (booking['passengers'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final displaySt = _displayStatus(booking);
    final actions = _actionsFor(booking);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF6366F1)],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.receipt_long_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: Text(
                booking['bookingCode'] ?? '',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Status
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _statusColor(displaySt).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: _statusColor(displaySt),
                        width: 1.5,
                      ),
                    ),
                    child: Text(
                      _statusLabel(displaySt),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: _statusColor(displaySt),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                _detailRow(
                  Icons.person_rounded,
                  'Pemesan',
                  user?['name'] ?? user?['email'] ?? '-',
                ),
                _detailRow(Icons.email_rounded, 'Email', user?['email'] ?? '-'),
                const Divider(height: 20),
                _detailRow(
                  Icons.flight_takeoff_rounded,
                  'Rute',
                  '${origin?['code'] ?? '-'} → ${dest?['code'] ?? '-'}',
                ),
                _detailRow(
                  Icons.schedule_rounded,
                  'Keberangkatan',
                  _formatDateTime(flight?['departureTime']?.toString()),
                ),
                _detailRow(
                  Icons.schedule_rounded,
                  'Kedatangan',
                  _formatDateTime(flight?['arrivalTime']?.toString()),
                ),
                const Divider(height: 20),
                _detailRow(
                  Icons.attach_money_rounded,
                  'Total',
                  _formatPrice(booking['totalPrice'] as num?),
                ),
                _detailRow(
                  Icons.payment_rounded,
                  'Metode',
                  booking['paymentMethod'] ?? '-',
                ),
                if (passengers.isNotEmpty) ...[
                  const Divider(height: 20),
                  const Text(
                    'Penumpang:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  ...passengers.map(
                    (p) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.person_outline_rounded,
                            size: 14,
                            color: AppColors.textHint,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              '${('${p['firstName'] ?? ''} ${p['lastName'] ?? ''}').trim().isEmpty ? '-' : ('${p['firstName'] ?? ''} ${p['lastName'] ?? ''}').trim()} (${p['seatNumber'] ?? '-'})',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        actions: [
          if (booking['ticket'] != null)
            TextButton.icon(
              icon: const Icon(
                Icons.airplane_ticket_rounded,
                size: 16,
                color: AppColors.primary,
              ),
              label: const Text(
                'Lihat Tiket',
                style: TextStyle(color: AppColors.primary),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                _openETicket(booking);
              },
            ),
          if (booking['ticket'] != null)
            TextButton.icon(
              icon: const Icon(
                Icons.download_rounded,
                size: 16,
                color: AppColors.primary,
              ),
              label: const Text(
                'Unduh Tiket',
                style: TextStyle(color: AppColors.primary),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                _downloadTicket(booking);
              },
            ),
          if (actions.isNotEmpty)
            ...actions.map(
              (a) => TextButton.icon(
                icon: Icon(a.icon, size: 16, color: a.color),
                label: Text(a.label, style: TextStyle(color: a.color)),
                onPressed: () {
                  Navigator.pop(ctx);
                  _doAction(booking['id'].toString(), a.action);
                },
              ),
            ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Tutup',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: AppColors.textHint),
          const SizedBox(width: 6),
          SizedBox(
            width: 90,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF2563EB), Color(0xFF6366F1)],
            ),
            boxShadow: [
              BoxShadow(
                color: Color(0x332563EB),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text(
              'Kelola Transaksi',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Filter chips
          SizedBox(
            height: 52,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _statusFilters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final f = _statusFilters[i];
                final selected = _selectedStatus == f['value'];
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedStatus = f['value']!;
                      _page = 1;
                    });
                    _loadBookings();
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      gradient: selected
                          ? const LinearGradient(
                              colors: [Color(0xFF2563EB), Color(0xFF6366F1)],
                            )
                          : null,
                      color: selected ? null : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected ? Colors.transparent : AppColors.border,
                      ),
                      boxShadow: selected
                          ? [
                              const BoxShadow(
                                color: Color(0x332563EB),
                                blurRadius: 8,
                                offset: Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Text(
                      f['label']!,
                      style: TextStyle(
                        color: selected
                            ? Colors.white
                            : AppColors.textSecondary,
                        fontWeight: selected
                            ? FontWeight.bold
                            : FontWeight.normal,
                        fontSize: 13,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          ListQueryControls(
            searchQuery: _searchQuery,
            sortValue: _sortBy,
            rowsPerPage: _perPage,
            searchHint: 'Cari kode booking, user, email, atau ID...',
            onSearchChanged: (v) => setState(() {
              _searchQuery = v;
              _page = 1;
            }),
            onSortChanged: (v) => setState(() {
              _sortBy = v;
              _page = 1;
            }),
            onRowsPerPageChanged: (v) => setState(() {
              _perPage = v;
              _page = 1;
            }),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline_rounded,
                          size: 48,
                          color: AppColors.error,
                        ),
                        const SizedBox(height: 12),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadBookings,
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Coba Lagi'),
                        ),
                      ],
                    ),
                  )
                : _processedBookings.isEmpty
                ? const EmptyState(
                    icon: Icons.receipt_long_rounded,
                    title: 'Belum ada transaksi',
                    subtitle: 'Tidak ada transaksi pada filter ini',
                  )
                : Column(
                    children: [
                      Expanded(
                        child: RefreshIndicator(
                          onRefresh: _loadBookings,
                          child: ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _pagedBookings.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemBuilder: (ctx, i) {
                              final b = _pagedBookings[i];
                              final user = b['user'] as Map<String, dynamic>?;
                              final flight =
                                  b['flight'] as Map<String, dynamic>?;
                              final origin =
                                  flight?['origin'] as Map<String, dynamic>?;
                              final dest =
                                  flight?['destination']
                                      as Map<String, dynamic>?;
                              final displaySt = _displayStatus(b);
                              final actions = _actionsFor(b);
                              return TweenAnimationBuilder<double>(
                                duration: Duration(milliseconds: 260 + i * 50),
                                tween: Tween(begin: 0.0, end: 1.0),
                                curve: Curves.easeOut,
                                builder: (_, v, child) => Opacity(
                                  opacity: v,
                                  child: Transform.translate(
                                    offset: Offset(0, 16 * (1 - v)),
                                    child: child,
                                  ),
                                ),
                                child: GestureDetector(
                                  onTap: () => _showDetailDialog(b),
                                  child: GlassCard(
                                    padding: const EdgeInsets.all(14),
                                    child: Row(
                                      children: [
                                        // Status indicator
                                        Container(
                                          width: 4,
                                          height: 70,
                                          decoration: BoxDecoration(
                                            color: _statusColor(displaySt),
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Expanded(
                                                    child: Text(
                                                      b['bookingCode'] ?? '-',
                                                      style: const TextStyle(
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                  ),
                                                  Container(
                                                    padding:
                                                        const EdgeInsets.symmetric(
                                                          horizontal: 8,
                                                          vertical: 3,
                                                        ),
                                                    decoration: BoxDecoration(
                                                      color: _statusColor(
                                                        displaySt,
                                                      ).withValues(alpha: 0.15),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            12,
                                                          ),
                                                      border: Border.all(
                                                        color: _statusColor(
                                                          displaySt,
                                                        ),
                                                        width: 1,
                                                      ),
                                                    ),
                                                    child: Text(
                                                      _statusLabel(displaySt),
                                                      style: TextStyle(
                                                        fontSize: 10,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        color: _statusColor(
                                                          displaySt,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                '${origin?['code'] ?? '-'} → ${dest?['code'] ?? '-'}',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 13,
                                                  color: AppColors.textPrimary,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                user?['name'] ??
                                                    user?['email'] ??
                                                    '-',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color:
                                                      AppColors.textSecondary,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                _formatPrice(
                                                  b['totalPrice'] as num?,
                                                ),
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: AppColors.primary,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (actions.isNotEmpty)
                                          PopupMenuButton<String>(
                                            icon: const Icon(
                                              Icons.more_vert_rounded,
                                              color: AppColors.textHint,
                                            ),
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(14),
                                            ),
                                            itemBuilder: (_) => actions
                                                .map(
                                                  (a) => PopupMenuItem<String>(
                                                    value: a.action,
                                                    child: Row(
                                                      children: [
                                                        Icon(
                                                          a.icon,
                                                          size: 18,
                                                          color: a.color,
                                                        ),
                                                        const SizedBox(
                                                          width: 10,
                                                        ),
                                                        Text(
                                                          a.label,
                                                          style: TextStyle(
                                                            color: a.color,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                )
                                                .toList(),
                                            onSelected: (action) => _doAction(
                                              b['id'].toString(),
                                              action,
                                            ),
                                          ),
                                        if (b['ticket'] != null)
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              IconButton(
                                                tooltip: 'Lihat Tiket',
                                                icon: const Icon(
                                                  Icons
                                                      .airplane_ticket_outlined,
                                                  color: AppColors.primary,
                                                ),
                                                onPressed: () =>
                                                    _openETicket(b),
                                              ),
                                              IconButton(
                                                tooltip: 'Unduh Tiket',
                                                icon: const Icon(
                                                  Icons.download_rounded,
                                                  color: AppColors.primary,
                                                ),
                                                onPressed: () =>
                                                    _downloadTicket(b),
                                              ),
                                            ],
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: ListPaginationBar(
                          currentPage: _page,
                          totalItems: _processedBookings.length,
                          itemsPerPage: _perPage,
                          onPageChanged: (next) => setState(() => _page = next),
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _ActionDef {
  final String action;
  final String label;
  final IconData icon;
  final Color color;
  const _ActionDef(this.action, this.label, this.icon, this.color);
}
