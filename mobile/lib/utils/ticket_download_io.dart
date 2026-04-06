import 'dart:io';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
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

Future<Directory> _resolveTicketDirectory() async {
  if (Platform.isAndroid) {
    final dirs = await getExternalStorageDirectories(type: StorageDirectory.downloads);
    if (dirs != null && dirs.isNotEmpty) {
      final dir = Directory('${dirs.first.path}/SkyInternTickets');
      if (!await dir.exists()) {
        await dir.create(recursive: true);
      }
      return dir;
    }
  }

  final docs = await getApplicationDocumentsDirectory();
  final dir = Directory('${docs.path}/tickets');
  if (!await dir.exists()) {
    await dir.create(recursive: true);
  }
  return dir;
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
  final targetDir = await _resolveTicketDirectory();
  final output = File('${targetDir.path}/$safeName');

  await output.writeAsBytes(bytes, flush: true);

  final openResult = await OpenFilex.open(output.path);
  final opened = openResult.type == ResultType.done;

  return TicketSaveResult(filePath: output.path, opened: opened);
}
