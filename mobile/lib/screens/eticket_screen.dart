import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/booking_model.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../utils/formatters.dart';

class ETicketScreen extends StatelessWidget {  const ETicketScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final booking = args?['booking'] as Booking?;

    if (booking == null) {
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
          children: [
            _buildTicketCard(booking),
            const SizedBox(height: 24),
            _buildQrSection(booking),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketCard(Booking booking) {
    final f = booking.flight;
    return Card(
      elevation: 4,
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade600,
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Column(
              children: [
                const Text('BOARDING PASS',
                    style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        letterSpacing: 2)),
                const SizedBox(height: 4),
                Text(f.airline,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold)),
                Text(f.flightNumber,
                    style:
                        const TextStyle(color: Colors.white70, fontSize: 13)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(f.originCode,
                          style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.bold)),
                      Text(f.originCity,
                          style:
                              TextStyle(color: Colors.grey.shade600)),
                      const SizedBox(height: 4),
                      Text(
                          DateFormatter.formatTime(f.departureTime),
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                Column(
                  children: [
                    const Icon(Icons.flight,
                        color: Colors.blue, size: 28),
                    const SizedBox(height: 4),
                    Text(
                        DateFormatter.formatShortDate(
                            f.departureTime),
                        style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade600)),
                  ],
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(f.destinationCode,
                          style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.bold)),
                      Text(f.destinationCity,
                          style:
                              TextStyle(color: Colors.grey.shade600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _notch(isLeft: true),
                Expanded(child: _dashedLine()),
                _notch(isLeft: false),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Penumpang',
                    style:
                        TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...booking.passengers.map((p) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.person,
                              size: 16, color: Colors.grey),
                          const SizedBox(width: 8),
                          Text('${p.firstName} ${p.lastName}'),
                          const Spacer(),
                          Text(
                              p.type == 'ADULT'
                                  ? 'Dewasa'
                                  : 'Anak',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600)),
                        ],
                      ),
                    )),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _infoItem('Kode Pemesanan',
                        booking.bookingCode),
                    const SizedBox(width: 24),
                    _infoItem('Status', booking.status),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQrSection(Booking booking) {
    return Card(
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text('Scan QR Code',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            QrImageView(
              data: booking.bookingCode,
              version: QrVersions.auto,
              size: 200,
              backgroundColor: Colors.white,
            ),
            const SizedBox(height: 12),
            Text(booking.bookingCode,
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 3)),
            const SizedBox(height: 4),
            Text('Tunjukkan QR code ini kepada petugas bandara',
                style: TextStyle(
                    fontSize: 12, color: Colors.grey.shade600),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _infoItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(
                fontSize: 11, color: Colors.grey.shade600)),
        Text(value,
            style: const TextStyle(fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _notch({required bool isLeft}) {
    return Transform.translate(
      offset: Offset(isLeft ? -16 : 16, 0),
      child: Container(
        width: 16,
        height: 16,
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
        ),
      ),
    );
  }

  Widget _dashedLine() {
    return SizedBox(
      height: 1,
      child: CustomPaint(painter: _DashedLinePainter()),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey.shade300
      ..strokeWidth = 1;
    double x = 0;
    while (x < size.width) {
      canvas.drawLine(Offset(x, 0), Offset(x + 6, 0), paint);
      x += 10;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}
