import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../services/admin_service.dart';

class AdminSchedulesScreen extends StatefulWidget {
  const AdminSchedulesScreen({super.key});

  @override
  State<AdminSchedulesScreen> createState() => _AdminSchedulesScreenState();
}

class _AdminSchedulesScreenState extends State<AdminSchedulesScreen> {
  List<Map<String, dynamic>> _flights = [];
  List<Map<String, dynamic>> _airlines = [];
  List<Map<String, dynamic>> _airports = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final results = await Future.wait([
        AdminService.getFlights(),
        AdminService.getAirlines(),
        AdminService.getAirports(),
      ]);
      if (mounted) {
        setState(() {
          _flights = results[0];
          _airlines = results[1];
          _airports = results[2];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceAll('Exception: ', ''); _isLoading = false; });
    }
  }

  String _formatDateTime(String? dt) {
    if (dt == null) return '-';
    try {
      final d = DateTime.parse(dt).toLocal();
      return DateFormat('dd MMM yyyy HH:mm', 'id_ID').format(d);
    } catch (_) {
      return dt;
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
            gradient: LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFEF4444)]),
            boxShadow: [BoxShadow(color: Color(0x33F59E0B), blurRadius: 12, offset: Offset(0, 4))],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text('Jadwal Penerbangan',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  child: ElevatedButton.icon(
                    onPressed: _airlines.isEmpty || _airports.isEmpty ? null : () => _showAddEditDialog(),
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('Tambah'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFFF59E0B),
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
                        onPressed: _loadAll,
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                )
              : _flights.isEmpty
                  ? const EmptyState(
                      icon: Icons.schedule_rounded,
                      title: 'Belum ada jadwal',
                      subtitle: 'Tambahkan jadwal penerbangan baru',
                    )
                  : RefreshIndicator(
                      onRefresh: _loadAll,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _flights.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (ctx, i) {
                          final f = _flights[i];
                          final airline = f['airline'] as Map<String, dynamic>?;
                          final origin = f['origin'] as Map<String, dynamic>?;
                          final dest = f['destination'] as Map<String, dynamic>?;
                          return TweenAnimationBuilder<double>(
                            duration: Duration(milliseconds: 280 + i * 55),
                            tween: Tween(begin: 0.0, end: 1.0),
                            curve: Curves.easeOut,
                            builder: (_, v, child) => Opacity(
                                opacity: v,
                                child: Transform.translate(
                                    offset: Offset(0, 18 * (1 - v)), child: child)),
                            child: GlassCard(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                              colors: [Color(0xFFF59E0B), Color(0xFFEF4444)]),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Text(f['flightNumber'] ?? '',
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 13)),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(airline?['name'] ?? '-',
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 14,
                                                color: AppColors.textPrimary)),
                                      ),
                                      PopupMenuButton<String>(
                                        icon: const Icon(Icons.more_vert_rounded,
                                            color: AppColors.textHint),
                                        shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(14)),
                                        itemBuilder: (_) => [
                                          const PopupMenuItem(
                                              value: 'edit',
                                              child: Row(children: [
                                                Icon(Icons.edit_rounded,
                                                    size: 18, color: AppColors.primary),
                                                SizedBox(width: 10),
                                                Text('Edit')
                                              ])),
                                          const PopupMenuItem(
                                              value: 'seats',
                                              child: Row(children: [
                                                Icon(Icons.event_seat_rounded,
                                                    size: 18, color: Color(0xFF8B5CF6)),
                                                SizedBox(width: 10),
                                                Text('Kelola Kursi')
                                              ])),
                                          const PopupMenuItem(
                                              value: 'delete',
                                              child: Row(children: [
                                                Icon(Icons.delete_rounded,
                                                    size: 18, color: AppColors.error),
                                                SizedBox(width: 10),
                                                Text('Hapus',
                                                    style: TextStyle(color: AppColors.error))
                                              ])),
                                        ],
                                        onSelected: (v) {
                                          if (v == 'edit') _showAddEditDialog(flight: f);
                                          else if (v == 'seats') {
                                            Navigator.pushNamed(context, '/admin/seats',
                                                arguments: f);
                                          } else {
                                            _showDeleteDialog(f);
                                          }
                                        },
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      const Icon(Icons.flight_takeoff_rounded,
                                          size: 16, color: AppColors.primary),
                                      const SizedBox(width: 6),
                                      Text(
                                        '${origin?['code'] ?? '-'} → ${dest?['code'] ?? '-'}',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 15,
                                            color: AppColors.textPrimary),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${origin?['city'] ?? ''} → ${dest?['city'] ?? ''}',
                                    style: const TextStyle(
                                        fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.schedule_rounded,
                                          size: 14, color: AppColors.textHint),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          '${_formatDateTime(f['departureTime']?.toString())} — ${_formatDateTime(f['arrivalTime']?.toString())}',
                                          style: const TextStyle(
                                              fontSize: 12, color: AppColors.textSecondary),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.attach_money_rounded,
                                          size: 14, color: AppColors.success),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Rp ${((f['basePrice'] ?? 0) as num).toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.success,
                                            fontWeight: FontWeight.w600),
                                      ),
                                    ],
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

  void _showAddEditDialog({Map<String, dynamic>? flight}) {
    final isEdit = flight != null;
    final flightNumCtrl =
        TextEditingController(text: flight?['flightNumber'] ?? '');
    final basePriceCtrl = TextEditingController(
        text: flight?['basePrice']?.toString() ?? '');
    final taxCtrl =
        TextEditingController(text: flight?['tax']?.toString() ?? '0');
    final adminFeeCtrl =
        TextEditingController(text: flight?['adminFee']?.toString() ?? '0');
    final aircraftCtrl =
        TextEditingController(text: flight?['aircraft'] ?? '');
    final facilitiesCtrl =
        TextEditingController(text: flight?['facilities'] ?? '');

    int? selectedAirlineId = flight?['airlineId'] ?? flight?['airline']?['id'];
    int? selectedOriginId = flight?['originId'] ?? flight?['origin']?['id'];
    int? selectedDestId =
        flight?['destinationId'] ?? flight?['destination']?['id'];
    DateTime? departureTime = flight?['departureTime'] != null
        ? DateTime.tryParse(flight!['departureTime'].toString())?.toLocal()
        : null;
    DateTime? arrivalTime = flight?['arrivalTime'] != null
        ? DateTime.tryParse(flight!['arrivalTime'].toString())?.toLocal()
        : null;

    final formKey = GlobalKey<FormState>();
    bool saving = false;

    Future<void> pickDateTime(BuildContext ctx,
        {required bool isDeparture}) async {
      final now = DateTime.now();
      final picked = await showDatePicker(
        context: ctx,
        initialDate: (isDeparture ? departureTime : arrivalTime) ?? now,
        firstDate: now.subtract(const Duration(days: 365)),
        lastDate: now.add(const Duration(days: 730)),
      );
      if (picked == null) return;
      final pickedTime = await showTimePicker(
        context: ctx,
        initialTime: TimeOfDay.fromDateTime(
            (isDeparture ? departureTime : arrivalTime) ?? now),
      );
      if (pickedTime == null) return;
      final combined = DateTime(
          picked.year, picked.month, picked.day,
          pickedTime.hour, pickedTime.minute);
      if (isDeparture) {
        departureTime = combined;
      } else {
        arrivalTime = combined;
      }
    }

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (sCtx, setSt) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFFF59E0B), Color(0xFFEF4444)]),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                    isEdit ? Icons.edit_rounded : Icons.add_rounded,
                    color: Colors.white, size: 18),
              ),
              const SizedBox(width: 12),
              Flexible(
                child: Text(isEdit ? 'Edit Jadwal' : 'Tambah Jadwal',
                    style: const TextStyle(
                        fontSize: 17, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          content: Form(
            key: formKey,
            child: SizedBox(
              width: double.maxFinite,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InputField(
                        label: 'Nomor Penerbangan',
                        controller: flightNumCtrl,
                        validator: (v) =>
                            v?.isEmpty == true ? 'Wajib diisi' : null),
                    const SizedBox(height: 12),

                    // Airline dropdown
                    DropdownButtonFormField<int>(
                      value: selectedAirlineId,
                      decoration: InputDecoration(
                        labelText: 'Maskapai',
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
                      items: _airlines
                          .map((a) => DropdownMenuItem<int>(
                              value: a['id'] as int,
                              child: Text('${a['code']} - ${a['name']}',
                                  overflow: TextOverflow.ellipsis)))
                          .toList(),
                      onChanged: (v) => setSt(() => selectedAirlineId = v),
                      validator: (v) =>
                          v == null ? 'Pilih maskapai' : null,
                    ),
                    const SizedBox(height: 12),

                    // Origin airport
                    DropdownButtonFormField<int>(
                      value: selectedOriginId,
                      decoration: InputDecoration(
                        labelText: 'Bandara Asal',
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
                      items: _airports
                          .map((a) => DropdownMenuItem<int>(
                              value: a['id'] as int,
                              child: Text(
                                  '${a['code']} - ${a['city'] ?? ''}',
                                  overflow: TextOverflow.ellipsis)))
                          .toList(),
                      onChanged: (v) => setSt(() => selectedOriginId = v),
                      validator: (v) =>
                          v == null ? 'Pilih bandara asal' : null,
                    ),
                    const SizedBox(height: 12),

                    // Destination airport
                    DropdownButtonFormField<int>(
                      value: selectedDestId,
                      decoration: InputDecoration(
                        labelText: 'Bandara Tujuan',
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
                      items: _airports
                          .map((a) => DropdownMenuItem<int>(
                              value: a['id'] as int,
                              child: Text(
                                  '${a['code']} - ${a['city'] ?? ''}',
                                  overflow: TextOverflow.ellipsis)))
                          .toList(),
                      onChanged: (v) => setSt(() => selectedDestId = v),
                      validator: (v) =>
                          v == null ? 'Pilih bandara tujuan' : null,
                    ),
                    const SizedBox(height: 12),

                    // Departure time
                    GestureDetector(
                      onTap: () async {
                        await pickDateTime(sCtx, isDeparture: true);
                        setSt(() {});
                      },
                      child: AbsorbPointer(
                        child: InputField(
                          label: 'Waktu Keberangkatan',
                          controller: TextEditingController(
                              text: departureTime != null
                                  ? DateFormat('dd MMM yyyy HH:mm')
                                      .format(departureTime!)
                                  : ''),
                          validator: (_) =>
                              departureTime == null ? 'Pilih waktu' : null,
                          suffixIcon: const Icon(Icons.calendar_today_rounded,
                              size: 18),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Arrival time
                    GestureDetector(
                      onTap: () async {
                        await pickDateTime(sCtx, isDeparture: false);
                        setSt(() {});
                      },
                      child: AbsorbPointer(
                        child: InputField(
                          label: 'Waktu Kedatangan',
                          controller: TextEditingController(
                              text: arrivalTime != null
                                  ? DateFormat('dd MMM yyyy HH:mm')
                                      .format(arrivalTime!)
                                  : ''),
                          validator: (_) =>
                              arrivalTime == null ? 'Pilih waktu' : null,
                          suffixIcon: const Icon(Icons.calendar_today_rounded,
                              size: 18),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    InputField(
                      label: 'Harga Dasar (Rp)',
                      controller: basePriceCtrl,
                      keyboardType: TextInputType.number,
                      validator: (v) => v?.isEmpty == true ? 'Wajib diisi' : null,
                    ),
                    const SizedBox(height: 12),
                    InputField(
                      label: 'Pajak (Rp)',
                      controller: taxCtrl,
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    InputField(
                      label: 'Biaya Admin (Rp)',
                      controller: adminFeeCtrl,
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    InputField(
                      label: 'Tipe Pesawat',
                      controller: aircraftCtrl,
                    ),
                    const SizedBox(height: 12),
                    InputField(
                      label: 'Fasilitas (pisah koma)',
                      controller: facilitiesCtrl,
                    ),
                  ],
                ),
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
                      if (departureTime == null || arrivalTime == null) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                          content: Text('Pilih waktu keberangkatan dan kedatangan'),
                          backgroundColor: AppColors.warning,
                        ));
                        return;
                      }
                      setSt(() => saving = true);
                      try {
                        if (isEdit) {
                          await AdminService.updateFlight(
                            id: flight['id'],
                            flightNumber: flightNumCtrl.text.trim(),
                            airlineId: selectedAirlineId!,
                            originId: selectedOriginId!,
                            destinationId: selectedDestId!,
                            departureTime: departureTime!.toUtc().toIso8601String(),
                            arrivalTime: arrivalTime!.toUtc().toIso8601String(),
                            basePrice: int.tryParse(basePriceCtrl.text) ?? 0,
                            tax: int.tryParse(taxCtrl.text) ?? 0,
                            adminFee: int.tryParse(adminFeeCtrl.text) ?? 0,
                            aircraft: aircraftCtrl.text.isNotEmpty ? aircraftCtrl.text : null,
                            facilities: facilitiesCtrl.text.isNotEmpty ? facilitiesCtrl.text : null,
                          );
                        } else {
                          await AdminService.createFlight(
                            flightNumber: flightNumCtrl.text.trim(),
                            airlineId: selectedAirlineId!,
                            originId: selectedOriginId!,
                            destinationId: selectedDestId!,
                            departureTime: departureTime!.toUtc().toIso8601String(),
                            arrivalTime: arrivalTime!.toUtc().toIso8601String(),
                            basePrice: int.tryParse(basePriceCtrl.text) ?? 0,
                            tax: int.tryParse(taxCtrl.text) ?? 0,
                            adminFee: int.tryParse(adminFeeCtrl.text) ?? 0,
                            aircraft: aircraftCtrl.text.isNotEmpty ? aircraftCtrl.text : null,
                            facilities: facilitiesCtrl.text.isNotEmpty ? facilitiesCtrl.text : null,
                          );
                        }
                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadAll();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(
                                'Jadwal berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}!'),
                            backgroundColor: AppColors.success,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ));
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
                  backgroundColor: const Color(0xFFF59E0B),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12))),
              child: saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text(isEdit ? 'Perbarui' : 'Tambah'),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(Map<String, dynamic> flight) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Hapus Jadwal',
            style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text(
            'Anda yakin ingin menghapus penerbangan "${flight['flightNumber']}"?',
            style: const TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Batal',
                  style: TextStyle(color: AppColors.textSecondary))),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await AdminService.deleteFlight(flight['id']);
                _loadAll();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                    content: Text('Jadwal berhasil dihapus'),
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
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }
}
