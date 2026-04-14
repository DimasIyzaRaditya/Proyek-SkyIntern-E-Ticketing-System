import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/flight_model.dart';
import '../services/booking_service.dart';
import '../services/promo_service.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import 'midtrans_payment_webview_screen.dart';

class BookingPaymentScreen extends StatefulWidget {
  const BookingPaymentScreen({super.key});

  @override
  State<BookingPaymentScreen> createState() => _BookingPaymentScreenState();
}

class _BookingPaymentScreenState extends State<BookingPaymentScreen> {
  bool _isInitialized = false;
  bool _isPreparingBooking = false;
  bool _isCreating = false;
  bool _isSyncing = false;
  bool _isCancelling = false;
  bool _paymentOpened = false;
  bool _isExpired = false;
  int? _bookingId;
  int? _existingBookingId;
  String _bookingStatus = 'PENDING';
  DateTime? _expiresAt;
  String? _redirectUrl;
  String? _error;

  FlightCardItem? _flight;
  List<Map<String, dynamic>> _passengers = [];
  List<int> _seatIds = [];
  int _totalPrice = 0;
  int _flightId = 0;

  // Pricing breakdown
  int _baseFare = 0;
  int _seatExtraPrice = 0;
  int _tax = 0;
  int _adminFee = 0;
  int _subTotal = 0;
  int _discountPercent = 0;
  int _discountAmount = 0;

  List<PromoItem> _applicablePromos = const [];
  bool _isLoadingPromos = false;
  int? _selectedPromoId;

