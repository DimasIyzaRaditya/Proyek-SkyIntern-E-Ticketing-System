// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:typed_data';
import 'dart:html' as html;
import '../models/booking_model.dart';
import '../services/booking_service.dart';
import 'ticket_pdf_builder.dart';

class TicketSaveResult {
  final String filePath;
  final bool opened;

  const TicketSaveResult({
    required this.filePath,
    required this.opened,
  });
}

String _sanitizeFileName(String input) {
  final cleaned = input.replaceAll(RegExp(r'[^A-Za-z0-9._() -]'), '_');
  return cleaned.isEmpty ? 'e-ticket.pdf' : cleaned;
}

Future<TicketSaveResult> saveTicketFile({
  required Booking booking,
  required TicketDownloadResult downloaded,
}) async {
  final isPdf = downloaded.contentType.toLowerCase().contains('application/pdf') ||
      downloaded.fileName.toLowerCase().endsWith('.pdf');

  final bytes = isPdf ? downloaded.bytes : await buildStyledTicketPdf(booking);

  final origin = booking.flight.originCity.trim().isEmpty ? 'Asal' : booking.flight.originCity.trim();
  final destination = booking.flight.destinationCity.trim().isEmpty ? 'Tujuan' : booking.flight.destinationCity.trim();
  final fileName = 'Ticket Skyinter ($origin - $destination).pdf';

  final safeName = _sanitizeFileName(fileName);
  final blob = html.Blob([Uint8List.fromList(bytes)], 'application/pdf');
  final url = html.Url.createObjectUrlFromBlob(blob);

  final anchor = html.AnchorElement(href: url)
    ..download = safeName
    ..style.display = 'none';

  html.document.body?.append(anchor);
  anchor.click();
  anchor.remove();
  html.Url.revokeObjectUrl(url);

  return TicketSaveResult(filePath: safeName, opened: true);
}
