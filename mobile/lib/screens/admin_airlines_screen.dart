import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../services/admin_service.dart';

class AdminAirlinesScreen extends StatefulWidget {
  const AdminAirlinesScreen({super.key});

  @override
  State<AdminAirlinesScreen> createState() => _AdminAirlinesScreenState();
}

class _AdminAirlinesScreenState extends State<AdminAirlinesScreen> {
  List<Map<String, dynamic>> _airlines = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAirlines();
  }

  Future<void> _loadAirlines() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final data = await AdminService.getAirlines();
      if (mounted) setState(() { _airlines = data; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceAll('Exception: ', ''); _isLoading = false; });
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
            boxShadow: [BoxShadow(color: Color(0x330B2F61), blurRadius: 12, offset: Offset(0, 4))],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text('Maskapai', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
                      textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
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
                      const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(_error!, textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.textSecondary)),
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
                  ? const EmptyState(icon: Icons.flight_rounded, title: 'Belum ada maskapai', subtitle: 'Tambahkan maskapai baru')
                  : RefreshIndicator(
                      onRefresh: _loadAirlines,
                      child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _airlines.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (ctx, i) {
                final a = _airlines[i];
                return TweenAnimationBuilder<double>(
                  duration: Duration(milliseconds: 300 + i * 60),
                  tween: Tween(begin: 0.0, end: 1.0),
                  curve: Curves.easeOut,
                  builder: (_, v, child) => Opacity(opacity: v, child: Transform.translate(offset: Offset(0, 20 * (1 - v)), child: child)),
                  child: GlassCard(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          alignment: Alignment.center,
                          child: Text((a['code'] ?? '?').toString(),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(a['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary)),
                              const SizedBox(height: 2),
                              Text('${a['code']} • ${a['country']}',
                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            ],
                          ),
                        ),
                        PopupMenuButton<String>(
                          icon: const Icon(Icons.more_vert_rounded, color: AppColors.textHint),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          itemBuilder: (_) => [
                            const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_rounded, size: 18, color: AppColors.primary), SizedBox(width: 10), Text('Edit')])),
                            const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_rounded, size: 18, color: AppColors.error), SizedBox(width: 10), Text('Hapus', style: TextStyle(color: AppColors.error))])),
                          ],
                          onSelected: (v) {
                            if (v == 'edit') _showAddEditDialog(airline: a);
                            else _showDeleteDialog(a);
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
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

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (sCtx, setSt) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(gradient: AppColors.navGradient, borderRadius: BorderRadius.circular(10)),
              child: Icon(isEdit ? Icons.edit_rounded : Icons.add_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 12),
            Text(isEdit ? 'Edit Maskapai' : 'Tambah Maskapai',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                InputField(label: 'Nama Maskapai', controller: nameCtrl,
                    validator: (v) => v?.isEmpty == true ? 'Wajib diisi' : null),
                const SizedBox(height: 14),
                InputField(label: 'Kode IATA', controller: codeCtrl,
                    validator: (v) => v?.isEmpty == true ? 'Wajib diisi' : null),
                const SizedBox(height: 14),
                InputField(label: 'Negara', controller: countryCtrl,
                    validator: (v) => v?.isEmpty == true ? 'Wajib diisi' : null),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary))),
          ElevatedButton(
            onPressed: saving ? null : () async {
              if (!formKey.currentState!.validate()) return;
              setSt(() => saving = true);
              try {
                if (isEdit) {
                  await AdminService.updateAirline(
                    id: airline['id'],
                    code: codeCtrl.text.trim(),
                    name: nameCtrl.text.trim(),
                    country: countryCtrl.text.trim(),
                  );
                } else {
                  await AdminService.createAirline(
                    code: codeCtrl.text.trim(),
                    name: nameCtrl.text.trim(),
                    country: countryCtrl.text.trim(),
                  );
                }
                if (ctx.mounted) Navigator.pop(ctx);
                _loadAirlines();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text('Maskapai berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!'),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ));
                }
              } catch (e) {
                setSt(() => saving = false);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text(e.toString().replaceAll('Exception: ', '')),
                    backgroundColor: AppColors.error,
                    behavior: SnackBarBehavior.floating,
                  ));
                }
              }
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: saving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(isEdit ? 'Perbarui' : 'Tambah'),
          ),
        ],
      ),
      ),
    );
  }

  void _showDeleteDialog(Map<String, dynamic> airline) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Hapus Maskapai', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text('Anda yakin ingin menghapus "${airline['name']}"?',
            style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary))),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await AdminService.deleteAirline(airline['id']);
                _loadAirlines();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content: Text('Maskapai berhasil dihapus'),
                    backgroundColor: AppColors.error,
                    behavior: SnackBarBehavior.floating,
                  ));
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text(e.toString().replaceAll('Exception: ', '')),
                    backgroundColor: AppColors.error,
                    behavior: SnackBarBehavior.floating,
                  ));
                }
              }
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }
}
