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
  int? _bookingId;
  String? _redirectUrl;
  String? _error;

  FlightCardItem? _flight;
  List<Map<String, dynamic>> _passengers = [];
  List<int> _seatIds = [];
  int _totalPrice = 0;
  int _flightId = 0;

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
    }
  }

  Future<void> _createBookingAndPay() async {
    setState(() {
      _isCreating = true;
      _error = null;
    });
    try {
      final bookingResult = await BookingService.createBooking(
        flightId: _flightId,
        passengers: _passengers,
        seatIds: _seatIds.isNotEmpty ? _seatIds : null,
      );
      final bookingId =
          bookingResult['booking']?['id'] as int? ??
          bookingResult['id'] as int?;
      if (bookingId == null) throw Exception('Gagal membuat pemesanan');

      final paymentResult = await BookingService.createPayment(bookingId);
      final redirectUrl =
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

      if (status == 'PAID' || status == 'SETTLEMENT') {
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
      backgroundColor: isError ? Colors.red : Colors.green,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
            boxShadow: [BoxShadow(color: Color(0x220EA5E9), blurRadius: 12, offset: Offset(0, 4))],
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
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline,
                              color: Colors.red.shade600),
                          const SizedBox(width: 8),
                          Expanded(
                              child: Text(_error!,
                                  style: TextStyle(
                                      color: Colors.red.shade700))),
                        ],
                      ),
                    ),
                  ],
                  if (_bookingId != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
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
                                  fontSize: 13, color: Colors.black54)),
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
                  if (!_paymentOpened && _bookingId == null)
                    PrimaryButton(
                      label: 'Buat Pesanan & Bayar',
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
                          style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600)),
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
                          size: 16, color: Colors.blue),
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
                      Icon(Icons.person_outline,
                          size: 18, color: Colors.blue.shade600),
                      const SizedBox(width: 8),
                      Text('${p['firstName']} ${p['lastName']}'),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          p['type'] == 'ADULT' ? 'Dewasa' : 'Anak',
                          style: TextStyle(
                              fontSize: 11,
                              color: Colors.blue.shade700),
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
      color: Colors.blue.shade50,
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
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade700),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
