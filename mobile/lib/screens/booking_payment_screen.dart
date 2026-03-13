import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/flight_model.dart';
import '../services/booking_service.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';

class BookingPaymentScreen extends StatefulWidget {
  const BookingPaymentScreen({super.key});

  @override
  State<BookingPaymentScreen> createState() => _BookingPaymentScreenState();
}

class _BookingPaymentScreenState extends State<BookingPaymentScreen> {
  bool _isInitialized = false;
  bool _isCreating = false;
  bool _isSyncing = false;
  bool _paymentOpened = false;
  bool _isExpired = false;
  int? _bookingId;
  int? _existingBookingId;
  String? _redirectUrl;
  String? _error;

  FlightCardItem? _flight;
  List<Map<String, dynamic>> _passengers = [];
  List<int> _seatIds = [];
  int _totalPrice = 0;
  int _flightId = 0;

  // Countdown timer
  static const int _countdownSeconds = 15 * 60; // 15 minutes
  int _remainingSeconds = _countdownSeconds;
  Timer? _countdownTimer;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInitialized) return;
    _isInitialized = true;
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      _flightId = (args['flightId'] as int?) ?? 0;
      _flight = args['flight'] as FlightCardItem?;
      _passengers =
          List<Map<String, dynamic>>.from(args['passengers'] ?? []);
      _seatIds = List<int>.from(args['seatIds'] ?? []);
      _totalPrice = (args['totalPrice'] as int?) ?? 0;
      _existingBookingId = args['existingBookingId'] as int?;
      if (_existingBookingId != null) {
        _bookingId = _existingBookingId;
      }
    }
    _startCountdown();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_remainingSeconds <= 0) {
        timer.cancel();
        _handleExpired();
        return;
      }
      setState(() => _remainingSeconds--);
    });
  }

  Future<void> _handleExpired() async {
    setState(() => _isExpired = true);
    if (_bookingId != null) {
      try {
        await BookingService.cancelBooking(_bookingId!);
      } catch (_) {}
    }
  }

  String _formatCountdown() {
    final m = (_remainingSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (_remainingSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Future<void> _createBookingAndPay() async {
    setState(() {
      _isCreating = true;
      _error = null;
    });
    try {
      int bookingId;

      if (_existingBookingId != null) {
        // Editing flow: reuse existing booking, skip createBooking
        bookingId = _existingBookingId!;
      } else {
        // New booking flow
        final bookingResult = await BookingService.createBooking(
          flightId: _flightId,
          passengers: _passengers,
          seatIds: _seatIds.isNotEmpty ? _seatIds : null,
        );
        bookingId =
            bookingResult['booking']?['id'] as int? ??
            bookingResult['id'] as int?
            ?? (throw Exception('Gagal membuat pemesanan'));
      }

      final paymentResult = await BookingService.createPayment(bookingId);
      // Backend wraps hasil di dalam key 'payment': { snapToken, redirectUrl, ... }
      final paymentData = paymentResult['payment'] as Map<String, dynamic>?;
      final redirectUrl =
          paymentData?['redirectUrl'] as String? ??
          paymentResult['redirectUrl'] as String? ??
          paymentResult['snap_redirect_url'] as String?;
      if (redirectUrl == null) throw Exception('Gagal mendapatkan link pembayaran');

      setState(() {
        _bookingId = bookingId;
        _redirectUrl = redirectUrl;
        _isCreating = false;
      });
      await _openPayment(redirectUrl);
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isCreating = false;
      });
    }
  }

  Future<void> _openPayment(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      _showSnack('URL pembayaran tidak valid', isError: true);
      return;
    }
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (mounted) setState(() => _paymentOpened = true);
    } else {
      _showSnack('Tidak dapat membuka halaman pembayaran', isError: true);
    }
  }

  Future<void> _syncStatus() async {
    if (_bookingId == null) return;
    setState(() => _isSyncing = true);
    try {
      final result = await BookingService.syncPayment(_bookingId!);
      final status = (result['booking']?['status'] ??
              result['status'] ??
              '')
          .toString()
          .toUpperCase();
      if (!mounted) return;
      setState(() => _isSyncing = false);

      if (status == 'PAID') {
        _showSnack('Pembayaran berhasil dikonfirmasi!');
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          Navigator.of(context)
              .pushNamedAndRemoveUntil('/bookings', (r) => r.isFirst);
        }
      } else if (status == 'PENDING') {
        showErrorDialog(context, 'Menunggu Pembayaran',
            'Pembayaran sedang diproses. Silakan cek ulang beberapa saat lagi.');
      } else if (['CANCELLED', 'EXPIRED', 'FAILED'].contains(status)) {
        showErrorDialog(context, 'Pembayaran Gagal',
            'Pembayaran dibatalkan atau kadaluwarsa. Silakan buat pemesanan baru.');
      } else {
        showErrorDialog(context, 'Status Tidak Diketahui',
            'Status: $status. Coba lagi nanti.');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSyncing = false);
        _showSnack(
            e.toString().replaceFirst('Exception: ', ''),
            isError: true);
      }
    }
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? AppColors.error : AppColors.success,
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (_isExpired) {
      return Scaffold(
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(kToolbarHeight),
          child: Container(
            decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
            child: AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              title: const Text('Pembayaran', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.timer_off_rounded, size: 72, color: AppColors.error),
                const SizedBox(height: 16),
                const Text('Sesi Pembayaran Kadaluwarsa',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                const SizedBox(height: 8),
                const Text('Waktu pembayaran telah habis dan pemesanan Anda otomatis dibatalkan.',
                    style: TextStyle(color: AppColors.textSecondary), textAlign: TextAlign.center),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Kembali ke Beranda',
                  onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil('/dashboard', (r) => false),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
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
            leading: _paymentOpened
                ? const SizedBox.shrink()
                : IconButton(
                    icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
            title: const Text('Pembayaran', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _remainingSeconds <= 60
                          ? AppColors.error.withValues(alpha: 0.2)
                          : Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.timer_rounded, size: 14,
                            color: _remainingSeconds <= 60 ? AppColors.error : Colors.white),
                        const SizedBox(width: 4),
                        Text(_formatCountdown(),
                            style: TextStyle(
                                color: _remainingSeconds <= 60 ? AppColors.error : Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Countdown warning
                  if (_remainingSeconds <= 60 && !_isExpired)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.error.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Kurang dari 1 menit! Segera selesaikan pembayaran.',
                              style: const TextStyle(color: AppColors.error, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (_flight != null) _buildFlightSummary(),
                  const SizedBox(height: 16),
                  _buildPassengerSummary(),
                  const SizedBox(height: 16),
                  _buildPriceSummary(),
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.errorLight,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline,
                              color: AppColors.error),
                          const SizedBox(width: 8),
                          Expanded(
                              child: Text(_error!,
                                  style: const TextStyle(
                                      color: AppColors.error))),
                        ],
                      ),
                    ),
                  ],
                  if (_bookingId != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('ID Pemesanan: #$_bookingId',
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          const Text(
                              'Selesaikan pembayaran di browser, lalu kembali ke sini untuk mengecek status.',
                              style: TextStyle(
                                  fontSize: 13, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (!_paymentOpened && (_bookingId == null || _existingBookingId != null && !_paymentOpened))
                    PrimaryButton(
                      label: _existingBookingId != null ? 'Bayar Sekarang' : 'Buat Pesanan & Bayar',
                      onPressed: _createBookingAndPay,
                      isLoading: _isCreating,
                    ),
                  if (_paymentOpened && _redirectUrl != null) ...[
                    PrimaryButton(
                      label: 'Buka Halaman Pembayaran Lagi',
                      onPressed: () => _openPayment(_redirectUrl!),
                    ),
                    const SizedBox(height: 12),
                    PrimaryButton(
                      label: 'Cek Status Pembayaran',
                      onPressed: _syncStatus,
                      isLoading: _isSyncing,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFlightSummary() {
    final f = _flight!;
    return Card(
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Detail Penerbangan',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(f.airline,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold)),
                      Text(f.flightNumber,
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Text(f.departureTime,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 18)),
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8),
                  child: Column(
                    children: [
                      const Icon(Icons.flight,
                          size: 16, color: AppColors.primary),
                      Text(f.duration,
                          style: const TextStyle(fontSize: 11)),
                    ],
                  ),
                ),
                Text(f.arrivalTime,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 18)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPassengerSummary() {
    return Card(
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Penumpang',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ..._passengers.map((p) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      const Icon(Icons.person_outline,
                          size: 18, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text('${p['firstName']} ${p['lastName']}'),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          p['type'] == 'ADULT' ? 'Dewasa' : 'Anak',
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.primary),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceSummary() {
    return Card(
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: AppColors.surfaceVariant,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Ringkasan Harga',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total',
                    style: TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold)),
                Text(
                  CurrencyFormatter.formatPrice(_totalPrice),
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryDark),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
