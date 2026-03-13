import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/booking_provider.dart';
import '../services/booking_service.dart';
import '../models/booking_model.dart';
import '../utils/app_theme.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import '../widgets/common_widgets.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Set<int> _payingIds = {};
  final Set<int> _syncingIds = {};
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookingProvider>().loadBookings();
      _startPolling();
    });
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (mounted) context.read<BookingProvider>().loadBookings();
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  List<Booking> _filter(List<Booking> all, String tab) {
    switch (tab) {
      case 'active':
        return all.where((b) => ['PENDING', 'PAID'].contains(b.status.toUpperCase())).toList();
      case 'completed':
        return all.where((b) => b.status.toUpperCase() == 'PAID' && b.ticket != null).toList();
      case 'cancelled':
        return all.where((b) => ['CANCELLED', 'EXPIRED', 'FAILED'].contains(b.status.toUpperCase())).toList();
      default:
        return all;
    }
  }

  Future<void> _payBooking(int bookingId) async {
    setState(() => _payingIds.add(bookingId));
    try {
      final result = await BookingService.createPayment(bookingId);
      final paymentData = result['payment'] as Map<String, dynamic>?;
      final url = paymentData?['redirectUrl'] as String?
          ?? result['redirectUrl'] as String?
          ?? result['snap_redirect_url'] as String?;
      if (url == null) throw Exception('Gagal mendapatkan link pembayaran');
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Tidak dapat membuka halaman pembayaran');
      }
    } catch (e) {
      if (mounted) showSnackBar(context, e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _payingIds.remove(bookingId));
    }
  }

  Future<void> _syncBooking(int bookingId) async {
    setState(() => _syncingIds.add(bookingId));
    try {
      final result = await BookingService.syncPayment(bookingId);
      final status = (result['booking']?['status'] ?? result['status'] ?? '').toString().toUpperCase();
      if (!mounted) return;
      if (status == 'PAID') {
        showSnackBar(context, 'Pembayaran berhasil dikonfirmasi!');
        await context.read<BookingProvider>().loadBookings();
      } else if (status == 'PENDING') {
        showSnackBar(context, 'Pembayaran masih diproses. Silakan coba lagi nanti.');
      } else if (['CANCELLED', 'EXPIRED', 'FAILED'].contains(status)) {
        showSnackBar(context, 'Pembayaran gagal atau kadaluwarsa.', isError: true);
        await context.read<BookingProvider>().loadBookings();
      }
    } catch (e) {
      if (mounted) showSnackBar(context, e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _syncingIds.remove(bookingId));
    }
  }

  Future<void> _cancelBooking(int bookingId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Batalkan Pemesanan', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Apakah Anda yakin ingin membatalkan pemesanan ini?',
            style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Tidak', style: TextStyle(color: AppColors.textSecondary))),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Ya, Batalkan'),
          ),
        ],
      ),
    );
    if (confirm == true && mounted) {
      try {
        await context.read<BookingProvider>().cancelBooking(bookingId);
        if (mounted) showSnackBar(context, 'Pemesanan berhasil dibatalkan');
      } catch (e) {
        if (mounted) showSnackBar(context, e.toString().replaceFirst('Exception: ', ''), isError: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight + 48),
        child: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
            boxShadow: [BoxShadow(color: Color(0x222563EB), blurRadius: 12, offset: Offset(0, 4))],
          ),
          child: Column(
            children: [
              AppBar(
                backgroundColor: Colors.transparent,
                elevation: 0,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
                title: const Text('Pemesanan Saya',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              TabBar(
                controller: _tabController,
                indicatorColor: Colors.white,
                indicatorWeight: 3,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white60,
                labelStyle: const TextStyle(fontWeight: FontWeight.bold),
                tabs: const [
                  Tab(text: 'Aktif'),
                  Tab(text: 'Selesai'),
                  Tab(text: 'Dibatalkan'),
                ],
              ),
            ],
          ),
        ),
      ),
      body: Consumer<BookingProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: 3,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, __) => const ShimmerBox(height: 130, width: double.infinity, borderRadius: 16),
            );
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () => provider.loadBookings(),
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildList(context, _filter(provider.bookings, 'active')),
                _buildList(context, _filter(provider.bookings, 'completed')),
                _buildList(context, _filter(provider.bookings, 'cancelled')),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildList(BuildContext context, List<Booking> bookings) {
    if (bookings.isEmpty) {
      return LayoutBuilder(
        builder: (ctx, c) => SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: c.maxHeight,
            child: const EmptyState(
              icon: Icons.airplane_ticket_outlined,
              title: 'Tidak ada pemesanan',
              subtitle: 'Pemesanan Anda akan muncul di sini',
            ),
          ),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: bookings.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (ctx, i) => TweenAnimationBuilder<double>(
        duration: Duration(milliseconds: 280 + i * 60),
        tween: Tween(begin: 0.0, end: 1.0),
        curve: Curves.easeOut,
        builder: (_, v, child) =>
            Opacity(opacity: v, child: Transform.translate(offset: Offset(0, 16 * (1 - v)), child: child)),
        child: _buildCard(ctx, bookings[i]),
      ),
    );
  }

  Widget _buildCard(BuildContext context, Booking booking) {
    final isPending = booking.status.toUpperCase() == 'PENDING';
    final isIssued = booking.ticket != null;
    final isPaid = booking.status.toUpperCase() == 'PAID' && !isIssued;

    // Count adult/child from passenger list
    final adults = booking.passengers.where((p) => p.type.toUpperCase() == 'ADULT').length;
    final children = booking.passengers.where((p) => p.type.toUpperCase() == 'CHILD').length;

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(booking.bookingCode,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary)),
                    const SizedBox(height: 2),
                    Text(booking.flight.airline,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              StatusBadge.fromStatus(booking.status),
            ],
          ),

          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              children: [
                Expanded(
                  flex: 0,
                  child: SizedBox(
                    width: 60,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(booking.flight.originCode,
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        Text(booking.flight.originCity,
                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  child: Row(
                    children: [
                      Expanded(child: Container(height: 1, color: AppColors.border)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Column(
                          children: [
                            const Icon(Icons.flight_rounded, color: AppColors.primary, size: 20),
                            Text(DateFormatter.formatTime(booking.flight.departureTime),
                                style: const TextStyle(fontSize: 10, color: AppColors.textHint)),
                          ],
                        ),
                      ),
                      Expanded(child: Container(height: 1, color: AppColors.border)),
                    ],
                  ),
                ),
                SizedBox(
                  width: 60,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(booking.flight.destinationCode,
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      Text(booking.flight.destinationCity,
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          textAlign: TextAlign.end, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_rounded, size: 13, color: AppColors.textHint),
                const SizedBox(width: 6),
                Text(DateFormatter.formatShortDate(booking.flight.departureTime),
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                if (booking.passengers.isNotEmpty) ...[
                  const SizedBox(width: 12),
                  const Icon(Icons.person_rounded, size: 13, color: AppColors.textHint),
                  const SizedBox(width: 4),
                  Text('${booking.passengers.length} Penumpang',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ],
            ),
          ),

          if (isPaid || isPending || isIssued) ...[
            const SizedBox(height: 12),
            if (isPaid)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    SizedBox(width: 8, height: 8, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                    SizedBox(width: 8),
                    Text('Menunggu Penerbitan Tiket...', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  ],
                ),
              ),
            if (isIssued)
              OutlinedButton.icon(
                onPressed: () =>
                    Navigator.of(context).pushNamed('/e-ticket', arguments: {'booking': booking}),
                icon: const Icon(Icons.airplane_ticket_outlined, size: 16),
                label: const Text('Lihat E-Tiket'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(38),
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            if (isPending) ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).pushNamed(
                        '/booking-seat',
                        arguments: {
                          'flightId': booking.flight.id.toString(),
                          'adults': adults > 0 ? adults : 1,
                          'children': children,
                          'existingBookingId': booking.id,
                        },
                      ),
                      icon: const Icon(Icons.event_seat_outlined, size: 16),
                      label: const Text('Ubah Kursi'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).pushNamed(
                        '/booking-passenger',
                        arguments: {
                          'flightId': booking.flight.id.toString(),
                          'adults': adults > 0 ? adults : 1,
                          'children': children,
                          'selectedSeats': [],
                          'seatIds': [],
                          'extraPrice': 0,
                          'existingBookingId': booking.id,
                        },
                      ),
                      icon: const Icon(Icons.person_outline, size: 16),
                      label: const Text('Ubah Penumpang'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _payingIds.contains(booking.id) ? null : () => _payBooking(booking.id),
                      icon: _payingIds.contains(booking.id)
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.payment_rounded, size: 16),
                      label: const Text('Bayar Sekarang'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _syncingIds.contains(booking.id) ? null : () => _syncBooking(booking.id),
                      icon: _syncingIds.contains(booking.id)
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                          : const Icon(Icons.sync_rounded, size: 16),
                      label: const Text('Cek Status'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => _cancelBooking(booking.id),
                icon: const Icon(Icons.cancel_outlined, size: 16),
                label: const Text('Batalkan Pemesanan'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(38),
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