  // Countdown timer
  static const int _countdownSeconds = 15 * 60; // Fallback 15 minutes
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
      _passengers = List<Map<String, dynamic>>.from(args['passengers'] ?? []);
      _seatIds = List<int>.from(args['seatIds'] ?? []);
      _seatExtraPrice = (args['extraPrice'] as int?) ?? 0;
      _tax = _flight?.tax ?? 0;
      _adminFee = _flight?.adminFee ?? 0;
      _totalPrice = (args['totalPrice'] as int?) ?? 0;
      _existingBookingId = args['existingBookingId'] as int?;
      _selectedPromoId = args['promoId'] as int?;
      if (_existingBookingId != null) {
        _bookingId = _existingBookingId;
      }
    }
    _recalculatePricingFallback();
    _loadApplicablePromos();
    _bootstrapPaymentFlow();
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
      _remainingSeconds = _calculateRemainingSeconds();
      if (_remainingSeconds <= 0) {
        timer.cancel();
        _handleExpired();
        return;
      }
      setState(() {});
    });
  }

  int _calculateRemainingSeconds() {
    if (_expiresAt == null) return _remainingSeconds;
    final remaining = _expiresAt!.difference(DateTime.now()).inSeconds;
    return remaining > 0 ? remaining : 0;
  }

  Future<void> _bootstrapPaymentFlow() async {
    setState(() {
      _isPreparingBooking = true;
      _error = null;
    });

    try {
      if (_existingBookingId != null) {
        final detail = await BookingService.getBookingDetail(
          _existingBookingId!,
        );
        final booking = detail['booking'] as Map<String, dynamic>?;
        if (booking == null) throw Exception('Booking tidak ditemukan');

        _bookingId = booking['id'] as int? ?? _existingBookingId;
        _bookingStatus = (booking['status'] ?? 'PENDING')
            .toString()
            .toUpperCase();
        _totalPrice = (booking['totalPrice'] as num?)?.toInt() ?? _totalPrice;
        _passengers = (booking['passengers'] as List? ?? const [])
            .whereType<Map>()
            .map((p) => Map<String, dynamic>.from(p))
            .toList();
        _flight = _buildFlightFromBookingDetail(booking);
        _flightId = (booking['flightId'] as num?)?.toInt() ?? _flightId;
        _applyPricingFromBookingDetail(booking);
        final expiresAtRaw = booking['expiresAt']?.toString();
        _expiresAt = expiresAtRaw != null
            ? DateTime.tryParse(expiresAtRaw)?.toLocal()
            : null;
      } else {
        // Untuk booking baru: tunggu user memilih promo lalu klik Bayar Sekarang.
        _bookingStatus = 'DRAFT';
        _expiresAt = null;
        _remainingSeconds = _countdownSeconds;
      }
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      if (mounted) {
        setState(() => _isPreparingBooking = false);
      }
    }
  }

  Future<void> _loadApplicablePromos() async {
    setState(() => _isLoadingPromos = true);
    try {
      final promos = await PromoService.getActivePromos();
      final currentFlightId = _flightId > 0
          ? _flightId.toString()
          : (_flight?.id ?? '').toString();

      final filtered = promos.where((promo) {
        if (!promo.isFlightPromo) return true;
        return promo.flightId == currentFlightId;
      }).toList()..sort((a, b) => b.discount.compareTo(a.discount));

      if (!mounted) return;
      setState(() {
        _applicablePromos = filtered;
        final selectedStillValid =
            _selectedPromoId == null ||
            filtered.any((p) => p.id == _selectedPromoId);
        if (!selectedStillValid) {
          _selectedPromoId = null;
        }
        _recalculatePricingFallback();
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _applicablePromos = const [];
        _selectedPromoId = null;
        _recalculatePricingFallback();
      });
    } finally {
      if (mounted) setState(() => _isLoadingPromos = false);
    }
  }

  FlightCardItem? _buildFlightFromBookingDetail(Map<String, dynamic> booking) {
    final flight = booking['flight'];
    if (flight is! Map) return _flight;
    final f = Map<String, dynamic>.from(flight);
    final origin = Map<String, dynamic>.from((f['origin'] as Map?) ?? const {});
    final destination = Map<String, dynamic>.from(
      (f['destination'] as Map?) ?? const {},
    );
    final airline = Map<String, dynamic>.from(
      (f['airline'] as Map?) ?? const {},
    );

    final departureRaw = f['departureTime']?.toString();
    final arrivalRaw = f['arrivalTime']?.toString();

    String _durationText() {
      final dep = departureRaw != null ? DateTime.tryParse(departureRaw) : null;
      final arr = arrivalRaw != null ? DateTime.tryParse(arrivalRaw) : null;
      if (dep == null || arr == null) return '-';
      final minutes = arr.difference(dep).inMinutes;
      if (minutes <= 0) return '-';
      final h = minutes ~/ 60;
      final m = minutes % 60;
      return '${h}h ${m}m';
    }

    return FlightCardItem(
      id: (f['id'] ?? _flightId).toString(),
      flightNumber: (f['flightNumber'] ?? '-').toString(),
      airline: (airline['name'] ?? '-').toString(),
      logo: '✈️',
      aircraft: (f['aircraft'] ?? 'Aircraft').toString(),
      origin: (origin['city'] ?? '-').toString(),
      destination: (destination['city'] ?? '-').toString(),
      departureTime: DateFormatter.formatTime(departureRaw),
      arrivalTime: DateFormatter.formatTime(arrivalRaw),
      duration: _durationText(),
      price: (f['basePrice'] as num?)?.toInt() ?? 0,
      tax: (f['tax'] as num?)?.toInt() ?? 0,
      adminFee: (f['adminFee'] as num?)?.toInt() ?? 0,
      facilities: const [],
    );
  }

  void _recalculatePricingFallback() {
    final passengerCount = _passengers.isEmpty ? 1 : _passengers.length;
    final baseUnit = _flight?.price ?? 0;
    _baseFare = baseUnit * passengerCount;
    _subTotal = _baseFare + _seatExtraPrice + _tax + _adminFee;

    // Selama booking belum dibuat, tampilkan estimasi diskon berdasarkan promo yang dipilih user.
    if (_bookingId == null) {
      final selectedPromo = _applicablePromos
          .where((promo) => promo.id == _selectedPromoId)
          .firstOrNull;
      _discountPercent = selectedPromo?.discount ?? 0;
      _discountAmount = ((_subTotal * _discountPercent) / 100).round();
    }

    if (_subTotal > 0 && _discountAmount > _subTotal) {
      _discountAmount = _subTotal;
    }
    _totalPrice = _subTotal - _discountAmount;
  }

  void _applyPricingFromBookingDetail(Map<String, dynamic> booking) {
    final flight = Map<String, dynamic>.from(
      (booking['flight'] as Map?) ?? const {},
    );
    final passengerCount =
        ((booking['passengers'] as List?)?.length ?? _passengers.length).clamp(
          1,
          9999,
        );
    final basePrice =
        (flight['basePrice'] as num?)?.toInt() ?? (_flight?.price ?? 0);
    final tax = (flight['tax'] as num?)?.toInt() ?? 0;
    final adminFee = (flight['adminFee'] as num?)?.toInt() ?? 0;

    final seatExtraPrice = ((booking['flightSeats'] as List?) ?? const [])
        .whereType<Map>()
        .fold<int>(
          0,
          (sum, item) =>
              sum + ((item['additionalPrice'] as num?)?.toInt() ?? 0),
        );

    _baseFare = basePrice * passengerCount;
    _seatExtraPrice = seatExtraPrice;
    _tax = tax;
    _adminFee = adminFee;
    _subTotal = _baseFare + _seatExtraPrice + _tax + _adminFee;
    _discountAmount = (_subTotal - _totalPrice).clamp(0, _subTotal);
    _discountPercent = _subTotal > 0
        ? ((_discountAmount * 100) / _subTotal).round()
        : 0;
    _totalPrice = (booking['totalPrice'] as num?)?.toInt() ?? _totalPrice;
  }

  void _applyPricingFromCreateBookingResponse(Map<String, dynamic> response) {
    final booking = Map<String, dynamic>.from(
      (response['booking'] as Map?) ?? const {},
    );
    final pricing = Map<String, dynamic>.from(
      (response['pricing'] as Map?) ?? const {},
    );
    final flight = Map<String, dynamic>.from(
      (booking['flight'] as Map?) ?? const {},
    );

    final passengerCount =
        ((booking['passengers'] as List?)?.length ?? _passengers.length).clamp(
          1,
          9999,
        );
    final basePrice =
        (flight['basePrice'] as num?)?.toInt() ?? (_flight?.price ?? 0);

    _flight = _buildFlightFromBookingDetail(booking);
    _baseFare = basePrice * passengerCount;
    _tax = (flight['tax'] as num?)?.toInt() ?? 0;
    _adminFee = (flight['adminFee'] as num?)?.toInt() ?? 0;

    final rawTotal = (pricing['rawTotalPrice'] as num?)?.toInt();
    _seatExtraPrice = rawTotal != null
        ? (rawTotal - _baseFare - _tax - _adminFee).clamp(0, 1 << 30)
        : _seatExtraPrice;
    _subTotal = rawTotal ?? (_baseFare + _seatExtraPrice + _tax + _adminFee);

    _discountPercent = (pricing['discountPercent'] as num?)?.toInt() ?? 0;
    _discountAmount = (pricing['promoAmount'] as num?)?.toInt() ?? 0;
    _totalPrice = (pricing['totalPrice'] as num?)?.toInt() ?? _totalPrice;
  }

  Future<void> _handleExpired() async {
    setState(() => _isExpired = true);
    if (_bookingId != null && _bookingStatus == 'PENDING') {
      try {
        await BookingService.cancelBooking(_bookingId!);
        _bookingStatus = 'CANCELLED';
      } catch (_) {}
    }
  }

  String _formatCountdown() {
    final m = (_remainingSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (_remainingSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  bool get _supportsEmbeddedPayment {
    if (kIsWeb) return false;
    return switch (defaultTargetPlatform) {
      TargetPlatform.android ||
      TargetPlatform.iOS ||
      TargetPlatform.macOS => true,
      _ => false,
    };
  }

  Future<void> _createBookingAndPay() async {
    setState(() {
      _isCreating = true;
      _error = null;
    });
    try {
      int? bookingId = _bookingId;

      if (bookingId == null) {
        final bookingResult = await BookingService.createBooking(
          flightId: _flightId,
          passengers: _passengers,
          seatIds: _seatIds.isNotEmpty ? _seatIds : null,
          promoId: _selectedPromoId,
        );

        final booking = bookingResult['booking'] as Map<String, dynamic>?;
        bookingId = booking?['id'] as int? ?? bookingResult['id'] as int?;
        if (bookingId == null) throw Exception('Gagal membuat pemesanan');

        _bookingId = bookingId;
        _bookingStatus = (booking?['status'] ?? 'PENDING')
            .toString()
            .toUpperCase();
        _totalPrice = (booking?['totalPrice'] as num?)?.toInt() ?? _totalPrice;
        _applyPricingFromCreateBookingResponse(bookingResult);

        final expiresAtRaw = booking?['expiresAt']?.toString();
        _expiresAt = expiresAtRaw != null
            ? DateTime.tryParse(expiresAtRaw)?.toLocal()
            : DateTime.now().add(const Duration(minutes: 15));
        _remainingSeconds = _calculateRemainingSeconds();
        if (_remainingSeconds <= 0 ||
            _bookingStatus == 'CANCELLED' ||
            _bookingStatus == 'EXPIRED') {
          await _handleExpired();
          throw Exception('Waktu booking habis. Silakan coba lagi.');
        }
        _startCountdown();
      }

      final paymentResult = await BookingService.createPayment(bookingId);
      // Backend wraps hasil di dalam key 'payment': { snapToken, redirectUrl, ... }
      final paymentData = paymentResult['payment'] as Map<String, dynamic>?;
      final redirectUrl =
          paymentData?['redirectUrl'] as String? ??
          paymentResult['redirectUrl'] as String? ??
          paymentResult['snap_redirect_url'] as String?;
      if (redirectUrl == null)
        throw Exception('Gagal mendapatkan link pembayaran');

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

  Future<void> _cancelPendingBooking() async {
    if (_bookingId == null || _bookingStatus != 'PENDING') return;
    setState(() => _isCancelling = true);
    try {
      await BookingService.cancelBooking(_bookingId!);
      if (!mounted) return;
      setState(() {
        _bookingStatus = 'CANCELLED';
        _isExpired = true;
      });
    } catch (e) {
      if (!mounted) return;
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isCancelling = false);
    }
  }

  Future<void> _openPayment(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      _showSnack('URL pembayaran tidak valid', isError: true);
      return;
    }

    if (!_supportsEmbeddedPayment) {
      final opened = await launchUrl(
        uri,
        mode: kIsWeb
            ? LaunchMode.platformDefault
            : LaunchMode.externalApplication,
      );
      if (!mounted) return;
      if (opened) {
        setState(() => _paymentOpened = true);
        _showSnack(
          'Halaman pembayaran dibuka di browser karena platform ini tidak mendukung webview in-app.',
        );
      } else {
        _showSnack('Tidak dapat membuka halaman pembayaran', isError: true);
      }
      return;
    }

    final result = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) =>
            MidtransPaymentWebViewScreen(paymentUrl: uri.toString()),
      ),
    );
    if (!mounted) return;
    setState(() => _paymentOpened = true);

    if (result?['callbackStatus'] != null) {
      await _syncStatus(navigateToBookingsAfterSync: true);
    }
  }

  Future<void> _syncStatus({bool navigateToBookingsAfterSync = false}) async {
    if (_bookingId == null) return;
    setState(() => _isSyncing = true);
    try {
      final result = await BookingService.syncPayment(_bookingId!);
      final status = (result['booking']?['status'] ?? result['status'] ?? '')
          .toString()
          .toUpperCase();
      if (!mounted) return;
      setState(() => _isSyncing = false);

      if (status == 'PAID') {
        _showSnack('Pembayaran berhasil dikonfirmasi!');
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          Navigator.of(
            context,
          ).pushNamedAndRemoveUntil('/bookings', (r) => r.isFirst);
        }
      } else if (status == 'PENDING') {
        if (navigateToBookingsAfterSync) {
          _showSnack(
            'Pembayaran masih diproses. Detail booking ada di halaman booking.',
          );
          await Future.delayed(const Duration(milliseconds: 600));
          if (mounted) {
            Navigator.of(
              context,
            ).pushNamedAndRemoveUntil('/bookings', (r) => r.isFirst);
          }
        } else {
          showErrorDialog(
            context,
            'Menunggu Pembayaran',
            'Pembayaran sedang diproses. Silakan cek ulang beberapa saat lagi.',
          );
        }
      } else if (['CANCELLED', 'EXPIRED', 'FAILED'].contains(status)) {
        if (navigateToBookingsAfterSync) {
          _showSnack(
            'Pembayaran tidak berhasil. Silakan cek status booking di aplikasi.',
            isError: true,
          );
          await Future.delayed(const Duration(milliseconds: 600));
          if (mounted) {
            Navigator.of(
              context,
            ).pushNamedAndRemoveUntil('/bookings', (r) => r.isFirst);
          }
        } else {
          showErrorDialog(
            context,
            'Pembayaran Gagal',
            'Pembayaran dibatalkan atau kadaluwarsa. Silakan buat pemesanan baru.',
          );
        }
      } else {
        if (navigateToBookingsAfterSync) {
          Navigator.of(
            context,
          ).pushNamedAndRemoveUntil('/bookings', (r) => r.isFirst);
        } else {
          showErrorDialog(
            context,
            'Status Tidak Diketahui',
            'Status: $status. Coba lagi nanti.',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSyncing = false);
        _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
      }
    }
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? AppColors.error : AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isPreparingBooking) {
      return Scaffold(
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(kToolbarHeight),
          child: Container(
            decoration: const BoxDecoration(
              gradient: AppColors.primaryGradient,
            ),
            child: AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              title: const Text(
                'Pembayaran',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_isExpired) {
      return Scaffold(
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(kToolbarHeight),
          child: Container(
            decoration: const BoxDecoration(
              gradient: AppColors.primaryGradient,
            ),
            child: AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              title: const Text(
                'Pembayaran',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.timer_off_rounded,
                  size: 72,
                  color: AppColors.error,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Sesi Pembayaran Kadaluwarsa',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Waktu pembayaran telah habis dan pemesanan Anda otomatis dibatalkan.',
                  style: TextStyle(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Kembali ke Beranda',
                  onPressed: () => Navigator.of(
                    context,
                  ).pushNamedAndRemoveUntil('/dashboard', (r) => false),
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
            leading: _paymentOpened
                ? const SizedBox.shrink()
                : IconButton(
                    icon: const Icon(
                      Icons.arrow_back_rounded,
                      color: Colors.white,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
            title: const Text(
              'Pembayaran',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            actions: [
              if (_bookingId != null)
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _remainingSeconds <= 60
                            ? AppColors.error.withValues(alpha: 0.2)
                            : Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.timer_rounded,
                            size: 14,
                            color: _remainingSeconds <= 60
                                ? AppColors.error
                                : Colors.white,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatCountdown(),
                            style: TextStyle(
                              color: _remainingSeconds <= 60
                                  ? AppColors.error
                                  : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
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
                  if (_bookingId != null &&
                      _remainingSeconds <= 60 &&
                      !_isExpired)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppColors.error.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.warning_amber_rounded,
                            color: AppColors.error,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Kurang dari 1 menit! Segera selesaikan pembayaran.',
                              style: const TextStyle(
                                color: AppColors.error,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (_flight != null) _buildFlightSummary(),
                  const SizedBox(height: 16),
                  _buildPromoSelector(),
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
                        border: Border.all(
                          color: AppColors.error.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.error_outline,
                            color: AppColors.error,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _error!,
                              style: const TextStyle(color: AppColors.error),
                            ),
                          ),
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
                  if (!_paymentOpened)
                    PrimaryButton(
                      label: 'Bayar Sekarang',
                      onPressed: _createBookingAndPay,
                      isLoading: _isCreating,
                    ),
                  if (!_paymentOpened) ...[
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: _isCancelling
                            ? null
                            : (_bookingId == null
                                  ? () => Navigator.pop(context)
                                  : _cancelPendingBooking),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          child: Text(
                            _isCancelling
                                ? 'Membatalkan...'
                                : (_bookingId == null ? 'Kembali' : 'Cancel'),
                          ),
                        ),
                      ),
                    ),
                  ],
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

  Widget _buildPromoSelector() {
    final promoLocked = _bookingId != null;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Promo',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            if (_isLoadingPromos)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 6),
                child: LinearProgressIndicator(minHeight: 4),
              )
            else if (_applicablePromos.isEmpty)
              const Text(
                'Belum ada promo yang berlaku untuk penerbangan ini.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              )
            else
              DropdownButtonFormField<int?>(
                initialValue: _selectedPromoId,
                decoration: const InputDecoration(
                  labelText: 'Pilih Promo',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: AppColors.surfaceVariant,
                ),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text('Tanpa Promo'),
                  ),
                  ..._applicablePromos.map(
                    (p) => DropdownMenuItem<int?>(
                      value: p.id,
                      child: Text('${p.title} - ${p.discount}%'),
                    ),
                  ),
                ],
                onChanged: promoLocked
                    ? null
                    : (value) => setState(() {
                        _selectedPromoId = value;
                        _recalculatePricingFallback();
                      }),
              ),
            const SizedBox(height: 8),
            Text(
              promoLocked
                  ? 'Promo dikunci karena booking sudah dibuat.'
                  : 'Pilih promo sebelum menekan Bayar Sekarang.',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFlightSummary() {
    final f = _flight!;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Detail Penerbangan',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        f.airline,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        f.flightNumber,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  f.departureTime,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.flight,
                        size: 16,
                        color: AppColors.primary,
                      ),
                      Text(f.duration, style: const TextStyle(fontSize: 11)),
                    ],
                  ),
                ),
                Text(
                  f.arrivalTime,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPassengerSummary() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Penumpang',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ..._passengers.map(
              (p) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(
                      Icons.person_outline,
                      size: 18,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 8),
                    Text('${p['firstName']} ${p['lastName']}'),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        p['type'] == 'ADULT' ? 'Dewasa' : 'Anak',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceSummary() {
    final discountLabel = _discountPercent > 0
        ? 'Potongan Promo ($_discountPercent%)'
        : 'Potongan Promo';

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: AppColors.surfaceVariant,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ringkasan Harga',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildPriceRow(
              'Harga Dasar (${_passengers.length} penumpang)',
              CurrencyFormatter.formatPrice(_baseFare),
            ),
            _buildPriceRow(
              'Biaya Kursi',
              CurrencyFormatter.formatPrice(_seatExtraPrice),
            ),
            _buildPriceRow('Pajak', CurrencyFormatter.formatPrice(_tax)),
            _buildPriceRow(
              'Biaya Layanan',
              CurrencyFormatter.formatPrice(_adminFee),
            ),
            const Divider(height: 24),
            _buildPriceRow(
              'Subtotal',
              CurrencyFormatter.formatPrice(_subTotal),
              isBold: true,
            ),
            _buildPriceRow(
              discountLabel,
              '- ${CurrencyFormatter.formatPrice(_discountAmount)}',
              valueColor: _discountAmount > 0
                  ? AppColors.success
                  : AppColors.textSecondary,
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total Pembayaran',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  CurrencyFormatter.formatPrice(_totalPrice),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryDark,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(
    String label,
    String value, {
    bool isBold = false,
    Color? valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              color: valueColor ?? AppColors.textPrimary,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
