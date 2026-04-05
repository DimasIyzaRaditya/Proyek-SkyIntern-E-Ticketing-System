import 'package:flutter/material.dart';

import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';

class ChatMessage {
  final String text;
  final bool isUser;

  ChatMessage({required this.text, required this.isUser});
}

class ChatBotScreen extends StatefulWidget {
  const ChatBotScreen({super.key});

  @override
  State<ChatBotScreen> createState() => _ChatBotScreenState();
}

class _ChatBotScreenState extends State<ChatBotScreen> {
  final TextEditingController _inputCtrl = TextEditingController();
  final List<ChatMessage> _messages = [
    ChatMessage(
      text: 'Halo, saya asisten SkyIntern. Saya bisa bantu cari penerbangan, booking, pembayaran, dan e-ticket.',
      isUser: false,
    ),
  ];

  @override
  void dispose() {
    _inputCtrl.dispose();
    super.dispose();
  }

  String _replyFor(String input) {
    final q = input.toLowerCase();
    if (q.contains('book') || q.contains('pesan')) {
      return 'Untuk booking: cari flight -> pilih kursi -> isi data penumpang -> bayar. Anda bisa mulai dari menu Cari Penerbangan.';
    }
    if (q.contains('bayar') || q.contains('payment') || q.contains('midtrans')) {
      return 'Pembayaran memakai Midtrans. Setelah bayar, status booking akan sinkron otomatis dan e-ticket bisa dibuka di menu Booking Saya.';
    }
    if (q.contains('tiket') || q.contains('e-ticket') || q.contains('eticket')) {
      return 'E-ticket tersedia setelah pembayaran sukses. Buka Booking Saya lalu pilih detail untuk lihat QR.';
    }
    if (q.contains('2fa') || q.contains('verifikasi')) {
      return 'Jika 2FA aktif, saat login Anda akan diminta kode 6 digit yang dikirim ke email.';
    }
    return 'Terima kasih. Coba jelaskan lebih spesifik, misalnya: "cara booking", "cara bayar", atau "cara lihat e-ticket".';
  }

  void _send() {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(text: text, isUser: true));
      _messages.add(ChatMessage(text: _replyFor(text), isUser: false));
      _inputCtrl.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(title: 'SkyIntern Assistant', showBackButton: true),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(14),
              itemCount: _messages.length,
              itemBuilder: (_, idx) {
                final msg = _messages[idx];
                return Align(
                  alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    constraints: const BoxConstraints(maxWidth: 320),
                    decoration: BoxDecoration(
                      color: msg.isUser ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: msg.isUser ? AppColors.primary : AppColors.border),
                    ),
                    child: Text(
                      msg.text,
                      style: TextStyle(
                        color: msg.isUser ? Colors.white : AppColors.textPrimary,
                        fontSize: 14,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, -2))],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputCtrl,
                      onSubmitted: (_) => _send(),
                      decoration: InputDecoration(
                        hintText: 'Tulis pertanyaan... ',
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FloatingActionButton.small(
                    onPressed: _send,
                    backgroundColor: AppColors.primary,
                    child: const Icon(Icons.send_rounded, color: Colors.white),
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
