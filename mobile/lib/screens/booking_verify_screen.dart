import 'package:flutter/material.dart';
import '../services/booking_service.dart';
import '../utils/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/common_widgets.dart';

class BookingVerifyScreen extends StatefulWidget {
  const BookingVerifyScreen({super.key});

  @override
  State<BookingVerifyScreen> createState() => _BookingVerifyScreenState();
}

class _BookingVerifyScreenState extends State<BookingVerifyScreen> {
  bool _isInitialized = false;
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _booking;
  String _code = '';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInitialized) return;
    _isInitialized = true;
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args is Map<String, dynamic>) {
      _code = args['code']?.toString() ?? '';
    } else if (args is String) {
      _code = args;
    }
    _loadBooking();
  }

  Future<void> _loadBooking() async {
    if (_code.isEmpty) {
      setState(() {
        _isLoading = false;
        _error = 'Kode booking tidak ditemukan';
      });
      return;
    }
    try {
      final result = await BookingService.verifyBooking(_code);
      setState(() {
        _booking = result['booking'] as Map<String, dynamic>? ?? result;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Verifikasi gagal: ${e.toString().replaceFirst('Exception: ', '')}';
        _isLoading = false;
      });
    }
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'SETTLEMENT':
      case 'COMPLETED':
        return AppColors.success;
      case 'PENDING':
        return AppColors.warning;
      case 'CANCELLED':
      case 'EXPIRED':
      case 'FAILED':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _statusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'SETTLEMENT':
      case 'COMPLETED':
        return 'Terkonfirmasi';
      case 'PENDING':
        return 'Menunggu Pembayaran';
      case 'CANCELLED':
        return 'Dibatalkan';
      case 'EXPIRED':
        return 'Kadaluwarsa';
      case 'FAILED':
        return 'Gagal';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
            boxShadow: [BoxShadow(color: Color(0x222563EB), blurRadius: 12, offset: Offset(0, 4))],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            title: const Text('Verifikasi Tiket', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null || _booking == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, size: 72, color: AppColors.error),
              const SizedBox(height: 16),
              const Text('Verifikasi Gagal',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(_error ?? 'Data booking tidak ditemukan',
                  style: const TextStyle(color: AppColors.textSecondary),
                  textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }

    final b = _booking!;
    final status = b['status']?.toString() ?? 'UNKNOWN';
    final bookingCode = b['bookingCode']?.toString() ?? _code;
    final flight = b['flight'] as Map<String, dynamic>?;
    final passengers = b['passengers'] as List?;
    final seats = b['seats'] as List? ?? b['selectedSeats'] as List? ?? [];

    final originCode = flight?['origin']?['code'] ?? '';
    final originCity = flight?['origin']?['city'] ?? '';
    final destCode = flight?['destination']?['code'] ?? '';
    final destCity = flight?['destination']?['city'] ?? '';
    final airlineName = flight?['airline']?['name'] ?? '';
    final flightNumber = flight?['flightNumber']?.toString() ?? '';
    final depTime = flight?['departureTime']?.toString() ?? '';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Status banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _statusColor(status).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _statusColor(status).withValues(alpha: 0.4)),
            ),
            child: Row(
              children: [
                Icon(
                  status.toUpperCase() == 'PAID' || status.toUpperCase() == 'SETTLEMENT' || status.toUpperCase() == 'COMPLETED'
                      ? Icons.check_circle_rounded
                      : status.toUpperCase() == 'PENDING'
                          ? Icons.hourglass_top_rounded
                          : Icons.cancel_rounded,
                  color: _statusColor(status),
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_statusLabel(status),
                          style: TextStyle(
                              color: _statusColor(status),
                              fontWeight: FontWeight.bold,
                              fontSize: 16)),
                      Text('Status tiket saat ini',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Booking code
          GlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Kode Booking', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                const SizedBox(height: 4),
                Text(bookingCode,
                    style: const TextStyle(
                        fontSize: 22, fontWeight: FontWeight.bold,
                        letterSpacing: 3, color: AppColors.primary)),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Flight info
          if (flight != null)
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Informasi Penerbangan'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(originCode,
                                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            Text(originCity, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                          ],
                        ),
                      ),
                      const Column(
                        children: [
                          Icon(Icons.flight_rounded, color: AppColors.primary, size: 24),
                          Text('→', style: TextStyle(color: AppColors.textHint)),
                        ],
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(destCode,
                                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            Text(destCity, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                                textAlign: TextAlign.end),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.airlines_rounded, size: 16, color: AppColors.textHint),
                      const SizedBox(width: 6),
                      Text('$airlineName — $flightNumber',
                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    ],
                  ),
                  if (depTime.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.schedule_rounded, size: 16, color: AppColors.textHint),
                        const SizedBox(width: 6),
                        Text(DateFormatter.formatDate(DateTime.tryParse(depTime) ?? DateTime.now()),
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                        const SizedBox(width: 8),
                        Text(DateFormatter.formatTime(depTime),
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          const SizedBox(height: 12),

          // Passengers
          if (passengers != null && passengers.isNotEmpty)
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Penumpang'),
                  const SizedBox(height: 12),
                  ...passengers.asMap().entries.map((e) {
                    final p = e.value as Map<String, dynamic>;
                    final name = '${p['firstName'] ?? ''} ${p['lastName'] ?? ''}'.trim();
                    final type = p['type']?.toString() ?? 'ADULT';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          const Icon(Icons.person_rounded, size: 16, color: AppColors.primary),
                          const SizedBox(width: 8),
                          Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w500))),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: type == 'ADULT' ? AppColors.primary.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              type == 'ADULT' ? 'Dewasa' : 'Anak',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: type == 'ADULT' ? AppColors.primary : Colors.orange,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),

          // Seats
          if (seats.isNotEmpty) ...[
            const SizedBox(height: 12),
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Kursi'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: seats.map((s) {
                      final seatNum = s is Map ? (s['seatNumber'] ?? s['seat'] ?? s.toString()) : s.toString();
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                        ),
                        child: Text(seatNum.toString(),
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
