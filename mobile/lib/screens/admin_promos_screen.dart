import 'package:flutter/material.dart';
import '../services/admin_service.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';

class AdminPromosScreen extends StatefulWidget {
  const AdminPromosScreen({super.key});

  @override
  State<AdminPromosScreen> createState() => _AdminPromosScreenState();
}

class _AdminPromosScreenState extends State<AdminPromosScreen> {
  final List<Map<String, dynamic>> _promos = [];
  List<Map<String, dynamic>> _flights = [];
  bool _loading = true;
  String? _error;
  String _filter = 'all';
  String _searchQuery = '';
  String _sortBy = 'newest';
  int _page = 1;
  int _perPage = 10;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await Future.wait([
        AdminService.getPromos(),
        AdminService.getFlights(),
      ]);

      if (!mounted) return;
      setState(() {
        _promos
          ..clear()
          ..addAll(data[0]);
        _flights = data[1];
        if (_page > _totalPages) _page = _totalPages;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  DateTime _parseDate(String? raw) =>
      DateTime.tryParse(raw ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0);

  List<Map<String, dynamic>> get _filteredPromos {
    if (_filter == 'all') return _promos;
    if (_filter == 'active') {
      return _promos.where((p) => p['isActive'] == true).toList();
    }
    return _promos.where((p) => p['isActive'] != true).toList();
  }

  List<Map<String, dynamic>> get _processedPromos {
    final q = _searchQuery.trim().toLowerCase();
    var data = _filteredPromos.where((p) {
      if (q.isEmpty) return true;
      final id = (p['id'] ?? '').toString().toLowerCase();
      final title = (p['title'] ?? '').toString().toLowerCase();
      final description = (p['description'] ?? '').toString().toLowerCase();
      return id.contains(q) || title.contains(q) || description.contains(q);
    }).toList();

    data.sort((x, y) {
      switch (_sortBy) {
        case 'id':
          return ((x['id'] as num?)?.toInt() ?? 0).compareTo(
            (y['id'] as num?)?.toInt() ?? 0,
          );
        case 'name':
          return (x['title'] ?? '').toString().toLowerCase().compareTo(
            (y['title'] ?? '').toString().toLowerCase(),
          );
        case 'oldest':
          return _parseDate(
            x['startDate']?.toString(),
          ).compareTo(_parseDate(y['startDate']?.toString()));
        case 'newest':
        default:
          return _parseDate(
            y['startDate']?.toString(),
          ).compareTo(_parseDate(x['startDate']?.toString()));
      }
    });

    return data;
  }

  int get _totalPages => _processedPromos.isEmpty
      ? 1
      : (_processedPromos.length / _perPage).ceil();

  List<Map<String, dynamic>> get _pagedPromos {
    final data = _processedPromos;
    final start = (_page - 1) * _perPage;
    final end = (start + _perPage).clamp(0, data.length);
    if (start >= data.length) return [];
    return data.sublist(start, end);
  }

  String _flightLabel(Map<String, dynamic> promo) {
    final flight = promo['flight'];
    if (flight is! Map) return 'Semua tiket (Global)';

    final f = Map<String, dynamic>.from(flight);
    final origin = ((f['origin'] as Map?)?['city'] ?? '-').toString();
    final destination = ((f['destination'] as Map?)?['city'] ?? '-').toString();
    return '${f['flightNumber']} • $origin → $destination';
  }

  String _fmtDate(String? raw) {
    if (raw == null) return '-';
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }

  Future<void> _pickDate(
    BuildContext context,
    TextEditingController controller,
  ) async {
    final now = DateTime.now();
    final initial = DateTime.tryParse(controller.text) ?? now;

    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 5),
    );

    if (date != null) {
      controller.text = date.toIso8601String().split('T').first;
    }
  }

