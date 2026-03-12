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
  List<Map<String, dynamic>> _seats = [];
  bool _isLoading = true;
  bool _generating = false;
  String? _error;
  Map<String, dynamic>? _flight;
  int? _flightId;

  @override
  void initState() {
    super.initState();
    _flight = widget.flight;
    final rawId = _flight?['id'];
    if (rawId != null) {
      _flightId = rawId is int ? rawId : int.tryParse(rawId.toString());
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (_flightId != null) {
        _loadSeats();
      } else {
        setState(() {
          _isLoading = false;
          _error = 'Data penerbangan tidak tersedia. Kembali dan coba lagi.';
        });
      }
    });
  }

  Future<void> _loadSeats() async {
    final id = _flightId;
    if (id == null) {
      setState(() { _isLoading = false; _error = 'ID penerbangan tidak ditemukan.'; });
      return;
    }
    if (mounted) setState(() { _isLoading = true; _error = null; });
    try {
      final seats = await AdminService.getFlightSeats(id);
      if (mounted) setState(() { _seats = seats; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceAll('Exception: ', ''); _isLoading = false; });
    }
  }

  Future<void> _generateSeats() async {
    final id = _flightId;
    if (id == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('ID penerbangan tidak ditemukan'),
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    setState(() => _generating = true);
    try {
      await AdminService.generateSeats(id);
      await _loadSeats();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Kursi berhasil digenerate!'),
          backgroundColor: AppColors.success,
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
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  Color _seatColor(String? status) {
    switch (status) {
      case 'OCCUPIED': return AppColors.textHint.withValues(alpha: 0.5);
      case 'HELD': return const Color(0xFFF59E0B);
      default: return AppColors.success;
    }
  }

  Color _seatTextColor(String? status) {
    switch (status) {
      case 'OCCUPIED': return Colors.white70;
      default: return Colors.white;
    }
  }

  IconData _seatIcon(String? status) {
    switch (status) {
      case 'OCCUPIED': return Icons.event_seat_rounded;
      case 'HELD': return Icons.hourglass_top_rounded;
      default: return Icons.event_seat_outlined;
    }
  }

  void _showEditDialog(Map<String, dynamic> seat) {
    String selectedStatus = seat['status'] ?? 'AVAILABLE';
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
              Text('Kursi ${seat['seatNumber'] ?? seat['code'] ?? ''}',
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
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
                      borderSide:
                          const BorderSide(color: AppColors.primary, width: 2)),
                ),
                items: ['AVAILABLE', 'OCCUPIED', 'HELD']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                    .toList(),
                onChanged: (v) => setSt(() => selectedStatus = v!),
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
                          seatId: seat['id'],
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
                            content: Text(
                                e.toString().replaceAll('Exception: ', '')),
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

  Widget _buildSeatGrid() {
    // Group by class
    final Map<String, List<Map<String, dynamic>>> byClass = {};
    for (final s in _seats) {
      final cls = (s['class'] ?? s['seatClass'] ?? 'ECONOMY') as String;
      byClass.putIfAbsent(cls, () => []).add(s);
    }
    const classOrder = ['FIRST', 'BUSINESS', 'ECONOMY'];
    final classes = classOrder.where((c) => byClass.containsKey(c)).toList();

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: classes.length,
      separatorBuilder: (_, __) => const SizedBox(height: 20),
      itemBuilder: (_, ci) {
        final cls = classes[ci];
        final seats = byClass[cls]!;
        seats.sort((a, b) => (a['seatNumber'] ?? a['code'] ?? '').compareTo(
            b['seatNumber'] ?? b['code'] ?? ''));
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
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 6,
                crossAxisSpacing: 6,
                mainAxisSpacing: 6,
                childAspectRatio: 0.85,
              ),
              itemCount: seats.length,
              itemBuilder: (_, si) {
                final seat = seats[si];
                final code = (seat['seatNumber'] ?? seat['code'] ?? '').toString();
                // Insert aisle gap visually after column 3 (C/D boundary)
                // Columns are typically A B C [aisle] D E F
                return GestureDetector(
                  onTap: () => _showEditDialog(seat),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: _seatColor(seat['status']),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: _seatColor(seat['status']).withValues(alpha: 0.4),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(_seatIcon(seat['status']),
                            size: 16,
                            color: _seatTextColor(seat['status'])),
                        const SizedBox(height: 2),
                        Text(code,
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: _seatTextColor(seat['status']))),
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
    final flight = _flight;
    final origin = flight?['origin'] as Map<String, dynamic>?;
    final dest = flight?['destination'] as Map<String, dynamic>?;
    final subtitle = origin != null && dest != null
        ? '${origin['code']} → ${dest['code']}'
        : '';

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
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Kelola Kursi',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16)),
                if (subtitle.isNotEmpty)
                  Text(subtitle,
                      style: const TextStyle(
                          color: Colors.white70, fontSize: 12)),
              ],
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: ElevatedButton.icon(
                    onPressed: (_generating || _flightId == null) ? null : _generateSeats,
                    icon: _generating
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Color(0xFF8B5CF6)))
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
      floatingActionButton: _flightId == null ? null : FloatingActionButton.extended(
        onPressed: _showAddSeatDialog,
        backgroundColor: const Color(0xFF8B5CF6),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Tambah Kursi',
            style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // Legend
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
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
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline_rounded,
                                size: 48, color: AppColors.error),
                            const SizedBox(height: 12),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 24),
                              child: Text(_error!,
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
                        ? const EmptyState(
                            icon: Icons.event_seat_outlined,
                            title: 'Belum ada kursi',
                            subtitle: 'Tap "Generate" untuk membuat kursi',
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
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
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
                          borderSide: const BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border)),
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
                          borderSide: const BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 2)),
                    ),
                    items: ['ECONOMY', 'BUSINESS', 'FIRST']
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (v) => setSt(() => selectedClass = v!),
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
                          borderSide: const BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 2)),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Wajib diisi';
                      if (int.tryParse(v.trim()) == null) return 'Masukkan angka valid';
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
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('ID penerbangan tidak ditemukan'),
                              backgroundColor: AppColors.error,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                        return;
                      }
                      try {
                        await AdminService.createSeat(
                          flightId: id,
                          seatNumber: seatNumCtrl.text.trim().toUpperCase(),
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
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(
                                e.toString().replaceAll('Exception: ', '')),
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

  Widget _legendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
              color: color, borderRadius: BorderRadius.circular(4)),
        ),
        const SizedBox(width: 4),
        Text(label,
            style: const TextStyle(
                fontSize: 11, color: AppColors.textSecondary)),
      ],
    );
  }
}
