import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../services/admin_service.dart';

class AdminSeatsScreen extends StatefulWidget {
  final Map<String, dynamic>? flight;
  const AdminSeatsScreen({super.key, this.flight});

  @override
  State<AdminSeatsScreen> createState() => _AdminSeatsScreenState();
}

class _AdminSeatsScreenState extends State<AdminSeatsScreen> {
  List<Map<String, dynamic>> _flights = [];
  bool _loadingFlights = true;
  String? _flightLoadError;

  Map<String, dynamic>? _selectedFlight;
  String _searchQuery = '';

  List<Map<String, dynamic>> _seats = [];
  bool _loadingSeats = false;
  bool _generating = false;
  String? _seatError;

  int? get _flightId {
    final raw = _selectedFlight?['id'];
    if (raw == null) return null;
    return raw is int ? raw : int.tryParse(raw.toString());
  }

  String _flightLabel(Map<String, dynamic> f) {
    final num = f['flightNumber'] ?? '';
    final origin = (f['origin'] is Map) ? f['origin']['code'] ?? '' : '';
    final dest = (f['destination'] is Map) ? f['destination']['code'] ?? '' : '';
    final airline = (f['airline'] is Map) ? f['airline']['name'] ?? '' : '';
    return '$num  $origin → $dest  ($airline)';
  }

  @override
  void initState() {
    super.initState();
    _loadFlights();
  }

