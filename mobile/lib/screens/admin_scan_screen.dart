import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';

class AdminScanScreen extends StatefulWidget {
  const AdminScanScreen({super.key});

  @override
  State<AdminScanScreen> createState() => _AdminScanScreenState();
}

class _AdminScanScreenState extends State<AdminScanScreen> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
  );

  final TextEditingController _manualCodeCtrl = TextEditingController();

  bool _isNavigating = false;
  String _statusText = 'Arahkan kamera ke QR e-ticket';
  String _lastRawResult = '';

  @override
  void dispose() {
    _scannerController.dispose();
    _manualCodeCtrl.dispose();
    super.dispose();
  }

  String _extractCodeFromInput(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return '';

    if (RegExp(r'^[A-Za-z0-9]{6,16}$').hasMatch(trimmed)) {
      return trimmed.toUpperCase();
    }

    final uri = Uri.tryParse(trimmed);
    if (uri != null && uri.hasScheme) {
      final queryCode = uri.queryParameters['code'];
      if (queryCode != null && queryCode.trim().isNotEmpty) {
        return queryCode.trim().toUpperCase();
      }
    }

    final codeMatch =
        RegExp(r'[?&]code=([^&#]+)', caseSensitive: false).firstMatch(trimmed);
    if (codeMatch != null) {
      return Uri.decodeQueryComponent(codeMatch.group(1) ?? '')
          .trim()
          .toUpperCase();
    }

    return trimmed.toUpperCase();
  }

  Future<void> _goToVerify(String rawValue) async {
    if (_isNavigating) return;
    final bookingCode = _extractCodeFromInput(rawValue);
    setState(() => _lastRawResult = rawValue);

    if (bookingCode.isEmpty) {
      setState(() => _statusText = 'Kode booking tidak ditemukan dari hasil scan');
      return;
    }

    _isNavigating = true;
    await _scannerController.stop();

    if (!mounted) return;
    await Navigator.pushNamed(
      context,
      '/booking-verify',
      arguments: {'code': bookingCode},
    );

    if (!mounted) return;
    _isNavigating = false;
    setState(() => _statusText = 'Arahkan kamera ke QR e-ticket');
    await _scannerController.start();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          decoration: const BoxDecoration(
            color: AppColors.navSurface,
            boxShadow: [
              BoxShadow(
                color: Color(0x1F1F3A5F),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            title: const Text(
              'Scan QR E-Ticket',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            actions: [
              IconButton(
                tooltip: 'Nyalakan/Matikan Flash',
                icon: const Icon(Icons.flash_on_rounded, color: Colors.white),
                onPressed: () => _scannerController.toggleTorch(),
              ),
            ],
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            GlassCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(
                    title: 'Scanner Kamera Admin',
                    subtitle: 'Arahkan kamera ke QR e-ticket untuk verifikasi otomatis',
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: SizedBox(
                      height: 320,
                      child: MobileScanner(
                        controller: _scannerController,
                        onDetect: (capture) {
                          if (capture.barcodes.isEmpty) return;
                          final raw = capture.barcodes.first.rawValue ?? '';
                          if (raw.trim().isEmpty) return;
                          _goToVerify(raw);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _statusText,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                  if (_lastRawResult.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      'Scan terakhir: $_lastRawResult',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.textHint,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 14),
            GlassCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(
                    title: 'Input Manual Kode Booking',
                    subtitle: 'Tempel kode booking atau URL verify jika kamera tidak tersedia',
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _manualCodeCtrl,
                    decoration: InputDecoration(
                      hintText: 'Contoh: ABC123 atau URL ...?code=ABC123',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.primary),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  PrimaryButton(
                    label: 'Verifikasi Booking',
                    icon: Icons.search_rounded,
                    onPressed: () => _goToVerify(_manualCodeCtrl.text),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
