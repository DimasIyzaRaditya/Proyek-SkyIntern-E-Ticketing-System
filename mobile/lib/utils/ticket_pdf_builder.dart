import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../models/booking_model.dart';

String _safe(String value) {
  final trimmed = value.trim();
  return trimmed.isEmpty ? '-' : trimmed;
}

String _passengerName(Booking booking) {
  if (booking.passengers.isEmpty) return '-';
  final p = booking.passengers.first;
  final full = '${p.firstName} ${p.lastName}'.trim();
  if (p.title.trim().isEmpty) return _safe(full);
  return _safe('${p.title} $full');
}

String _seatLabel(Booking booking) {
  final selected = booking.selectedSeats?.trim() ?? '';
  return selected.isEmpty ? '-' : selected;
}

String _timeOf(String raw) {
  try {
    final dt = DateTime.parse(raw).toLocal();
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  } catch (_) {
    return raw;
  }
}

String _dateOf(String raw) {
  try {
    final dt = DateTime.parse(raw).toLocal();
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${dt.day.toString().padLeft(2, '0')} ${months[dt.month - 1]} ${dt.year}';
  } catch (_) {
    return raw;
  }
}

String _currency(int value) {
  final sign = value < 0 ? '-' : '';
  final n = value.abs().toString();
  final chars = n.split('').reversed.toList();
  final out = <String>[];
  for (var i = 0; i < chars.length; i++) {
    if (i > 0 && i % 3 == 0) out.add('.');
    out.add(chars[i]);
  }
  return '${sign}Rp ${out.reversed.join()}';
}

pw.Widget _tipWithBadge({
  required String badge,
  required String text,
}) {
  return pw.Expanded(
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Container(
          width: 28,
          height: 28,
          alignment: pw.Alignment.center,
          decoration: pw.BoxDecoration(
            shape: pw.BoxShape.circle,
            border: pw.Border.all(color: PdfColor.fromInt(0xFFD1D5DB)),
          ),
          child: pw.Text(
            badge,
            textAlign: pw.TextAlign.center,
            style: pw.TextStyle(
              fontSize: 8,
              color: PdfColor.fromInt(0xFF6B7280),
              fontWeight: pw.FontWeight.bold,
            ),
          ),
        ),
        pw.SizedBox(width: 6),
        pw.Expanded(
          child: pw.Text(
            text,
            style: pw.TextStyle(fontSize: 9, color: PdfColor.fromInt(0xFF4B5563)),
          ),
        ),
      ],
    ),
  );
}

pw.Widget _planeMark() {
  return pw.SizedBox(
    width: 14,
    height: 14,
    child: pw.Stack(
      children: [
        pw.Positioned(
          left: 1,
          top: 6,
          child: pw.Container(width: 10, height: 1.6, color: PdfColors.white),
        ),
        pw.Positioned(
          left: 5,
          top: 1,
          child: pw.Transform.rotate(
            angle: 0.8,
            child: pw.Container(width: 6, height: 1.4, color: PdfColors.white),
          ),
        ),
        pw.Positioned(
          left: 5,
          top: 11,
          child: pw.Transform.rotate(
            angle: -0.8,
            child: pw.Container(width: 6, height: 1.4, color: PdfColors.white),
          ),
        ),
      ],
    ),
  );
}