  Future<void> _loadFlights() async {
    setState(() { _loadingFlights = true; _flightLoadError = null; });
    try {
      final list = await AdminService.getFlights();
      if (!mounted) return;
      setState(() {
        _flights = list;
        _loadingFlights = false;
        if (widget.flight != null) {
          final argId = widget.flight!['id'];
          if (argId != null) {
            final match = list.where((f) {
              final fid = f['id'];
              return fid != null && fid.toString() == argId.toString();
            });
            if (match.isNotEmpty) {
              _selectedFlight = match.first;
              _loadSeats();
            }
          }
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() {
          _flightLoadError = e.toString().replaceAll('Exception: ', '');
          _loadingFlights = false;
        });
      }
    }
  }

  Future<void> _loadSeats() async {
    final id = _flightId;
    if (id == null) return;
    setState(() { _loadingSeats = true; _seatError = null; _seats = []; });
    try {
      final seats = await AdminService.getFlightSeats(id);
      if (mounted) setState(() { _seats = seats; _loadingSeats = false; });
    } catch (e) {
      if (mounted) setState(() {
        _seatError = e.toString().replaceAll('Exception: ', '');
        _loadingSeats = false;
      });
    }
  }

  Future<void> _generateSeats() async {
    final id = _flightId;
    if (id == null) return;
    setState(() => _generating = true);
    try {
      await AdminService.generateSeats(id);
      await _loadSeats();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_seatError != null
            ? 'Generate berhasil, tapi gagal memuat kursi: $_seatError'
            : 'Kursi berhasil digenerate!'),
        backgroundColor: _seatError != null ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
      ));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  void _showFlightPicker() {
    String query = _searchQuery;
    final searchCtrl = TextEditingController(text: query);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (bCtx, setSt) {
          final filtered = _flights.where((f) {
            if (query.isEmpty) return true;
            return _flightLabel(f).toLowerCase().contains(query.toLowerCase());
          }).toList();

          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.75,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                              colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)]),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.flight_rounded,
                            color: Colors.white, size: 16),
                      ),
                      const SizedBox(width: 12),
                      const Text('Pilih Penerbangan',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: searchCtrl,
                    autofocus: true,
                    decoration: InputDecoration(
                      hintText: 'Cari nomor, rute, atau maskapai...',
                      prefixIcon: const Icon(Icons.search_rounded,
                          color: AppColors.textHint),
                      suffixIcon: query.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded,
                                  color: AppColors.textHint),
                              onPressed: () {
                                searchCtrl.clear();
                                setSt(() => query = '');
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: AppColors.background,
                      contentPadding: const EdgeInsets.symmetric(
                          vertical: 12, horizontal: 16),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none),
                    ),
                    onChanged: (v) => setSt(() => query = v),
                  ),
                ),
                const SizedBox(height: 8),
                const Divider(height: 1),
                Flexible(
                  child: filtered.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.all(32),
                          child: Text('Tidak ada penerbangan ditemukan',
                              style: TextStyle(color: AppColors.textSecondary)),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: filtered.length,
                          itemBuilder: (_, i) {
                            final f = filtered[i];
                            final isSelected =
                                _selectedFlight?['id']?.toString() ==
                                    f['id']?.toString();
                            final origin = (f['origin'] is Map)
                                ? f['origin']['code'] ?? ''
                                : '';
                            final dest = (f['destination'] is Map)
                                ? f['destination']['code'] ?? ''
                                : '';
                            final airline = (f['airline'] is Map)
                                ? f['airline']['name'] ?? ''
                                : '';
                            final date = _formatDate(f['departureTime']);
                            final fnLabel =
                                f['flightNumber']?.toString() ?? '?';
                            return ListTile(
                              selected: isSelected,
                              selectedTileColor: const Color(0xFF8B5CF6)
                                  .withValues(alpha: 0.08),
                              leading: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  gradient: isSelected
                                      ? const LinearGradient(colors: [
                                          Color(0xFF8B5CF6),
                                          Color(0xFF6366F1)
                                        ])
                                      : LinearGradient(colors: [
                                          AppColors.primary
                                              .withValues(alpha: 0.15),
                                          AppColors.primary
                                              .withValues(alpha: 0.1),
                                        ]),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Center(
                                  child: Text(
                                    fnLabel.length > 3
                                        ? fnLabel.substring(0, 3)
                                        : fnLabel,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected
                                          ? Colors.white
                                          : AppColors.primary,
                                    ),
                                  ),
                                ),
                              ),
                              title: Text(
                                '$origin → $dest  •  ${f['flightNumber'] ?? ''}',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                  color: isSelected
                                      ? const Color(0xFF8B5CF6)
                                      : AppColors.textPrimary,
                                ),
                              ),
                              subtitle: Text(
                                '$airline  |  $date',
                                style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary),
                              ),
                              trailing: isSelected
                                  ? const Icon(Icons.check_circle_rounded,
                                      color: Color(0xFF8B5CF6))
                                  : null,
                              onTap: () {
                                setState(() {
                                  _selectedFlight = f;
                                  _searchQuery = query;
                                  _seats = [];
                                  _seatError = null;
                                });
                                Navigator.pop(ctx);
                                _loadSeats();
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  String _formatDate(dynamic raw) {
    if (raw == null) return '-';
    try {
      final dt = DateTime.parse(raw.toString()).toLocal();
      const months = [
        'Jan','Feb','Mar','Apr','Mei','Jun',
        'Jul','Agt','Sep','Okt','Nov','Des'
      ];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}  '
          '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return raw.toString();
    }
  }

  Color _seatColor(String? status) {
    switch (status) {
      case 'BOOKED': return AppColors.textHint.withValues(alpha: 0.5);
      case 'RESERVED': return const Color(0xFFF59E0B);
      default: return AppColors.success;
    }
  }

  Color _seatTextColor(String? status) {
    switch (status) {
      case 'BOOKED': return Colors.white70;
      default: return Colors.white;
    }
  }

  IconData _seatIcon(String? status) {
    switch (status) {
      case 'BOOKED': return Icons.event_seat_rounded;
      case 'RESERVED': return Icons.hourglass_top_rounded;
      default: return Icons.event_seat_outlined;
    }
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
              color: color, borderRadius: BorderRadius.circular(4)),
        ),
        const SizedBox(width: 6),
        Text(label,
            style: const TextStyle(
                fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }

  void _showEditDialog(Map<String, dynamic> seat) {
    String selectedStatus = seat['status']?.toString() ?? 'AVAILABLE';
    final priceCtrl = TextEditingController(
        text: seat['additionalPrice']?.toString() ?? '0');
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
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)]),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.event_seat_rounded,
                    color: Colors.white, size: 18),
              ),
              const SizedBox(width: 12),
              Text(
                'Kursi ${seat['seatNumber'] ?? seat['code'] ?? ''}',
                style: const TextStyle(
                    fontSize: 17, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Kelas: ${seat['class'] ?? seat['seatClass'] ?? '-'}',
                  style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedStatus,
                decoration: InputDecoration(
                  labelText: 'Status',
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.border)),
                  focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                          color: AppColors.primary, width: 2)),
                ),
                items: ['AVAILABLE', 'BOOKED', 'RESERVED']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setSt(() => selectedStatus = v);
                },
              ),
              const SizedBox(height: 12),
              InputField(
                label: 'Harga Tambahan (Rp)',
                controller: priceCtrl,
                keyboardType: TextInputType.number,
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Batal',
                    style: TextStyle(color: AppColors.textSecondary))),
            ElevatedButton(
              onPressed: saving
                  ? null
                  : () async {
                      setSt(() => saving = true);
                      try {
                        await AdminService.updateSeat(
                          seatId: seat['id'] as int,
                          status: selectedStatus,
                          additionalPrice:
                              int.tryParse(priceCtrl.text) ?? 0,
                        );
                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadSeats();
                      } catch (e) {
                        setSt(() => saving = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(e
                                .toString()
                                .replaceAll('Exception: ', '')),
                            backgroundColor: AppColors.error,
                            behavior: SnackBarBehavior.floating,
                          ));
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12))),
              child: saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Simpan'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddSeatDialog() {
    final seatNumCtrl = TextEditingController();
    final priceCtrl = TextEditingController(text: '0');
    String selectedClass = 'ECONOMY';
    bool isExitRow = false;
    bool saving = false;
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (sCtx, setSt) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)]),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.add_rounded,
                    color: Colors.white, size: 18),
              ),
              const SizedBox(width: 12),
              const Text('Tambah Kursi',
                  style:
                      TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: seatNumCtrl,
                    decoration: InputDecoration(
                      labelText: 'Nomor Kursi (mis. 1A)',
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.border)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 2)),
                    ),
                    textCapitalization: TextCapitalization.characters,
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedClass,
                    decoration: InputDecoration(
                      labelText: 'Kelas Kursi',
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.border)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 2)),
                    ),
                    items: ['ECONOMY', 'BUSINESS', 'FIRST']
                        .map((c) =>
                            DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setSt(() => selectedClass = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: priceCtrl,
                    decoration: InputDecoration(
                      labelText: 'Harga Tambahan (Rp)',
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.border)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 2)),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Wajib diisi';
                      if (int.tryParse(v.trim()) == null)
                        return 'Masukkan angka valid';
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),
                  CheckboxListTile(
                    value: isExitRow,
                    onChanged: (v) => setSt(() => isExitRow = v ?? false),
                    title: const Text('Exit Row',
                        style: TextStyle(fontSize: 14)),
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Batal',
                    style: TextStyle(color: AppColors.textSecondary))),
            ElevatedButton(
              onPressed: saving
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      setSt(() => saving = true);
                      final id = _flightId;
                      if (id == null) {
                        setSt(() => saving = false);
                        return;
                      }
                      try {
                        await AdminService.createSeat(
                          flightId: id,
                          seatNumber:
                              seatNumCtrl.text.trim().toUpperCase(),
                          seatClass: selectedClass,
                          isExitRow: isExitRow,
                          additionalPrice:
                              int.tryParse(priceCtrl.text.trim()) ?? 0,
                        );
                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadSeats();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Kursi berhasil ditambahkan!'),
                              backgroundColor: AppColors.success,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      } catch (e) {
                        setSt(() => saving = false);
                        if (mounted) {
                          ScaffoldMessenger.of(context)
                              .showSnackBar(SnackBar(
                            content: Text(e
                                .toString()
                                .replaceAll('Exception: ', '')),
                            backgroundColor: AppColors.error,
                            behavior: SnackBarBehavior.floating,
                          ));
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12))),
              child: saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Tambah'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSeatGrid() {
    final Map<String, List<Map<String, dynamic>>> byClass = {};
    for (final s in _seats) {
      final cls = (s['class'] ?? s['seatClass'] ?? 'ECONOMY').toString();
      byClass.putIfAbsent(cls, () => []).add(s);
    }
    const classOrder = ['FIRST', 'BUSINESS', 'ECONOMY'];
    final classes =
        classOrder.where((c) => byClass.containsKey(c)).toList();

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      itemCount: classes.length,
      separatorBuilder: (_, __) => const SizedBox(height: 20),
      itemBuilder: (_, ci) {
        final cls = classes[ci];
        final seats = byClass[cls]!;
        seats.sort((a, b) => (a['seatNumber'] ?? a['code'] ?? '')
            .toString()
            .compareTo((b['seatNumber'] ?? b['code'] ?? '').toString()));
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: cls == 'FIRST'
                      ? [const Color(0xFFF59E0B), const Color(0xFFEF4444)]
                      : cls == 'BUSINESS'
                          ? [const Color(0xFF8B5CF6), const Color(0xFF6366F1)]
                          : [AppColors.primary, AppColors.secondary],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '$cls (${seats.length} kursi)',
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13),
              ),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate:
                  const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 6,
                crossAxisSpacing: 6,
                mainAxisSpacing: 6,
                childAspectRatio: 0.85,
              ),
              itemCount: seats.length,
              itemBuilder: (_, si) {
                final seat = seats[si];
                final code =
                    (seat['seatNumber'] ?? seat['code'] ?? '').toString();
                return GestureDetector(
                  onTap: () => _showEditDialog(seat),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: _seatColor(seat['status']?.toString()),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: _seatColor(seat['status']?.toString())
                              .withValues(alpha: 0.4),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                            _seatIcon(seat['status']?.toString()),
                            size: 16,
                            color: _seatTextColor(
                                seat['status']?.toString())),
                        const SizedBox(height: 2),
                        Text(code,
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: _seatTextColor(
                                    seat['status']?.toString()))),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        );
      },
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
            gradient: LinearGradient(
                colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)]),
            boxShadow: [
              BoxShadow(
                  color: Color(0x338B5CF6),
                  blurRadius: 12,
                  offset: Offset(0, 4))
            ],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text('Kelola Kursi',
                style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16)),
            actions: [
              if (_selectedFlight != null)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    child: ElevatedButton.icon(
                      onPressed: (_generating || _flightId == null)
                          ? null
                          : _generateSeats,
                      icon: _generating
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Color(0xFF8B5CF6)))
                          : const Icon(Icons.auto_fix_high_rounded, size: 16),
                      label: const Text('Generate'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF8B5CF6),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20)),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        textStyle: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
      floatingActionButton: _selectedFlight != null
          ? FloatingActionButton.extended(
              onPressed: _showAddSeatDialog,
              backgroundColor: const Color(0xFF8B5CF6),
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Tambah Kursi',
                  style: TextStyle(fontWeight: FontWeight.bold)),
            )
          : null,
      body: Column(
        children: [
          // ── Flight picker ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: _loadingFlights
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: CircularProgressIndicator(),
                    ),
                  )
                : _flightLoadError != null
                    ? Column(
                        children: [
                          Text(
                            'Gagal memuat penerbangan: $_flightLoadError',
                            style: const TextStyle(
                                color: AppColors.error, fontSize: 13),
                          ),
                          const SizedBox(height: 8),
                          TextButton.icon(
                            onPressed: _loadFlights,
                            icon: const Icon(Icons.refresh_rounded),
                            label: const Text('Coba Lagi'),
                          ),
                        ],
                      )
                    : GestureDetector(
                        onTap: _showFlightPicker,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: _selectedFlight != null
                                  ? const Color(0xFF8B5CF6)
                                  : AppColors.border,
                              width: _selectedFlight != null ? 1.5 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: _selectedFlight != null
                                      ? const Color(0xFF8B5CF6)
                                          .withValues(alpha: 0.12)
                                      : AppColors.background,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  Icons.flight_rounded,
                                  size: 18,
                                  color: _selectedFlight != null
                                      ? const Color(0xFF8B5CF6)
                                      : AppColors.textHint,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _selectedFlight == null
                                    ? const Text(
                                        'Pilih penerbangan...',
                                        style: TextStyle(
                                            color: AppColors.textHint,
                                            fontSize: 14),
                                      )
                                    : Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            () {
                                              final o = (_selectedFlight![
                                                          'origin']
                                                      is Map)
                                                  ? _selectedFlight!['origin']
                                                          ['code'] ??
                                                      ''
                                                  : '';
                                              final d = (_selectedFlight![
                                                          'destination']
                                                      is Map)
                                                  ? _selectedFlight![
                                                          'destination']
                                                          ['code'] ??
                                                      ''
                                                  : '';
                                              return '$o → $d  •  ${_selectedFlight!['flightNumber'] ?? ''}';
                                            }(),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            () {
                                              final al = (_selectedFlight![
                                                          'airline']
                                                      is Map)
                                                  ? _selectedFlight!['airline']
                                                          ['name'] ??
                                                      ''
                                                  : '';
                                              return '$al  |  ${_formatDate(_selectedFlight!['departureTime'])}';
                                            }(),
                                            style: const TextStyle(
                                                fontSize: 12,
                                                color:
                                                    AppColors.textSecondary),
                                          ),
                                        ],
                                      ),
                              ),
                              Icon(
                                Icons.keyboard_arrow_down_rounded,
                                color: _selectedFlight != null
                                    ? const Color(0xFF8B5CF6)
                                    : AppColors.textHint,
                              ),
                            ],
                          ),
                        ),
                      ),
          ),

          // ── Legend ─────────────────────────────────────────────────────
          if (_selectedFlight != null)
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _legendItem(AppColors.success, 'Tersedia'),
                  const SizedBox(width: 16),
                  _legendItem(const Color(0xFFF59E0B), 'Ditahan'),
                  const SizedBox(width: 16),
                  _legendItem(
                      AppColors.textHint.withValues(alpha: 0.5), 'Terisi'),
                ],
              ),
            ),

          // ── Content ────────────────────────────────────────────────────
          Expanded(
            child: _selectedFlight == null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: const Color(0xFF8B5CF6)
                                .withValues(alpha: 0.08),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.event_seat_outlined,
                            size: 52,
                            color: Color(0xFF8B5CF6),
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text('Pilih Penerbangan',
                            style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary)),
                        const SizedBox(height: 8),
                        const Text(
                          'Pilih penerbangan dari dropdown di atas\nuntuk melihat dan mengelola kursi.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : _loadingSeats
                    ? const Center(child: CircularProgressIndicator())
                    : _seatError != null
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.error_outline_rounded,
                                    size: 48, color: AppColors.error),
                                const SizedBox(height: 12),
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 24),
                                  child: Text(_seatError!,
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                          color: AppColors.textSecondary)),
                                ),
                                const SizedBox(height: 16),
                                ElevatedButton.icon(
                                  onPressed: _loadSeats,
                                  icon: const Icon(Icons.refresh_rounded),
                                  label: const Text('Coba Lagi'),
                                ),
                              ],
                            ),
                          )
                        : _seats.isEmpty
                            ? EmptyState(
                                icon: Icons.event_seat_outlined,
                                title: 'Belum ada kursi',
                                subtitle:
                                    'Tap "Generate" di atas untuk membuat kursi otomatis',
                              )
                            : RefreshIndicator(
                                onRefresh: _loadSeats,
                                child: _buildSeatGrid(),
                              ),
          ),
        ],
      ),
    );
  }
}