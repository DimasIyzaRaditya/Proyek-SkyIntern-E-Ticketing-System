import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/app_theme.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import '../widgets/common_widgets.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  bool _isLoading = false;
  bool _isUploadingAvatar = false;
  late AnimationController _animCtrl;
  Uint8List? _localAvatarBytes;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _nameCtrl = TextEditingController(text: user?.fullName ?? '');
    _phoneCtrl = TextEditingController(text: user?.phoneNumber ?? '');
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 80,
    );
    if (picked == null || !mounted) return;

    final authProvider = context.read<AuthProvider>();
    setState(() => _isUploadingAvatar = true);
    try {
      final bytes = await picked.readAsBytes();
      final mimeType = picked.mimeType ?? 'image/jpeg';
      final base64Str = base64Encode(bytes);
      final dataUrl = 'data:$mimeType;base64,$base64Str';

      await authProvider.updateProfile(avatarUrl: dataUrl);
      if (mounted) {
        setState(() => _localAvatarBytes = bytes);
        showSnackBar(context, 'Foto profil berhasil diperbarui');
      }
    } catch (e) {
      if (mounted) showSnackBar(context, e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isUploadingAvatar = false);
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      await context.read<AuthProvider>().updateProfile(
            name: _nameCtrl.text.trim(),
            phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
          );
      if (mounted) {
        showSnackBar(context, 'Profil berhasil diperbarui');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) showSnackBar(context, e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildAvatar(String? avatarUrl, String fullName) {
    ImageProvider? imageProvider;
    if (_localAvatarBytes != null) {
      imageProvider = MemoryImage(_localAvatarBytes!);
    } else if (avatarUrl != null && avatarUrl.startsWith('data:image')) {
      final base64Data = avatarUrl.split(',').last;
      imageProvider = MemoryImage(base64Decode(base64Data));
    } else if (avatarUrl != null && avatarUrl.isNotEmpty) {
      imageProvider = NetworkImage(avatarUrl);
    }

    return GestureDetector(
      onTap: _isUploadingAvatar ? null : _pickAvatar,
      child: Stack(
        children: [
          Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              gradient: imageProvider == null ? AppColors.primaryGradient : null,
              shape: BoxShape.circle,
              boxShadow: AppShadows.colored,
              image: imageProvider != null
                  ? DecorationImage(image: imageProvider, fit: BoxFit.cover)
                  : null,
            ),
            alignment: Alignment.center,
            child: imageProvider == null
                ? Text(
                    StringHelper.getInitials(fullName),
                    style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Colors.white),
                  )
                : null,
          ),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: AppShadows.soft,
              ),
              child: _isUploadingAvatar
                  ? const SizedBox(
                      width: 16, height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                    )
                  : const Icon(Icons.camera_alt_rounded, size: 16, color: AppColors.primary),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
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
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text('Edit Profil', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          final user = auth.user;
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Avatar
                FadeSlideIn(
                  delay: const Duration(milliseconds: 100),
                  child: Center(
                    child: _buildAvatar(user?.avatarUrl, user?.fullName ?? ''),
                  ),
                ),
                const SizedBox(height: 8),
                const Center(
                  child: Text('Ketuk untuk mengubah foto', style: TextStyle(fontSize: 12, color: AppColors.textHint)),
                ),
                const SizedBox(height: 24),

                FadeSlideIn(
                  delay: const Duration(milliseconds: 200),
                  child: GlassCard(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SectionHeader(title: 'Informasi Pribadi'),
                        const SizedBox(height: 16),
                        InputField(
                          label: 'Nama Lengkap',
                          controller: _nameCtrl,
                          prefixIcon: const Icon(Icons.person_outline_rounded),
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Nama wajib diisi' : null,
                        ),
                        const SizedBox(height: 14),
                        InputField(
                          label: 'Nomor Telepon',
                          controller: _phoneCtrl,
                          keyboardType: TextInputType.phone,
                          prefixIcon: const Icon(Icons.phone_outlined),
                        ),
                        const SizedBox(height: 14),
                        InputField(
                          label: 'Email',
                          controller: TextEditingController(text: user?.email ?? ''),
                          prefixIcon: const Icon(Icons.email_outlined),
                          enabled: false,
                        ),
                        const SizedBox(height: 6),
                        const Text('Email tidak dapat diubah',
                            style: TextStyle(fontSize: 11, color: AppColors.textHint)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                FadeSlideIn(
                  delay: const Duration(milliseconds: 300),
                  child: PrimaryButton(
                    label: 'Simpan Perubahan',
                    onPressed: _handleSave,
                    isLoading: _isLoading,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