Future<List<int>> buildStyledTicketPdf(Booking booking) async {
  final f = booking.flight;
  final passenger = _passengerName(booking);
  final docType = booking.passengers.isNotEmpty ? (booking.passengers.first.documentType ?? '').trim() : '';
  final docNumber = booking.passengers.isNotEmpty ? (booking.passengers.first.documentNumber ?? '').trim() : '';
  final total = booking.totalPrice;

  final pdf = pw.Document();

  pdf.addPage(
    pw.Page(
      pageFormat: PdfPageFormat.a4.landscape,
      margin: const pw.EdgeInsets.all(16),
      build: (context) {
        return pw.Container(
          decoration: pw.BoxDecoration(
            color: PdfColors.white,
            border: pw.Border.all(color: PdfColor.fromInt(0xFFE5E7EB), width: 1),
            borderRadius: pw.BorderRadius.circular(12),
          ),
          child: pw.Stack(
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.stretch,
                children: [
              pw.Padding(
                padding: const pw.EdgeInsets.fromLTRB(18, 14, 18, 12),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            'E-ticket',
                            style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold, color: PdfColor.fromInt(0xFF111827)),
                          ),
                          pw.SizedBox(height: 2),
                          pw.Text(
                            'Penerbangan Pergi / Departure Flight',
                            style: pw.TextStyle(fontSize: 10, color: PdfColor.fromInt(0xFF6B7280)),
                          ),
                          pw.SizedBox(height: 2),
                          pw.Text(
                            'Status: ${_safe(booking.status)}',
                            style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColor.fromInt(0xFF374151)),
                          ),
                        ],
                      ),
                    ),
                    pw.Container(
                      width: 170,
                      height: 56,
                      padding: const pw.EdgeInsets.symmetric(horizontal: 12),
                      decoration: pw.BoxDecoration(
                        gradient: pw.LinearGradient(
                          colors: [
                            PdfColor.fromInt(0xFF1D4ED8),
                            PdfColor.fromInt(0xFF2563EB),
                            PdfColor.fromInt(0xFF60A5FA),
                          ],
                        ),
                        borderRadius: const pw.BorderRadius.only(
                          topRight: pw.Radius.circular(8),
                          bottomLeft: pw.Radius.circular(44),
                        ),
                      ),
                      child: pw.Align(
                        alignment: pw.Alignment.topRight,
                        child: pw.Padding(
                          padding: const pw.EdgeInsets.only(top: 8),
                          child: pw.Row(
                            mainAxisSize: pw.MainAxisSize.min,
                            children: [
                              pw.Text(
                                '',
                              ),
                              _planeMark(),
                              pw.SizedBox(width: 6),
                              pw.Text(
                                'SkyIntern',
                                style: pw.TextStyle(color: PdfColors.white, fontWeight: pw.FontWeight.bold, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              pw.Container(height: 1, color: PdfColor.fromInt(0xFFE5E7EB)),
              pw.Padding(
                padding: const pw.EdgeInsets.all(18),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Container(
                      width: 86,
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Container(
                            width: 38,
                            height: 38,
                            alignment: pw.Alignment.center,
                            decoration: pw.BoxDecoration(
                              color: PdfColor.fromInt(0xFFEFF6FF),
                              shape: pw.BoxShape.circle,
                            ),
                            child: pw.Text(
                              f.airline.isEmpty ? 'S' : f.airline[0].toUpperCase(),
                              style: pw.TextStyle(color: PdfColor.fromInt(0xFF1D4ED8), fontWeight: pw.FontWeight.bold, fontSize: 16),
                            ),
                          ),
                          pw.SizedBox(height: 8),
                          pw.Text(_safe(f.airline), style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                          pw.Text(_safe(f.flightNumber), style: pw.TextStyle(fontSize: 9, color: PdfColor.fromInt(0xFF6B7280))),
                          pw.Text('Economy', style: pw.TextStyle(fontSize: 9, color: PdfColor.fromInt(0xFF6B7280))),
                        ],
                      ),
                    ),
                    pw.SizedBox(width: 10),
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            _dateOf(f.departureTime),
                            style: pw.TextStyle(fontSize: 10, color: PdfColor.fromInt(0xFF374151), fontWeight: pw.FontWeight.bold),
                          ),
                          pw.SizedBox(height: 10),
                          pw.Row(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Column(
                                children: [
                                  pw.Container(width: 8, height: 8, decoration: pw.BoxDecoration(color: PdfColor.fromInt(0xFF2563EB), shape: pw.BoxShape.circle)),
                                  pw.Container(width: 1, height: 34, color: PdfColor.fromInt(0xFFBFDBFE)),
                                  pw.Container(
                                    width: 8,
                                    height: 8,
                                    decoration: pw.BoxDecoration(
                                      color: PdfColors.white,
                                      border: pw.Border.all(color: PdfColor.fromInt(0xFF3B82F6), width: 2),
                                      shape: pw.BoxShape.circle,
                                    ),
                                  ),
                                ],
                              ),
                              pw.SizedBox(width: 8),
                              pw.Expanded(
                                child: pw.Column(
                                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                                  children: [
                                    pw.Row(
                                      children: [
                                        pw.Text(_timeOf(f.departureTime), style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
                                        pw.SizedBox(width: 8),
                                        pw.Text(_safe(f.originCity), style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                                      ],
                                    ),
                                    pw.Text(
                                      _safe(f.originName.isEmpty ? f.originCity : f.originName),
                                      style: pw.TextStyle(fontSize: 9, color: PdfColor.fromInt(0xFF6B7280), fontWeight: pw.FontWeight.bold),
                                    ),
                                    pw.SizedBox(height: 10),
                                    pw.Row(
                                      children: [
                                        pw.Text(_timeOf(f.arrivalTime), style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
                                        pw.SizedBox(width: 8),
                                        pw.Text(_safe(f.destinationCity), style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                                      ],
                                    ),
                                    pw.Text(
                                      _safe(f.destinationName.isEmpty ? f.destinationCity : f.destinationName),
                                      style: pw.TextStyle(fontSize: 9, color: PdfColor.fromInt(0xFF6B7280), fontWeight: pw.FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    pw.SizedBox(width: 10),
                    pw.Container(
                      width: 118,
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.end,
                        children: [
                          pw.Text('BOOKING ID', style: pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF9CA3AF), fontWeight: pw.FontWeight.bold)),
                          pw.SizedBox(height: 2),
                          pw.Text(_safe(booking.bookingCode), style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                          if (docType.isNotEmpty && docNumber.isNotEmpty) ...[
                            pw.SizedBox(height: 10),
                            pw.Text(docType, style: pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF9CA3AF), fontWeight: pw.FontWeight.bold)),
                            pw.SizedBox(height: 2),
                            pw.Text(docNumber, style: pw.TextStyle(fontSize: 10, color: PdfColor.fromInt(0xFF374151))),
                          ],
                          if (total > 0) ...[
                            pw.SizedBox(height: 10),
                            pw.Text('TOTAL', style: pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF9CA3AF), fontWeight: pw.FontWeight.bold)),
                            pw.SizedBox(height: 2),
                            pw.Text(_currency(total), style: pw.TextStyle(fontSize: 10, color: PdfColor.fromInt(0xFF1D4ED8), fontWeight: pw.FontWeight.bold)),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              pw.Container(height: 1, color: PdfColor.fromInt(0xFFE5E7EB)),
              pw.Padding(
                padding: const pw.EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                child: pw.Row(
                  children: [
                    _tipWithBadge(badge: 'DOC', text: 'Tunjukkan e-tiket dan identitas valid saat check-in.'),
                    pw.SizedBox(width: 8),
                    _tipWithBadge(badge: 'CHK', text: 'Check-in minimal 90 menit sebelum keberangkatan.'),
                    pw.SizedBox(width: 8),
                    _tipWithBadge(badge: 'TIME', text: 'Semua waktu tertera adalah waktu setempat.'),
                  ],
                ),
              ),
              pw.Container(height: 1, color: PdfColor.fromInt(0xFFE5E7EB)),
              pw.Padding(
                padding: const pw.EdgeInsets.fromLTRB(18, 10, 18, 14),
                child: pw.Column(
                  children: [
                    pw.Row(
                      children: [
                        pw.Expanded(flex: 1, child: pw.Text('No.', style: pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF9CA3AF), fontWeight: pw.FontWeight.bold))),
                        pw.Expanded(flex: 5, child: pw.Text('Penumpang', style: pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF9CA3AF), fontWeight: pw.FontWeight.bold))),
                        pw.Expanded(flex: 2, child: pw.Text('Kursi', style: pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF9CA3AF), fontWeight: pw.FontWeight.bold))),
                        pw.Expanded(flex: 2, child: pw.Text('Kelas', style: pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF9CA3AF), fontWeight: pw.FontWeight.bold))),
                      ],
                    ),
                    pw.SizedBox(height: 8),
                    pw.Row(
                      children: [
                        pw.Expanded(flex: 1, child: pw.Text('1', style: pw.TextStyle(fontSize: 10, color: PdfColor.fromInt(0xFF6B7280)))),
                        pw.Expanded(flex: 5, child: pw.Text(passenger, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: PdfColor.fromInt(0xFF111827)))),
                        pw.Expanded(flex: 2, child: pw.Text(_seatLabel(booking), style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold, color: PdfColor.fromInt(0xFF111827)))),
                        pw.Expanded(flex: 2, child: pw.Text('Economy', style: pw.TextStyle(fontSize: 10, color: PdfColor.fromInt(0xFF374151)))),
                      ],
                    ),
                    pw.SizedBox(height: 12),
                    pw.Container(height: 1, color: PdfColor.fromInt(0xFFE5E7EB)),
                    pw.SizedBox(height: 10),
                    pw.Row(
                      children: [
                        pw.Container(
                          decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColor.fromInt(0xFFE5E7EB))),
                          padding: const pw.EdgeInsets.all(4),
                          child: pw.BarcodeWidget(
                            data: booking.bookingCode,
                            barcode: pw.Barcode.qrCode(),
                            width: 78,
                            height: 78,
                          ),
                        ),
                        pw.SizedBox(width: 10),
                        pw.Expanded(
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Text('KODE BOOKING', style: pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF9CA3AF), fontWeight: pw.FontWeight.bold)),
                              pw.SizedBox(height: 2),
                              pw.Text(
                                _safe(booking.bookingCode),
                                style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold, letterSpacing: 2.5),
                              ),
                              pw.SizedBox(height: 2),
                              pw.Text('Pindai QR di mesin self check-in atau tunjukkan ke petugas bandara.', style: pw.TextStyle(fontSize: 9, color: PdfColor.fromInt(0xFF6B7280))),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              pw.Container(
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromInt(0xFFF9FAFB),
                  border: pw.Border(top: pw.BorderSide(color: PdfColor.fromInt(0xFFF3F4F6))),
                ),
                padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: pw.Text(
                  'Electronic Ticket (E-Ticket) Penerbangan · SkyIntern E-Ticketing System',
                  textAlign: pw.TextAlign.center,
                  style: pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFF9CA3AF), fontStyle: pw.FontStyle.italic),
                ),
              ),
                ],
              ),
            ],
          ),
        );
      },
    ),
  );

  return pdf.save();
}
