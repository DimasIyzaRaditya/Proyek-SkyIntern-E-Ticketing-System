import 'package:flutter/material.dart';
import '../services/admin_service.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';

// Derives a short 3-letter badge code from city name
String _deriveCode(String? city) {
  if (city == null || city.isEmpty) return '?';
  final letters = city.replaceAll(RegExp(r'[^a-zA-Z]'), '');
  if (letters.length >= 3) return letters.substring(0, 3).toUpperCase();
  return letters.toUpperCase().padRight(3, 'X');
}

class AdminAirportsScreen extends StatefulWidget {
  const AdminAirportsScreen({super.key});

  @override
  State<AdminAirportsScreen> createState() => _AdminAirportsScreenState();
}

class _AdminAirportsScreenState extends State<AdminAirportsScreen> {
  List<Map<String, dynamic>> _airports = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAirports();
  }

  Future<void> _loadAirports() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final data = await AdminService.getAirports();
      if (mounted) setState(() { _airports = data; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); });
    } finally {
      if (mounted) setState(() { _isLoading = false; });
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
            gradient: LinearGradient(colors: [Color(0xFF10B981), Color(0xFF0EA5E9)]),
            boxShadow: [BoxShadow(color: Color(0x2210B981), blurRadius: 12, offset: Offset(0, 4))],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text('Bandara', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: ElevatedButton.icon(
                    onPressed: _showAddEditDialog,
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('Tambah'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF10B981),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
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
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_error!, style: const TextStyle(color: AppColors.error)),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: _loadAirports,
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                )
          : _airports.isEmpty
          ? const EmptyState(icon: Icons.location_city_rounded, title: 'Belum ada bandara', subtitle: 'Tambahkan bandara baru')
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _airports.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (ctx, i) {
                final a = _airports[i];
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
                            gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF0EA5E9)]),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          alignment: Alignment.center,
                          child: Text(_deriveCode(a['city'] as String?),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(a['name'] ?? a['airportName'] ?? '',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                                  maxLines: 1, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 2),
                              Text('${a['city']}, ${a['country']}',
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
                            if (v == 'edit') _showAddEditDialog(airport: a);
                            else _showDeleteDialog(a);
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showAddEditDialog({Map<String, dynamic>? airport}) {
    final isEdit = airport != null;
    final nameCtrl = TextEditingController(text: airport?['name'] ?? '');
    final cityCtrl = TextEditingController(text: airport?['city'] ?? '');
    final countryCtrl = TextEditingController(text: airport?['country'] ?? '');
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF0EA5E9)]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(isEdit ? Icons.edit_rounded : Icons.add_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 12),
            Text(isEdit ? 'Edit Bandara' : 'Tambah Bandara',
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                InputField(label: 'Nama Bandara', controller: nameCtrl,
                    validator: (v) => v?.isEmpty == true ? 'Wajib diisi' : null),
                const SizedBox(height: 14),
                InputField(label: 'Kota', controller: cityCtrl,
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
            onPressed: () async {
              if (!formKey.currentState!.validate()) return;
              Navigator.pop(ctx);
              try {
                if (isEdit) {
                  await AdminService.updateAirport(
                    id: airport!['id'] as int,
                    name: nameCtrl.text.trim(),
                    city: cityCtrl.text.trim(),
                    country: countryCtrl.text.trim(),
                  );
                } else {
                  await AdminService.createAirport(
                    name: nameCtrl.text.trim(),
                    city: cityCtrl.text.trim(),
                    country: countryCtrl.text.trim(),
                  );
                }
                await _loadAirports();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text('Bandara berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!'),
                    backgroundColor: AppColors.success,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ));
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text('Gagal: ${e.toString()}'),
                    backgroundColor: AppColors.error,
                    behavior: SnackBarBehavior.floating,
                  ));
                }
              }
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: Text(isEdit ? 'Perbarui' : 'Tambah'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(Map<String, dynamic> airport) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Hapus Bandara', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text('Anda yakin ingin menghapus "${airport['name']}"?',
            style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal', style: TextStyle(color: AppColors.textSecondary))),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await AdminService.deleteAirport(airport['id'] as int);
                await _loadAirports();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content: Text('Bandara berhasil dihapus'),
                    backgroundColor: AppColors.error,
                    behavior: SnackBarBehavior.floating,
                  ));
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                    content: Text('Gagal menghapus: ${e.toString()}'),
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
