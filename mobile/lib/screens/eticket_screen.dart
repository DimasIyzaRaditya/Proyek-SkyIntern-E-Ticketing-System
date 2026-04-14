import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/booking_model.dart';
import '../services/api_client.dart';
import '../services/booking_service.dart';
import '../utils/app_theme.dart';
import '../utils/formatters.dart';
import '../utils/ticket_download.dart';

class ETicketScreen extends StatefulWidget {
  const ETicketScreen({super.key});

  @override
  State<ETicketScreen> createState() => _ETicketScreenState();
}

class _ETicketScreenState extends State<ETicketScreen> {
  bool _isChecking = false;
  bool _isDownloading = false;
  bool _isLoadingFromCode = false;
  bool _isRouteArgsHandled = false;
  String? _loadFromCodeError;
  Booking? _resolvedBooking;

  String _formatDateEn(String raw) {
    try {
      final dt = DateTime.parse(raw);
      return DateFormat('EEEE, d MMMM yyyy', 'en_US').format(dt);
    } catch (_) {
      return raw;
    }
  }

  String _passengerFullName(Booking booking) {
    if (booking.passengers.isEmpty) return '-';
    final p = booking.passengers.first;
    final fullName = '${p.firstName} ${p.lastName}'.trim();
    if (p.title.trim().isNotEmpty) {
      return '${p.title} $fullName'.trim();
    }
    return fullName;
  }

  Future<void> _checkTicket(Booking booking) async {
    if (_isChecking) return;
    setState(() => _isChecking = true);
    try {
      final result = await BookingService.verifyBooking(booking.bookingCode);
      final data = result['booking'] as Map<String, dynamic>?;

      if (!mounted) return;

      final status = data?['status']?.toString() ?? booking.status;
      final flight = data?['flight'] as Map<String, dynamic>?;
      final airlineName = (flight?['airline'] as Map<String, dynamic>?)?['name']?.toString() ?? booking.flight.airline;
      final flightNumber = flight?['flightNumber']?.toString() ?? booking.flight.flightNumber;

      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Status Tiket'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Booking Code: ${booking.bookingCode}'),
              const SizedBox(height: 6),
              Text('Status: $status'),
              const SizedBox(height: 6),
              Text('Maskapai: $airlineName'),
              const SizedBox(height: 6),
              Text('No. Penerbangan: $flightNumber'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Tutup'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _isChecking = false);
    }
  }

  Future<void> _downloadTicket(Booking booking) async {
    final ticketId = booking.ticket?.id;
    if (ticketId == null || _isDownloading) return;

    setState(() => _isDownloading = true);
    try {
      final downloaded = await BookingService.downloadTicket(ticketId);
      final saved = await saveTicketFile(
        booking: booking,
        downloaded: downloaded,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            saved.opened
                ? 'E-tiket berhasil diunduh dan dibuka.'
                : 'E-tiket berhasil diunduh: ${saved.filePath}',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _isDownloading = false);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isRouteArgsHandled) return;
    _isRouteArgsHandled = true;

    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final fromArgs = args?['booking'] as Booking?;
    if (fromArgs != null) {
      _resolvedBooking = fromArgs;
      return;
    }

    final codeArg = (args?['code'] ?? '').toString().trim();
    if (codeArg.isNotEmpty) {
      _loadBookingByCode(codeArg);
    }
  }

