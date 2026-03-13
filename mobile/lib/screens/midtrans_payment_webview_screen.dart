import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../utils/app_theme.dart';

class MidtransPaymentWebViewScreen extends StatefulWidget {
  final String paymentUrl;

  const MidtransPaymentWebViewScreen({
    super.key,
    required this.paymentUrl,
  });

  @override
  State<MidtransPaymentWebViewScreen> createState() =>
      _MidtransPaymentWebViewScreenState();
}

class _MidtransPaymentWebViewScreenState
    extends State<MidtransPaymentWebViewScreen> {
  late final WebViewController _controller;
  int _progress = 0;
  bool _hasLoadError = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (!mounted) return;
            setState(() => _progress = progress);
          },
          onWebResourceError: (_) {
            if (!mounted) return;
            setState(() => _hasLoadError = true);
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            if (uri == null) return NavigationDecision.prevent;

            if (_isMidtransReturnUrl(uri)) {
              Navigator.of(context).pop({
                'callbackStatus': uri.queryParameters['status'],
                'callbackUrl': request.url,
              });
              return NavigationDecision.prevent;
            }

            if (!_isWebUrl(uri)) {
              _openExternalApp(uri);
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  bool _isWebUrl(Uri uri) => uri.scheme == 'http' || uri.scheme == 'https';

  bool _isMidtransReturnUrl(Uri uri) {
    final status = uri.queryParameters['status'];
    final path = uri.path.toLowerCase();
    return status != null && path.contains('bookings');
  }

  Future<void> _openExternalApp(Uri uri) async {
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
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
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text(
              'Pembayaran Midtrans',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                onPressed: () {
                  setState(() => _hasLoadError = false);
                  _controller.reload();
                },
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(2),
              child: _progress < 100
                  ? LinearProgressIndicator(
                      value: _progress / 100,
                      minHeight: 2,
                      color: Colors.white,
                      backgroundColor: Colors.white.withValues(alpha: 0.2),
                    )
                  : const SizedBox.shrink(),
            ),
          ),
        ),
      ),
      body: _hasLoadError
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.error_outline_rounded,
                      size: 56,
                      color: AppColors.error,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Halaman pembayaran gagal dimuat.',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Coba muat ulang. Jika metode pembayaran membuka aplikasi lain, selesaikan pembayaran lalu kembali ke aplikasi ini.',
                      style: TextStyle(color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        setState(() => _hasLoadError = false);
                        _controller.reload();
                      },
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Muat Ulang'),
                    ),
                  ],
                ),
              ),
            )
          : WebViewWidget(controller: _controller),
    );
  }
}