import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_client.dart';
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
  late TextEditingController _nikCtrl;
  bool _isLoading = false;
  bool _isUploadingAvatar = false;
  bool _isUpdatingTwoFactor = false;
  bool _obscureNik = true;
  late AnimationController _animCtrl;
  Uint8List? _localAvatarBytes;
  DateTime? _dob;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _nameCtrl = TextEditingController(text: user?.fullName ?? '');
    _phoneCtrl = TextEditingController(text: user?.phoneNumber ?? '');
    _nikCtrl = TextEditingController(text: user?.nik ?? '');
    _nikCtrl.addListener(() {
      if (mounted) setState(() {});
    });
    _dob = _parseUserDate(user?.dateOfBirth);
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _nikCtrl.dispose();
    _animCtrl.dispose();
    super.dispose();
  }

  DateTime? _parseUserDate(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    return DateTime.tryParse(value);
  }

  String _maskedNik(String value) {
    final raw = value.replaceAll(RegExp(r'\D'), '');
    if (raw.length <= 8) return raw;
    final start = raw.substring(0, 4);
    final end = raw.substring(raw.length - 4);
    return '$start${'*' * (raw.length - 8)}$end';
  }

  void _handleNikChanged(String value) {
    final digitsOnly = value.replaceAll(RegExp(r'\D'), '');
    final limited = digitsOnly.length > 16
        ? digitsOnly.substring(0, 16)
        : digitsOnly;

    if (_nikCtrl.text != limited) {
      _nikCtrl.value = TextEditingValue(
        text: limited,
        selection: TextSelection.collapsed(offset: limited.length),
      );
    }
  }

  Future<void> _selectDob() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(2000),
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
    );
    if (picked != null && mounted) {
      setState(() => _dob = picked);
    }
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
      await authProvider.uploadAvatar(
        bytes: bytes,
        fileName: picked.name,
        mimeType: mimeType,
      );
      if (mounted) {
        setState(() => _localAvatarBytes = bytes);
        showSnackBar(context, 'Foto profil berhasil diperbarui');
      }
    } catch (e) {
      if (mounted)
        showSnackBar(
          context,
          e.toString().replaceFirst('Exception: ', ''),
          isError: true,
        );
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
        nik: _nikCtrl.text.trim().isEmpty
            ? null
            : _nikCtrl.text.replaceAll(RegExp(r'\D'), ''),
        dateOfBirth: _dob == null ? null : DateFormatter.formatDate(_dob!),
      );
      if (mounted) {
        showSnackBar(context, 'Profil berhasil diperbarui');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted)
        showSnackBar(
          context,
          e.toString().replaceFirst('Exception: ', ''),
          isError: true,
        );
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
      imageProvider = NetworkImage(ApiClient.normalizePublicUrl(avatarUrl));
    }

    return GestureDetector(
      onTap: _isUploadingAvatar ? null : _pickAvatar,
      child: Stack(
        children: [
          Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              gradient: imageProvider == null
                  ? AppColors.primaryGradient
                  : null,
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
                    style: const TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
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
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    )
                  : const Icon(
                      Icons.camera_alt_rounded,
                      size: 16,
                      color: AppColors.primary,
                    ),
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
              'Edit Profil',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
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
                  child: Text(
                    'Ketuk untuk mengubah foto',
                    style: TextStyle(fontSize: 12, color: AppColors.textHint),
                  ),
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
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'Nama wajib diisi'
                              : null,
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
                          label: 'NIK / Nomor KTP',
                          controller: _nikCtrl,
                          keyboardType: TextInputType.number,
                          obscureText: _obscureNik,
                          onChanged: _handleNikChanged,
                          prefixIcon: const Icon(Icons.badge_outlined),
                          suffixIcon: IconButton(
                            onPressed: () =>
                                setState(() => _obscureNik = !_obscureNik),
                            icon: Icon(
                              _obscureNik
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                            ),
                          ),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return null;
                            final digits = v.replaceAll(RegExp(r'\D'), '');
                            if (digits.length != 16) {
                              return 'NIK harus 16 digit';
                            }
                            return null;
                          },
                        ),
                        if (_nikCtrl.text.trim().isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Tersensor: ${_maskedNik(_nikCtrl.text)}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textHint,
                            ),
                          ),
                        ],
                        const SizedBox(height: 14),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Tanggal Lahir',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textPrimary,
                                ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: _selectDob,
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.cake_outlined,
                                  size: 18,
                                  color: _dob == null
                                      ? AppColors.textHint
                                      : AppColors.primary,
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  _dob == null
                                      ? 'Pilih tanggal lahir'
                                      : DateFormatter.formatShortDate(
                                          DateFormatter.formatDate(_dob!),
                                        ),
                                  style: TextStyle(
                                    color: _dob == null
                                        ? AppColors.textHint
                                        : AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        InputField(
                          label: 'Email',
                          controller: TextEditingController(
                            text: user?.email ?? '',
                          ),
                          prefixIcon: const Icon(Icons.email_outlined),
                          enabled: false,
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Email tidak dapat diubah',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.textHint,
                          ),
                        ),
                        const SizedBox(height: 18),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Login 2FA',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Minta kode verifikasi email saat login',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              _isUpdatingTwoFactor
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : Switch(
                                      value: user?.twoFactorEnabled ?? false,
                                      activeThumbColor: AppColors.primary,
                                      onChanged: (enabled) async {
                                        setState(
                                          () => _isUpdatingTwoFactor = true,
                                        );
                                        try {
                                          await context
                                              .read<AuthProvider>()
                                              .updateTwoFactorSetting(
                                                enabled: enabled,
                                              );
                                          if (!mounted) return;
                                          showSnackBar(
                                            context,
                                            enabled
                                                ? '2FA berhasil diaktifkan'
                                                : '2FA berhasil dinonaktifkan',
                                          );
                                        } catch (e) {
                                          if (!mounted) return;
                                          showSnackBar(
                                            context,
                                            e.toString().replaceFirst(
                                              'Exception: ',
                                              '',
                                            ),
                                            isError: true,
                                          );
                                        } finally {
                                          if (mounted)
                                            setState(
                                              () =>
                                                  _isUpdatingTwoFactor = false,
                                            );
                                        }
                                      },
                                    ),
                            ],
                          ),
                        ),
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