  Future<void> _loadBookingByCode(String code) async {
    setState(() {
      _isLoadingFromCode = true;
      _loadFromCodeError = null;
    });

    try {
      final result = await BookingService.verifyBooking(code);
      final raw = (result['booking'] as Map<String, dynamic>?) ?? result;
      final booking = Booking.fromJson(raw);

      if (!mounted) return;
      setState(() {
        _resolvedBooking = booking;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadFromCodeError =
            e.toString().replaceFirst('Exception: ', '').trim();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingFromCode = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingFromCode) {
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
              title: const Text('E-Tiket', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_loadFromCodeError != null) {
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
              title: const Text('E-Tiket', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              'Gagal membuka e-tiket: $_loadFromCodeError',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    final booking = _resolvedBooking;

    if (booking == null) {
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
              leading: Builder(builder: (ctx) => IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                onPressed: () => Navigator.pop(ctx),
              )),
              title: const Text('E-Tiket', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
        body: const Center(child: Text('Data tiket tidak ditemukan')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
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
            leading: Builder(builder: (ctx) => IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(ctx),
            )),
            title: const Text('E-Tiket', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isChecking ? null : () => _checkTicket(booking),
                    icon: _isChecking
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.verified_outlined),
                    label: Text(_isChecking ? 'Mengecek...' : 'Cek Tiket'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(44),
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: (booking.ticket == null || _isDownloading)
                        ? null
                        : () => _downloadTicket(booking),
                    icon: _isDownloading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.download_rounded),
                    label: Text(_isDownloading ? 'Mengunduh...' : 'Unduh Tiket'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(44),
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: const Text(
                'Jangan lupa membawa e-tiket ini dan identitas valid saat check-in di bandara.',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF1E3A8A),
                ),
              ),
            ),
            const SizedBox(height: 24),
            _buildTicketDocument(booking),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketDocument(Booking booking) {
    final f = booking.flight;
    final passenger = _passengerFullName(booking);
    final docType = booking.passengers.isNotEmpty ? booking.passengers.first.documentType : null;
    final docNumber = booking.passengers.isNotEmpty ? booking.passengers.first.documentNumber : null;
    final seatLabel = (booking.selectedSeats == null || booking.selectedSeats!.trim().isEmpty)
        ? '-'
        : booking.selectedSeats!.trim();

    // QR points to web verify page; web will attempt to open mobile app via deep link.
    final webBase = ApiClient.baseUrl.replaceFirst(':3000', ':3001');
    final qrLink =
      '$webBase/bookings/verify?code=${Uri.encodeComponent(booking.bookingCode)}&openApp=1';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(color: Color(0x1F000000), blurRadius: 16, offset: Offset(0, 6)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Stack(
              children: [
                Positioned.fill(
                  child: Center(
                    child: Transform.rotate(
                      angle: -0.55,
                      child: Opacity(
                        opacity: 0.05,
                        child: Text(
                          f.airline.isEmpty ? 'SkyIntern' : f.airline,
                          style: const TextStyle(
                            fontSize: 44,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 4,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'E-Ticket',
                                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Penerbangan Pergi / Departure Flight',
                                  style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            width: 160,
                            height: 70,
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Color(0xFF1D4ED8), Color(0xFF2563EB), Color(0xFF60A5FA)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(60),
                                topRight: Radius.circular(12),
                              ),
                            ),
                            child: const Padding(
                              padding: EdgeInsets.only(right: 14, top: 12),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Icon(Icons.flight, size: 16, color: Colors.white),
                                  SizedBox(width: 6),
                                  Text(
                                    'SkyIntern',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: Color(0xFFE5E7EB)),
                      const SizedBox(height: 14),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 88,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                CircleAvatar(
                                  radius: 21,
                                  backgroundColor: const Color(0xFFEFF6FF),
                                  child: Text(
                                    f.airline.isEmpty ? 'S' : f.airline[0].toUpperCase(),
                                    style: const TextStyle(color: Color(0xFF1D4ED8), fontWeight: FontWeight.w900, fontSize: 18),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(f.airline, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                                Text(f.flightNumber, style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                                const Text('Economy', style: TextStyle(fontSize: 11, color: Color(0xFF6B7280))),
                              ],
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _formatDateEn(f.departureTime),
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151)),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Column(
                                      children: [
                                        Container(
                                          width: 10,
                                          height: 10,
                                          decoration: const BoxDecoration(color: Color(0xFF2563EB), shape: BoxShape.circle),
                                        ),
                                        Container(width: 1, height: 40, color: const Color(0xFFBFDBFE)),
                                        Container(
                                          width: 10,
                                          height: 10,
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            shape: BoxShape.circle,
                                            border: Border.all(color: const Color(0xFF3B82F6), width: 2),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                DateFormatter.formatTime(f.departureTime),
                                                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  f.originCity,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                                ),
                                              ),
                                            ],
                                          ),
                                          Text(
                                            f.originName.isEmpty ? f.originCity : f.originName,
                                            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                                          ),
                                          const SizedBox(height: 10),
                                          Row(
                                            children: [
                                              Text(
                                                DateFormatter.formatTime(f.arrivalTime),
                                                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  f.destinationCity,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                                ),
                                              ),
                                            ],
                                          ),
                                          Text(
                                            f.destinationName.isEmpty ? f.destinationCity : f.destinationName,
                                            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          SizedBox(
                            width: 92,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('BOOKING ID', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF), letterSpacing: 1.3)),
                                const SizedBox(height: 2),
                                Text(booking.bookingCode, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
                                if ((docType ?? '').trim().isNotEmpty && (docNumber ?? '').trim().isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Text(docType!.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF), letterSpacing: 1.1)),
                                  const SizedBox(height: 1),
                                  Text(docNumber!, textAlign: TextAlign.right, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                                ],
                                if (booking.totalPrice > 0) ...[
                                  const SizedBox(height: 10),
                                  const Text('TOTAL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF), letterSpacing: 1.1)),
                                  const SizedBox(height: 1),
                                  Text(
                                    CurrencyFormatter.formatCurrency(booking.totalPrice),
                                    textAlign: TextAlign.right,
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF1D4ED8)),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: Color(0xFFE5E7EB)),
                      const SizedBox(height: 12),
                      Row(
                        children: const [
                          Expanded(child: _TipItem(icon: Icons.badge_outlined, text: 'Tunjukkan E-Ticket dan identitas valid saat check-in.')),
                          SizedBox(width: 8),
                          Expanded(child: _TipItem(icon: Icons.schedule_outlined, text: 'Check-in minimal 90 menit sebelum keberangkatan.')),
                          SizedBox(width: 8),
                          Expanded(child: _TipItem(icon: Icons.access_time_outlined, text: 'Semua waktu tertera adalah waktu setempat.')),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: Color(0xFFE5E7EB)),
                      const SizedBox(height: 12),
                      Table(
                        columnWidths: const {
                          0: FixedColumnWidth(32),
                          1: FlexColumnWidth(2.5),
                          2: FlexColumnWidth(1.4),
                          3: FlexColumnWidth(1.4),
                        },
                        children: [
                          const TableRow(
                            children: [
                              Padding(
                                padding: EdgeInsets.only(bottom: 8),
                                child: Text('No.', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF), letterSpacing: 1.1)),
                              ),
                              Padding(
                                padding: EdgeInsets.only(bottom: 8),
                                child: Text('Penumpang', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF), letterSpacing: 1.1)),
                              ),
                              Padding(
                                padding: EdgeInsets.only(bottom: 8),
                                child: Text('Kursi', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF), letterSpacing: 1.1)),
                              ),
                              Padding(
                                padding: EdgeInsets.only(bottom: 8),
                                child: Text('Kelas', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF), letterSpacing: 1.1)),
                              ),
                            ],
                          ),
                          TableRow(
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(top: 8),
                                child: Text('1', style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                              ),
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  passenger,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                  seatLabel,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
                                ),
                              ),
                              const Padding(
                                padding: EdgeInsets.only(top: 8),
                                child: Text('Economy', style: TextStyle(fontSize: 12, color: Color(0xFF374151))),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      const Divider(height: 1, color: Color(0xFFE5E7EB)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Container(
                            decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE5E7EB))),
                            padding: const EdgeInsets.all(6),
                            child: QrImageView(
                              data: qrLink,
                              version: QrVersions.auto,
                              size: 96,
                              backgroundColor: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('KODE BOOKING', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF9CA3AF), letterSpacing: 1.1)),
                                const SizedBox(height: 2),
                                Text(
                                  booking.bookingCode,
                                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 3.5),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Pindai QR di mesin self check-in atau tunjukkan ke petugas bandara.',
                                  style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFF3F4F6))),
                color: Color(0xFFF9FAFB),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              child: const Text(
                'Electronic Ticket (E-Ticket) Penerbangan · SkyIntern E-Ticketing System',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF), fontStyle: FontStyle.italic),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TipItem extends StatelessWidget {
  final IconData icon;
  final String text;

  const _TipItem({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFE5E7EB)),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 17, color: const Color(0xFF6B7280)),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              text,
              style: const TextStyle(fontSize: 11, color: Color(0xFF4B5563), height: 1.35),
            ),
          ),
        ),
      ],
    );
  }
}
