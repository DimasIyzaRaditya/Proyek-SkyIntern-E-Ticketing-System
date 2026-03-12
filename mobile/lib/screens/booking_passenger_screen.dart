import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/flight_model.dart';
import '../models/seat_model.dart';
import '../providers/auth_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';

class BookingPassengerScreen extends StatefulWidget {
  const BookingPassengerScreen({super.key});

  @override
  State<BookingPassengerScreen> createState() => _BookingPassengerScreenState();
}

class _BookingPassengerScreenState extends State<BookingPassengerScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isInitialized = false;
  final bool _isSubmitting = false;

  late int _adults;
  late int _children;
  List<Seat> _selectedSeats = [];
  List<int> _seatIds = [];
  int _extraPrice = 0;
  FlightCardItem? _flight;
  String _flightId = '';
  int? _existingBookingId;

  final List<Map<String, TextEditingController>> _controllers = [];
  final List<String> _titles = [];
  final List<String> _idTypes = [];
  final List<String> _nationalities = [];
  final List<DateTime?> _dobs = [];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInitialized) return;
    _isInitialized = true;

    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args == null) return;

    _flightId = args['flightId']?.toString() ?? '';
    _adults = (args['adults'] as int?) ?? 1;
    _children = (args['children'] as int?) ?? 0;
    _flight = args['flight'] as FlightCardItem?;
    _selectedSeats =
        List<Seat>.from((args['selectedSeats'] as List?) ?? []);
    _seatIds = List<int>.from((args['seatIds'] as List?) ?? []);
    _extraPrice = (args['extraPrice'] as int?) ?? 0;
    _existingBookingId = args['existingBookingId'] as int?;

    final user = context.read<AuthProvider>().user;
    final nameParts = user?.fullName.split(' ') ?? [''];
    final firstName = nameParts.first;
    final lastName =
        nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';

    final total = _adults + _children;
    for (int i = 0; i < total; i++) {
      _controllers.add({
        'firstName':
            TextEditingController(text: i == 0 ? firstName : ''),
        'lastName': TextEditingController(text: i == 0 ? lastName : ''),
        'idNumber': TextEditingController(),
      });
      _titles.add(i < _adults ? 'Mr.' : 'Mstr.');
      _idTypes.add('KTP');
      _nationalities.add('Indonesia');
      _dobs.add(null);
    }
  }

  @override
  void dispose() {
    for (final ctrls in _controllers) {
      for (final c in ctrls.values) {
        c.dispose();
      }
    }
    super.dispose();
  }

  Future<void> _selectDob(int index) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dobs[index] ?? DateTime(2000),
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _dobs[index] = picked);
  }

  void _handleContinue() {
    if (!_formKey.currentState!.validate()) return;
    for (int i = 0; i < _controllers.length; i++) {
      if (_dobs[i] == null) {
        showSnackBar(context,
            'Lengkapi tanggal lahir penumpang ${i + 1}',
            isError: true);
        return;
      }
    }

    final passengers = <Map<String, dynamic>>[];
    for (int i = 0; i < _controllers.length; i++) {
      passengers.add({
        'title': _titles[i],
        'firstName': _controllers[i]['firstName']!.text.trim(),
        'lastName': _controllers[i]['lastName']!.text.trim(),
        'type': i < _adults ? 'ADULT' : 'CHILD',
        'nationality': _nationalities[i],
        'idType': _idTypes[i],
        'idNumber': _controllers[i]['idNumber']!.text.trim(),
        'dateOfBirth': DateFormatter.formatDate(_dobs[i]!),
      });
    }

    final basePrice = _flight?.price ?? 0;
    final totalPassengers = _adults + _children;
    final totalPrice = (basePrice + _extraPrice) * totalPassengers;

    Navigator.of(context).pushNamed('/booking-payment', arguments: {
      'flightId': int.tryParse(_flightId) ?? 0,
      'flight': _flight,
      'passengers': passengers,
      'seatIds': _seatIds,
      'totalPrice': totalPrice,
      if (_existingBookingId != null) 'existingBookingId': _existingBookingId,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
            title: const Text('Data Penumpang', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
      body: _controllers.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: Column(
                children: [
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (_flight != null) _buildFlightSummary(),
                        const SizedBox(height: 16),
                        ...List.generate(_controllers.length, (i) {
                          return _buildPassengerForm(i, i < _adults);
                        }),
                      ],
                    ),
                  ),
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: PrimaryButton(
                        label: 'Lanjut ke Pembayaran',
                        onPressed: _handleContinue,
                        isLoading: _isSubmitting,
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildFlightSummary() {
    final f = _flight!;
    return Card(
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: AppColors.surfaceVariant,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(f.airline,
                style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('${f.origin} â†’ ${f.destination}',
                style: const TextStyle(fontSize: 13)),
            Text('${f.departureTime} - ${f.arrivalTime}',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
            if (_seatIds.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                  'Kursi: ${_selectedSeats.map((s) => s.seatNumber).join(', ')}',
                  style: const TextStyle(fontSize: 12)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPassengerForm(int i, bool isAdult) {
    final inputDecoration = InputDecoration(
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border)),
      filled: true,
      fillColor: AppColors.surfaceVariant,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Penumpang ${i + 1} â€“ ${isAdult ? 'Dewasa' : 'Anak'}',
              style: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _labelText('Gelar / Sapaan'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _titles[i],
              decoration: InputDecoration(
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.border)),
                filled: true,
                fillColor: AppColors.surfaceVariant,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              items: isAdult
                  ? ['Mr.', 'Mrs.', 'Ms.']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList()
                  : ['Mstr.', 'Miss']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
              onChanged: (v) => setState(() => _titles[i] = v ?? _titles[i]),
            ),
            const SizedBox(height: 12),
            InputField(
              label: 'Nama Depan',
              controller: _controllers[i]['firstName'],
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Nama depan wajib diisi'
                  : null,
            ),
            const SizedBox(height: 12),
            InputField(
              label: 'Nama Belakang',
              controller: _controllers[i]['lastName'],
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Nama belakang wajib diisi'
                  : null,
            ),
            const SizedBox(height: 12),
            _labelText('Jenis Identitas'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              initialValue: _idTypes[i],
              decoration: inputDecoration,
              items: ['KTP', 'PASSPORT']
                  .map((t) =>
                      DropdownMenuItem(value: t, child: Text(t)))
                  .toList(),
              onChanged: (v) =>
                  setState(() => _idTypes[i] = v ?? 'KTP'),
            ),
            const SizedBox(height: 12),
            InputField(
              label: 'Nomor Identitas',
              controller: _controllers[i]['idNumber'],
              keyboardType: TextInputType.number,
              validator: (v) => (v == null || v.trim().isEmpty)
                  ? 'Nomor identitas wajib diisi'
                  : null,
            ),
            const SizedBox(height: 12),
            _labelText('Kewarganegaraan'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              initialValue: _nationalities[i],
              decoration: inputDecoration,
              items: [
                'Indonesia',
                'Malaysia',
                'Singapore',
                'Philippines',
                'Thailand',
                'Other'
              ]
                  .map((n) =>
                      DropdownMenuItem(value: n, child: Text(n)))
                  .toList(),
              onChanged: (v) =>
                  setState(() => _nationalities[i] = v ?? 'Indonesia'),
            ),
            const SizedBox(height: 12),
            _labelText('Tanggal Lahir'),
            const SizedBox(height: 8),
            InkWell(
              onTap: () => _selectDob(i),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Text(
                      _dobs[i] != null
                          ? DateFormatter.formatShortDate(
                              DateFormatter.formatDate(_dobs[i]!))
                          : 'Pilih tanggal lahir',
                      style: TextStyle(
                          color: _dobs[i] != null
                              ? AppColors.textPrimary
                              : AppColors.textHint),
                    ),
                    const Spacer(),
                    const Icon(Icons.calendar_today,
                        size: 16, color: AppColors.primary),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _labelText(String text) {
    return Text(text,
        style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary));
  }
}

