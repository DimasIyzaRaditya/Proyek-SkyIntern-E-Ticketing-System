import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../services/api_client.dart';
import '../services/admin_service.dart';

class AdminAirlinesScreen extends StatefulWidget {
  const AdminAirlinesScreen({super.key});

  @override
  State<AdminAirlinesScreen> createState() => _AdminAirlinesScreenState();
}

class _AdminAirlinesScreenState extends State<AdminAirlinesScreen> {
  final ImagePicker _imagePicker = ImagePicker();
  List<Map<String, dynamic>> _airlines = [];
  bool _isLoading = true;
  String? _error;
  String _searchQuery = '';
  String _sortBy = 'newest';
  int _page = 1;
  int _perPage = 10;

  List<Map<String, dynamic>> get _processedAirlines {
    final q = _searchQuery.trim().toLowerCase();
    var data = _airlines.where((a) {
      if (q.isEmpty) return true;
      final id = (a['id'] ?? '').toString().toLowerCase();
      final code = (a['code'] ?? '').toString().toLowerCase();
      final name = (a['name'] ?? '').toString().toLowerCase();
      final country = (a['country'] ?? '').toString().toLowerCase();
      return id.contains(q) ||
          code.contains(q) ||
          name.contains(q) ||
          country.contains(q);
    }).toList();

    data.sort((x, y) {
      switch (_sortBy) {
        case 'id':
          return ((x['id'] as num?)?.toInt() ?? 0).compareTo(
            (y['id'] as num?)?.toInt() ?? 0,
          );
        case 'name':
          return (x['name'] ?? '').toString().toLowerCase().compareTo(
            (y['name'] ?? '').toString().toLowerCase(),
          );
        case 'oldest':
          return ((x['id'] as num?)?.toInt() ?? 0).compareTo(
            (y['id'] as num?)?.toInt() ?? 0,
          );
        case 'newest':
        default:
          return ((y['id'] as num?)?.toInt() ?? 0).compareTo(
            (x['id'] as num?)?.toInt() ?? 0,
          );
      }
    });

    return data;
  }

  int get _totalPages => _processedAirlines.isEmpty
      ? 1
      : (_processedAirlines.length / _perPage).ceil();

  List<Map<String, dynamic>> get _pagedAirlines {
    final data = _processedAirlines;
    final start = (_page - 1) * _perPage;
    final end = (start + _perPage).clamp(0, data.length);
    if (start >= data.length) return [];
    return data.sublist(start, end);
  }

  String _inferMimeType(String fileName) {
    final lower = fileName.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
  }

  Widget _buildAirlineLeading(Map<String, dynamic> airline) {
    final code = (airline['code'] ?? '?').toString();
    final logo = (airline['logo'] ?? '').toString().trim();
    final logoUrl = logo.isEmpty ? '' : ApiClient.normalizePublicUrl(logo);

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(14),
      ),
      clipBehavior: Clip.antiAlias,
      alignment: Alignment.center,
      child: logoUrl.isEmpty
          ? Text(
              code,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            )
          : Image.network(
              logoUrl,
              fit: BoxFit.cover,
              width: double.infinity,
              height: double.infinity,
              errorBuilder: (_, __, ___) => Text(
                code,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
    );
  }

  @override
  void initState() {
    super.initState();
    _loadAirlines();
  }

