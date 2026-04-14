import 'dart:io';
import 'package:file_selector/file_selector.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import '../models/booking_model.dart';
import '../services/booking_service.dart';
import 'ticket_pdf_builder.dart';

class TicketSaveResult {
  final String filePath;
  final bool opened;

  const TicketSaveResult({required this.filePath, required this.opened});
}

String _sanitizeFileName(String input) {
  final cleaned = input.replaceAll(RegExp(r'[^A-Za-z0-9._() -]'), '_');
  return cleaned.isEmpty ? 'e-ticket.pdf' : cleaned;
}

Future<Directory> _resolveTicketDirectory() async {
  if (Platform.isAndroid) {
    final dirs = await getExternalStorageDirectories(
      type: StorageDirectory.downloads,
    );
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

Future<File?> _pickTicketOutputFile(String safeName) async {
  try {
    final location = await getSaveLocation(
      suggestedName: safeName,
      acceptedTypeGroups: const [
        XTypeGroup(
          label: 'PDF Documents',
          extensions: ['pdf'],
          mimeTypes: ['application/pdf'],
        ),
      ],
    );

    if (location == null) return null;

    var targetPath = location.path;
    if (!targetPath.toLowerCase().endsWith('.pdf')) {
      targetPath = '$targetPath.pdf';
    }
    return File(targetPath);
  } catch (_) {
    // Some platforms/builds may not support a save dialog yet.
    return null;
  }
}

Future<TicketSaveResult> saveTicketFile({
  required Booking booking,
  required TicketDownloadResult downloaded,
}) async {
  final isPdf =
      downloaded.contentType.toLowerCase().contains('application/pdf') ||
      downloaded.fileName.toLowerCase().endsWith('.pdf');

  final bytes = isPdf ? downloaded.bytes : await buildStyledTicketPdf(booking);

  final bookingCode = booking.bookingCode.trim().isEmpty
      ? booking.id.toString()
      : booking.bookingCode.trim();
  final fileName = 'Ticket Skyinter ($bookingCode).pdf';

  final safeName = _sanitizeFileName(fileName);
  final pickedFile = await _pickTicketOutputFile(safeName);

  if (pickedFile == null) {
    final targetDir = await _resolveTicketDirectory();
    final output = File('${targetDir.path}/$safeName');
    await output.writeAsBytes(bytes, flush: true);

    final openResult = await OpenFilex.open(output.path);
    final opened = openResult.type == ResultType.done;

    return TicketSaveResult(filePath: output.path, opened: opened);
  }

  await pickedFile.writeAsBytes(bytes, flush: true);

  final openResult = await OpenFilex.open(pickedFile.path);
  final opened = openResult.type == ResultType.done;

  return TicketSaveResult(filePath: pickedFile.path, opened: opened);
}
