import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/booking_provider.dart';
import '../services/booking_service.dart';
import '../models/booking_model.dart';
import '../models/flight_model.dart';
import '../utils/app_theme.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import '../utils/ticket_download.dart';
import '../widgets/common_widgets.dart';
import '../widgets/mobile_side_menu.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  final Set<int> _syncingIds = {};
  final Set<int> _downloadingTicketIds = {};
  Timer? _pollTimer;
  String _statusFilter = 'All';
  String _sortDirection = 'desc';
  int _page = 1;
  int _perPage = 10;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadBookings();
      _startPolling();
    });
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (mounted) _loadBookings();
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadBookings() async {
    await context.read<BookingProvider>().loadBookings(
          page: _page,
          limit: _perPage,
          statusFilter: _statusFilter,
          sortDirection: _sortDirection,
        );
  }

  Future<void> _payBooking(Booking booking) async {
    final flight = FlightCardItem(
      id: booking.flight.id.toString(),
      flightNumber: booking.flight.flightNumber,
      airline: booking.flight.airline,
      logo: '✈️',
      aircraft: 'Aircraft',
      origin: booking.flight.originCity,
      destination: booking.flight.destinationCity,
      departureTime: DateFormatter.formatTime(booking.flight.departureTime),
      arrivalTime: DateFormatter.formatTime(booking.flight.arrivalTime),
      duration: '-',
      price: booking.totalPrice,
      facilities: const [],
    );

    final passengers = booking.passengers
        .map((p) => {
              'title': p.title,
              'firstName': p.firstName,
              'lastName': p.lastName,
              'type': p.type,
            })
        .toList();

    await Navigator.of(context).pushNamed(
      '/booking-payment',
      arguments: {
        'flightId': booking.flight.id,
        'flight': flight,
        'passengers': passengers,
        'seatIds': const <int>[],
        'totalPrice': booking.totalPrice,
        'existingBookingId': booking.id,
      },
    );

    if (mounted) {
      await _loadBookings();
    }
  }

  Future<void> _syncBooking(int bookingId) async {
    setState(() => _syncingIds.add(bookingId));
    try {
      final result = await BookingService.syncPayment(bookingId);
      final status = (result['booking']?['status'] ?? result['status'] ?? '')
          .toString()
          .toUpperCase();
      if (!mounted) return;
      if (status == 'PAID') {
        showSnackBar(context, 'Pembayaran berhasil dikonfirmasi!');
        await _loadBookings();
      } else if (status == 'PENDING') {
        showSnackBar(
          context,
          'Pembayaran masih diproses. Silakan coba lagi nanti.',
        );
      } else if (['CANCELLED', 'EXPIRED', 'FAILED'].contains(status)) {
        showSnackBar(
          context,
          'Pembayaran gagal atau kadaluwarsa.',
          isError: true,
        );
        await _loadBookings();
      }
    } catch (e) {
      if (mounted) {
        showSnackBar(
          context,
          e.toString().replaceFirst('Exception: ', ''),
          isError: true,
        );
      }
    } finally {
      if (mounted) setState(() => _syncingIds.remove(bookingId));
    }
  }

  Future<void> _cancelBooking(int bookingId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Batalkan Pemesanan',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Apakah Anda yakin ingin membatalkan pemesanan ini?',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'Tidak',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('Ya, Batalkan'),
          ),
        ],
      ),
    );
    if (confirm == true && mounted) {
      try {
        await context.read<BookingProvider>().cancelBooking(bookingId);
        if (mounted) showSnackBar(context, 'Pemesanan berhasil dibatalkan');
        await _loadBookings();
      } catch (e) {
        if (mounted) {
          showSnackBar(
            context,
            e.toString().replaceFirst('Exception: ', ''),
            isError: true,
          );
        }
      }
    }
  }

  Future<void> _downloadTicket(Booking booking) async {
    final ticketId = booking.ticket?.id;
    if (ticketId == null || _downloadingTicketIds.contains(ticketId)) return;

    setState(() => _downloadingTicketIds.add(ticketId));
    try {
      final downloaded = await BookingService.downloadTicket(ticketId);
      final saved = await saveTicketFile(
        booking: booking,
        downloaded: downloaded,
      );

      if (!mounted) return;
      showSnackBar(
        context,
        saved.opened
            ? 'E-tiket berhasil diunduh dan dibuka.'
            : 'E-tiket berhasil diunduh ke ${saved.filePath}',
      );
    } catch (e) {
      if (mounted) {
        showSnackBar(
          context,
          e.toString().replaceFirst('Exception: ', ''),
          isError: true,
        );
      }
    } finally {
      if (mounted) {
        setState(() => _downloadingTicketIds.remove(ticketId));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        flexibleSpace: Container(
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
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Pemesanan Saya',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            tooltip: 'Menu',
            icon: const Icon(Icons.menu_rounded, color: Colors.white),
            onPressed: () =>
                MobileSideMenu.show(context, activeItem: 'Bookings'),
          ),
        ],
      ),
      body: Consumer<BookingProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: 3,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, __) => const ShimmerBox(
                height: 130,
                width: double.infinity,
                borderRadius: 16,
              ),
            );
          }
          return Column(
            children: [
              _buildFilterBar(context),
              const SizedBox(height: 10),
              Expanded(
                child: RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: _loadBookings,
                  child: _buildList(
                    context,
                    provider.bookings,
                    paginationTotal:
                        provider.pagination?.totalItems ?? provider.bookings.length,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildList(
    BuildContext context,
    List<Booking> bookings, {
    required int paginationTotal,
  }) {
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

    return Column(
      children: [
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: bookings.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (ctx, i) => TweenAnimationBuilder<double>(
              duration: Duration(milliseconds: 280 + i * 60),
              tween: Tween(begin: 0.0, end: 1.0),
              curve: Curves.easeOut,
              builder: (_, v, child) => Opacity(
                opacity: v,
                child: Transform.translate(
                  offset: Offset(0, 16 * (1 - v)),
                  child: child,
                ),
              ),
              child: _buildCard(ctx, bookings[i]),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: ListPaginationBar(
            currentPage: _page,
            totalItems: paginationTotal,
            itemsPerPage: _perPage,
            onPageChanged: _handlePageChange,
          ),
        ),
      ],
    );
  }

  Widget _buildFilterBar(BuildContext context) {
    final fieldDecoration = InputDecoration(
      border: const OutlineInputBorder(),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      filled: true,
      fillColor: Colors.white,
    );

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadows.card,
      ),
      child: Column(
        children: [
          DropdownButtonFormField<String>(
            value: _statusFilter,
            decoration: fieldDecoration.copyWith(labelText: 'Status'),
            items: const [
              DropdownMenuItem(value: 'All', child: Text('Semua')),
              DropdownMenuItem(value: 'Pending', child: Text('Pending')),
              DropdownMenuItem(value: 'Paid', child: Text('Dibayar')),
              DropdownMenuItem(value: 'Issued', child: Text('Issued')),
              DropdownMenuItem(value: 'Cancelled', child: Text('Dibatalkan')),
            ],
            onChanged: (v) {
              if (v == null) return;
              setState(() {
                _statusFilter = v;
                _page = 1;
              });
              _loadBookings();
            },
          ),
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, constraints) {
              final isCompact = constraints.maxWidth < 420;

              final sortField = DropdownButtonFormField<String>(
                value: _sortDirection,
                decoration: fieldDecoration.copyWith(labelText: 'Urutkan'),
                items: const [
                  DropdownMenuItem(value: 'desc', child: Text('Terbaru')),
                  DropdownMenuItem(value: 'asc', child: Text('Terlama')),
                ],
                onChanged: (v) {
                  if (v == null) return;
                  setState(() {
                    _sortDirection = v;
                    _page = 1;
                  });
                  _loadBookings();
                },
              );

              final rowsField = DropdownButtonFormField<int>(
                value: _perPage,
                decoration: fieldDecoration.copyWith(labelText: 'Tampilkan'),
                items: const [
                  DropdownMenuItem(value: 10, child: Text('10')),
                  DropdownMenuItem(value: 20, child: Text('20')),
                  DropdownMenuItem(value: 50, child: Text('50')),
                  DropdownMenuItem(value: 100, child: Text('100')),
                ],
                onChanged: (v) {
                  if (v == null) return;
                  setState(() {
                    _perPage = v;
                    _page = 1;
                  });
                  _loadBookings();
                },
              );

              if (isCompact) {
                return Column(
                  children: [sortField, const SizedBox(height: 10), rowsField],
                );
              }

              return Row(
                children: [
                  Expanded(flex: 3, child: sortField),
                  const SizedBox(width: 10),
                  Expanded(flex: 2, child: rowsField),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  void _handlePageChange(int next) {
    setState(() => _page = next);
    _loadBookings();
  }

  Widget _buildCard(BuildContext context, Booking booking) {
    final isPending = booking.status.toUpperCase() == 'PENDING';
    final isIssued = booking.ticket != null;
    final isPaid = booking.status.toUpperCase() == 'PAID' && !isIssued;

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
                    Text(
                      booking.bookingCode,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      booking.flight.airline,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
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
                        Text(
                          booking.flight.originCode,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          booking.flight.originCity,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(height: 1, color: AppColors.border),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.flight_rounded,
                              color: AppColors.primary,
                              size: 20,
                            ),
                            Text(
                              DateFormatter.formatTime(
                                booking.flight.departureTime,
                              ),
                              style: const TextStyle(
                                fontSize: 10,
                                color: AppColors.textHint,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Container(height: 1, color: AppColors.border),
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  width: 60,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        booking.flight.destinationCode,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        booking.flight.destinationCity,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                        textAlign: TextAlign.end,
                        overflow: TextOverflow.ellipsis,
                      ),
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
                const Icon(
                  Icons.calendar_today_rounded,
                  size: 13,
                  color: AppColors.textHint,
                ),
                const SizedBox(width: 6),
                Text(
                  DateFormatter.formatShortDate(booking.flight.departureTime),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (booking.passengers.isNotEmpty) ...[
                  const SizedBox(width: 12),
                  const Icon(
                    Icons.person_rounded,
                    size: 13,
                    color: AppColors.textHint,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${booking.passengers.length} Penumpang',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
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
                    SizedBox(
                      width: 8,
                      height: 8,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Menunggu Penerbitan Tiket...',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            if (isIssued) ...[
              OutlinedButton.icon(
                onPressed: () => Navigator.of(
                  context,
                ).pushNamed('/e-ticket', arguments: {'booking': booking}),
                icon: const Icon(Icons.airplane_ticket_outlined, size: 16),
                label: const Text('Lihat Tiket'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(38),
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              ElevatedButton.icon(
                onPressed: _downloadingTicketIds.contains(booking.ticket!.id)
                    ? null
                    : () => _downloadTicket(booking),
                icon: _downloadingTicketIds.contains(booking.ticket!.id)
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.download_rounded, size: 16),
                label: Text(
                  _downloadingTicketIds.contains(booking.ticket!.id)
                      ? 'Mengunduh...'
                      : 'Unduh Tiket',
                ),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(38),
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
            if (isPending) ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _payBooking(booking),
                      icon: const Icon(Icons.payment_rounded, size: 16),
                      label: const Text('Bayar Sekarang'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _syncingIds.contains(booking.id)
                          ? null
                          : () => _syncBooking(booking.id),
                      icon: _syncingIds.contains(booking.id)
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primary,
                              ),
                            )
                          : const Icon(Icons.sync_rounded, size: 16),
                      label: const Text('Cek Status'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
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
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}