  Future<void> _loadAirlines() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final data = await AdminService.getAirlines();
      if (mounted) {
        setState(() {
          _airlines = data;
          if (_page > _totalPages) _page = _totalPages;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.navGradient,
            boxShadow: [
              BoxShadow(
                color: Color(0x330B2F61),
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
              'Maskapai',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: ElevatedButton.icon(
                    onPressed: () => _showAddEditDialog(),
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('Tambah'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF114A8F),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 0,
                      ),
                      textStyle: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    size: 48,
                    color: AppColors.error,
                  ),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _loadAirlines,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Coba Lagi'),
                  ),
                ],
              ),
            )
          : _airlines.isEmpty
          ? const EmptyState(
              icon: Icons.flight_rounded,
              title: 'Belum ada maskapai',
              subtitle: 'Tambahkan maskapai baru',
            )
          : Column(
              children: [
                ListQueryControls(
                  searchQuery: _searchQuery,
                  sortValue: _sortBy,
                  rowsPerPage: _perPage,
                  searchHint: 'Cari maskapai, kode, negara, atau ID...',
                  onSearchChanged: (v) => setState(() {
                    _searchQuery = v;
                    _page = 1;
                  }),
                  onSortChanged: (v) => setState(() {
                    _sortBy = v;
                    _page = 1;
                  }),
                  onRowsPerPageChanged: (v) => setState(() {
                    _perPage = v;
                    _page = 1;
                  }),
                ),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadAirlines,
                    child: _processedAirlines.isEmpty
                        ? ListView(
                            physics: AlwaysScrollableScrollPhysics(),
                            padding: EdgeInsets.all(16),
                            children: [
                              EmptyState(
                                icon: Icons.search_off_rounded,
                                title: 'Data tidak ditemukan',
                                subtitle:
                                    'Coba kata kunci lain untuk pencarian Anda.',
                              ),
                            ],
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _pagedAirlines.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemBuilder: (ctx, i) {
                              final a = _pagedAirlines[i];
                              return TweenAnimationBuilder<double>(
                                duration: Duration(milliseconds: 300 + i * 60),
                                tween: Tween(begin: 0.0, end: 1.0),
                                curve: Curves.easeOut,
                                builder: (_, v, child) => Opacity(
                                  opacity: v,
                                  child: Transform.translate(
                                    offset: Offset(0, 20 * (1 - v)),
                                    child: child,
                                  ),
                                ),
                                child: GlassCard(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 14,
                                  ),
                                  child: Row(
                                    children: [
                                      _buildAirlineLeading(a),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              a['name'] ?? '',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 15,
                                                color: AppColors.textPrimary,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '${a['code']} • ${a['country']}',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      PopupMenuButton<String>(
                                        icon: const Icon(
                                          Icons.more_vert_rounded,
                                          color: AppColors.textHint,
                                        ),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            14,
                                          ),
                                        ),
                                        itemBuilder: (_) => [
                                          const PopupMenuItem(
                                            value: 'edit',
                                            child: Row(
                                              children: [
                                                Icon(
                                                  Icons.edit_rounded,
                                                  size: 18,
                                                  color: AppColors.primary,
                                                ),
                                                SizedBox(width: 10),
                                                Text('Edit'),
                                              ],
                                            ),
                                          ),
                                          const PopupMenuItem(
                                            value: 'delete',
                                            child: Row(
                                              children: [
                                                Icon(
                                                  Icons.delete_rounded,
                                                  size: 18,
                                                  color: AppColors.error,
                                                ),
                                                SizedBox(width: 10),
                                                Text(
                                                  'Hapus',
                                                  style: TextStyle(
                                                    color: AppColors.error,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                        onSelected: (v) {
                                          if (v == 'edit') {
                                            WidgetsBinding.instance
                                                .addPostFrameCallback((_) {
                                                  if (!mounted) return;
                                                  _showAddEditDialog(
                                                    airline: a,
                                                  );
                                                });
                                          } else {
                                            WidgetsBinding.instance
                                                .addPostFrameCallback((_) {
                                                  if (!mounted) return;
                                                  _showDeleteDialog(a);
                                                });
                                          }
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: ListPaginationBar(
                    currentPage: _page,
                    totalItems: _processedAirlines.length,
                    itemsPerPage: _perPage,
                    onPageChanged: (next) => setState(() => _page = next),
                  ),
                ),
              ],
            ),
    );
  }

  void _showAddEditDialog({Map<String, dynamic>? airline}) {
    final isEdit = airline != null;
    final nameCtrl = TextEditingController(text: airline?['name'] ?? '');
    final codeCtrl = TextEditingController(text: airline?['code'] ?? '');
    final countryCtrl = TextEditingController(text: airline?['country'] ?? '');
    final formKey = GlobalKey<FormState>();
    bool saving = false;
    bool pickingImage = false;
    Uint8List? logoBytes;
    String? logoFileName;
    String? logoMimeType;
    final existingLogoRaw = (airline?['logo'] ?? '').toString().trim();
    final existingLogo = existingLogoRaw.isEmpty
        ? ''
        : ApiClient.normalizePublicUrl(existingLogoRaw);

    Future<void> pickAndCropLogo(StateSetter setSt, BuildContext sCtx) async {
      if (pickingImage) return;

      setSt(() => pickingImage = true);
      try {
        final picked = await _imagePicker.pickImage(
          source: ImageSource.gallery,
          imageQuality: 95,
          maxWidth: 1800,
        );

        if (picked == null) return;

        CroppedFile? cropped;
        try {
          cropped = await ImageCropper().cropImage(
            sourcePath: picked.path,
            compressFormat: ImageCompressFormat.jpg,
            compressQuality: 90,
            uiSettings: [
              AndroidUiSettings(
                toolbarTitle: 'Crop Logo',
                toolbarColor: AppColors.primary,
                toolbarWidgetColor: Colors.white,
                activeControlsWidgetColor: AppColors.primary,
                lockAspectRatio: false,
                initAspectRatio: CropAspectRatioPreset.original,
              ),
              IOSUiSettings(title: 'Crop Logo', aspectRatioLockEnabled: false),
            ],
          );
        } on MissingPluginException {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Fitur crop belum aktif. Gambar tetap dipilih tanpa crop. Coba full restart aplikasi.',
                ),
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        }

        final selectedPath = cropped?.path ?? picked.path;
        final bytes = await File(selectedPath).readAsBytes();
        if (!sCtx.mounted) return;

        final segments = selectedPath.split(RegExp(r'[\\/]'));
        final croppedName = segments.isNotEmpty && segments.last.isNotEmpty
            ? segments.last
            : picked.name;

        setSt(() {
          logoBytes = bytes;
          logoFileName = croppedName;
          logoMimeType = _inferMimeType(croppedName);
        });
      } finally {
        if (sCtx.mounted) {
          setSt(() => pickingImage = false);
        }
      }
    }

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (sCtx, setSt) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: AppColors.navGradient,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isEdit ? Icons.edit_rounded : Icons.add_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                isEdit ? 'Edit Maskapai' : 'Tambah Maskapai',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          content: SizedBox(
            width: 360,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: pickingImage
                          ? null
                          : () => pickAndCropLogo(setSt, sCtx),
                      child: Container(
                        height: 132,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                          color: Colors.white,
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            if (logoBytes != null)
                              ExcludeSemantics(
                                child: Image.memory(
                                  logoBytes!,
                                  fit: BoxFit.cover,
                                ),
                              )
                            else if (existingLogo.isNotEmpty)
                              ExcludeSemantics(
                                child: Image.network(
                                  existingLogo,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      _buildLogoPlaceholder(isLoading: false),
                                ),
                              )
                            else
                              _buildLogoPlaceholder(isLoading: false),
                            if (pickingImage)
                              Container(
                                color: Colors.black.withValues(alpha: 0.18),
                                alignment: Alignment.center,
                                child: const CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.image_outlined,
                          size: 16,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            logoFileName != null
                                ? 'Gambar dipilih: $logoFileName'
                                : isEdit
                                ? 'Ketuk untuk mengganti logo (opsional)'
                                : 'Ketuk untuk memilih logo (opsional)',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    InputField(
                      label: 'Nama Maskapai',
                      controller: nameCtrl,
                      validator: (v) =>
                          v?.isEmpty == true ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 14),
                    InputField(
                      label: 'Kode IATA',
                      controller: codeCtrl,
                      validator: (v) =>
                          v?.isEmpty == true ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 14),
                    InputField(
                      label: 'Negara',
                      controller: countryCtrl,
                      validator: (v) =>
                          v?.isEmpty == true ? 'Wajib diisi' : null,
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text(
                'Batal',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            ),
            ElevatedButton(
              onPressed: saving
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      if (!sCtx.mounted) return;
                      setSt(() => saving = true);
                      try {
                        if (isEdit) {
                          await AdminService.updateAirline(
                            id: airline['id'],
                            code: codeCtrl.text.trim(),
                            name: nameCtrl.text.trim(),
                            country: countryCtrl.text.trim(),
                            logoBytes: logoBytes,
                            logoFileName: logoFileName,
                            logoMimeType: logoMimeType,
                          );
                        } else {
                          await AdminService.createAirline(
                            code: codeCtrl.text.trim(),
                            name: nameCtrl.text.trim(),
                            country: countryCtrl.text.trim(),
                            logoBytes: logoBytes,
                            logoFileName: logoFileName,
                            logoMimeType: logoMimeType,
                          );
                        }
                        if (ctx.mounted) {
                          Navigator.of(ctx).pop();
                        }

                        // Give the dialog route one frame to detach before parent refresh.
                        await Future<void>.delayed(Duration.zero);
                        if (!mounted) return;

                        await _loadAirlines();
                        if (!mounted) return;

                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Maskapai berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!',
                            ),
                            backgroundColor: AppColors.success,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        );
                      } catch (e) {
                        if (sCtx.mounted) {
                          setSt(() => saving = false);
                        }
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                e.toString().replaceAll('Exception: ', ''),
                              ),
                              backgroundColor: AppColors.error,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(isEdit ? 'Perbarui' : 'Tambah'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogoPlaceholder({required bool isLoading}) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2));
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: const [
        Icon(Icons.add_photo_alternate_outlined, color: AppColors.textHint),
        SizedBox(height: 6),
        Text(
          'Pilih logo maskapai',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  void _showDeleteDialog(Map<String, dynamic> airline) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Hapus Maskapai',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Anda yakin ingin menghapus "${airline['name']}"?',
          style: const TextStyle(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Batal',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await AdminService.deleteAirline(airline['id']);
                _loadAirlines();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Maskapai berhasil dihapus'),
                      backgroundColor: AppColors.error,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(e.toString().replaceAll('Exception: ', '')),
                      backgroundColor: AppColors.error,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }
}