  void _showPromoDialog({Map<String, dynamic>? promo}) {
    final isEdit = promo != null;
    final formKey = GlobalKey<FormState>();

    final titleCtrl = TextEditingController(
      text: (promo?['title'] ?? '').toString(),
    );
    final descriptionCtrl = TextEditingController(
      text: (promo?['description'] ?? '').toString(),
    );
    final discountCtrl = TextEditingController(
      text: ((promo?['discount'] ?? 0) as num).toInt().toString(),
    );
    final startCtrl = TextEditingController(
      text:
          DateTime.tryParse(
            (promo?['startDate'] ?? '').toString(),
          )?.toIso8601String().split('T').first ??
          DateTime.now().toIso8601String().split('T').first,
    );
    final endCtrl = TextEditingController(
      text:
          DateTime.tryParse(
            (promo?['endDate'] ?? '').toString(),
          )?.toIso8601String().split('T').first ??
          DateTime.now()
              .add(const Duration(days: 7))
              .toIso8601String()
              .split('T')
              .first,
    );

    bool saving = false;
    bool isActive = (promo?['isActive'] as bool?) ?? true;
    int? selectedFlightId = (promo?['flightId'] as num?)?.toInt();

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSt) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: Text(
                isEdit ? 'Edit Promo' : 'Tambah Promo',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              content: SizedBox(
                width: 520,
                child: Form(
                  key: formKey,
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        InputField(
                          label: 'Judul Promo',
                          controller: titleCtrl,
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'Judul wajib diisi'
                              : null,
                        ),
                        const SizedBox(height: 12),
                        InputField(
                          label: 'Deskripsi (Opsional)',
                          controller: descriptionCtrl,
                          maxLines: 2,
                        ),
                        const SizedBox(height: 12),
                        InputField(
                          label: 'Diskon (%)',
                          controller: discountCtrl,
                          keyboardType: TextInputType.number,
                          validator: (v) {
                            final n = int.tryParse((v ?? '').trim());
                            if (n == null || n < 0 || n > 100) {
                              return 'Isi 0 sampai 100';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                        InputField(
                          label: 'Tanggal Mulai',
                          controller: startCtrl,
                          readOnly: true,
                          onTap: () => _pickDate(context, startCtrl),
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.date_range_rounded),
                            onPressed: () => _pickDate(context, startCtrl),
                          ),
                        ),
                        const SizedBox(height: 12),
                        InputField(
                          label: 'Tanggal Selesai',
                          controller: endCtrl,
                          readOnly: true,
                          onTap: () => _pickDate(context, endCtrl),
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.date_range_rounded),
                            onPressed: () => _pickDate(context, endCtrl),
                          ),
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<int?>(
                          initialValue: selectedFlightId,
                          decoration: const InputDecoration(
                            labelText: 'Berlaku untuk',
                            border: OutlineInputBorder(),
                          ),
                          items: [
                            const DropdownMenuItem<int?>(
                              value: null,
                              child: Text('Semua tiket (Global)'),
                            ),
                            ..._flights.map((f) {
                              final id = (f['id'] as num).toInt();
                              final fn = (f['flightNumber'] ?? '-').toString();
                              final origin =
                                  ((f['origin'] as Map?)?['city'] ?? '-')
                                      .toString();
                              final destination =
                                  ((f['destination'] as Map?)?['city'] ?? '-')
                                      .toString();

                              return DropdownMenuItem<int?>(
                                value: id,
                                child: Text('$fn • $origin → $destination'),
                              );
                            }),
                          ],
                          onChanged: (value) {
                            setSt(() => selectedFlightId = value);
                          },
                        ),
                        const SizedBox(height: 10),
                        SwitchListTile.adaptive(
                          value: isActive,
                          onChanged: (value) => setSt(() => isActive = value),
                          title: const Text('Aktif'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: saving ? null : () => Navigator.pop(ctx),
                  child: const Text('Batal'),
                ),
                ElevatedButton(
                  onPressed: saving
                      ? null
                      : () async {
                          if (!formKey.currentState!.validate()) return;

                          final start = DateTime.tryParse(startCtrl.text);
                          final end = DateTime.tryParse(endCtrl.text);
                          if (start == null ||
                              end == null ||
                              !end.isAfter(start)) {
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Tanggal selesai harus setelah tanggal mulai.',
                                ),
                                backgroundColor: AppColors.error,
                              ),
                            );
                            return;
                          }

                          setSt(() => saving = true);
                          try {
                            if (isEdit) {
                              await AdminService.updatePromo(
                                id: (promo['id'] as num).toInt(),
                                title: titleCtrl.text.trim(),
                                description: descriptionCtrl.text.trim(),
                                discount: int.parse(discountCtrl.text.trim()),
                                startDate: startCtrl.text.trim(),
                                endDate: endCtrl.text.trim(),
                                isActive: isActive,
                                flightId: selectedFlightId,
                                includeFlightId: true,
                              );
                            } else {
                              await AdminService.createPromo(
                                title: titleCtrl.text.trim(),
                                description: descriptionCtrl.text.trim(),
                                discount: int.parse(discountCtrl.text.trim()),
                                startDate: startCtrl.text.trim(),
                                endDate: endCtrl.text.trim(),
                                isActive: isActive,
                                flightId: selectedFlightId,
                              );
                            }

                            if (!ctx.mounted) return;
                            Navigator.pop(ctx);
                            await _loadData();
                            if (!mounted) return;
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  isEdit
                                      ? 'Promo berhasil diperbarui.'
                                      : 'Promo berhasil ditambahkan.',
                                ),
                                backgroundColor: AppColors.success,
                              ),
                            );
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(this.context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    e.toString().replaceAll('Exception: ', ''),
                                  ),
                                  backgroundColor: AppColors.error,
                                ),
                              );
                            }
                            setSt(() => saving = false);
                          }
                        },
                  child: saving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(isEdit ? 'Simpan' : 'Tambah'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _confirmDelete(Map<String, dynamic> promo) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Hapus Promo'),
        content: Text('Yakin ingin menghapus promo "${promo['title']}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await AdminService.deletePromo((promo['id'] as num).toInt());
                await _loadData();
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Promo berhasil dihapus.'),
                    backgroundColor: AppColors.error,
                  ),
                );
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(e.toString().replaceAll('Exception: ', '')),
                    backgroundColor: AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(
        title: 'Promo',
        showBackButton: true,
        actions: [
          IconButton(
            onPressed: () => _showPromoDialog(),
            icon: const Icon(Icons.add_rounded),
            tooltip: 'Tambah promo',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: AppColors.error,
                      size: 44,
                    ),
                    const SizedBox(height: 8),
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _loadData,
                      child: const Text('Coba lagi'),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: SegmentedButton<String>(
                          segments: const [
                            ButtonSegment(value: 'all', label: Text('Semua')),
                            ButtonSegment(
                              value: 'active',
                              label: Text('Aktif'),
                            ),
                            ButtonSegment(
                              value: 'inactive',
                              label: Text('Nonaktif'),
                            ),
                          ],
                          selected: {_filter},
                          onSelectionChanged: (value) {
                            setState(() {
                              _filter = value.first;
                              _page = 1;
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  ListQueryControls(
                    searchQuery: _searchQuery,
                    sortValue: _sortBy,
                    rowsPerPage: _perPage,
                    searchHint:
                        'Cari promo berdasarkan judul, deskripsi, atau ID...',
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
                  const SizedBox(height: 14),
                  if (_processedPromos.isEmpty)
                    const EmptyState(
                      icon: Icons.local_offer_outlined,
                      title: 'Belum ada promo',
                      subtitle:
                          'Tambahkan promo untuk ditampilkan di aplikasi.',
                    ),
                  ..._pagedPromos.map((promo) {
                    final active = promo['isActive'] == true;
                    final discount = ((promo['discount'] ?? 0) as num).toInt();

                    return GlassCard(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      (promo['title'] ?? 'Promo').toString(),
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      _flightLabel(promo),
                                      style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: active
                                      ? AppColors.successLight
                                      : AppColors.surfaceVariant,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  active ? 'Aktif' : 'Nonaktif',
                                  style: TextStyle(
                                    color: active
                                        ? AppColors.success
                                        : AppColors.textSecondary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if ((promo['description'] ?? '')
                              .toString()
                              .trim()
                              .isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(
                              (promo['description'] ?? '').toString(),
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  'Diskon $discount%',
                                  style: const TextStyle(
                                    color: AppColors.primaryDark,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '${_fmtDate((promo['startDate'] ?? '').toString())} - ${_fmtDate((promo['endDate'] ?? '').toString())}',
                                style: const TextStyle(
                                  color: AppColors.textHint,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              IconButton(
                                onPressed: () => _showPromoDialog(promo: promo),
                                icon: const Icon(Icons.edit_outlined),
                                tooltip: 'Edit',
                              ),
                              IconButton(
                                onPressed: () => _confirmDelete(promo),
                                icon: const Icon(
                                  Icons.delete_outline,
                                  color: AppColors.error,
                                ),
                                tooltip: 'Hapus',
                              ),
                              const Spacer(),
                              Switch.adaptive(
                                value: active,
                                onChanged: (value) async {
                                  final messenger = ScaffoldMessenger.of(
                                    context,
                                  );
                                  try {
                                    await AdminService.updatePromo(
                                      id: (promo['id'] as num).toInt(),
                                      isActive: value,
                                    );
                                    await _loadData();
                                  } catch (e) {
                                    messenger.showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          e.toString().replaceAll(
                                            'Exception: ',
                                            '',
                                          ),
                                        ),
                                        backgroundColor: AppColors.error,
                                      ),
                                    );
                                  }
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),
                  ListPaginationBar(
                    currentPage: _page,
                    totalItems: _processedPromos.length,
                    itemsPerPage: _perPage,
                    onPageChanged: (next) => setState(() => _page = next),
                  ),
                ],
              ),
            ),
    );
  }
}
