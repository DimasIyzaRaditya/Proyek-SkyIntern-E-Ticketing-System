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
  int? _promoId;

  final TextEditingController _firstNameCtrl = TextEditingController();
  final TextEditingController _lastNameCtrl = TextEditingController();
  final TextEditingController _idNumberCtrl = TextEditingController();

  String _title = 'Mr.';
  String _idType = 'KTP';
  String _nationality = 'Indonesia';
  DateTime? _dob;

  int get _totalPassengers => _adults + _children;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInitialized) return;
    _isInitialized = true;

    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args == null) return;

    _flightId = args['flightId']?.toString() ?? '';
    _adults = (args['adults'] as int?) ?? 1;
    _children = (args['children'] as int?) ?? 0;
    _flight = args['flight'] as FlightCardItem?;
    _selectedSeats = List<Seat>.from((args['selectedSeats'] as List?) ?? []);
    _seatIds = List<int>.from((args['seatIds'] as List?) ?? []);
    _extraPrice = (args['extraPrice'] as int?) ?? 0;
    _existingBookingId = args['existingBookingId'] as int?;
    _promoId = args['promoId'] as int?;

    final user = context.read<AuthProvider>().user;
    final nameParts = user?.fullName.split(' ') ?? [''];
    _firstNameCtrl.text = nameParts.first;
    _lastNameCtrl.text = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _idNumberCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectDob() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(2000),
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _dob = picked);
  }

  String _titleForType(String type) {
    if (type == 'CHILD') {
      return _title == 'Mrs.' ? 'Miss' : 'Mstr.';
    }
    return _title;
  }

  void _handleContinue() {
    if (!_formKey.currentState!.validate()) return;
    if (_dob == null) {
      showSnackBar(context, 'Lengkapi tanggal lahir penumpang', isError: true);
      return;
    }

    final passengers = <Map<String, dynamic>>[];
    for (int i = 0; i < _totalPassengers; i++) {
      final type = i < _adults ? 'ADULT' : 'CHILD';
      passengers.add({
        'title': _titleForType(type),
        'firstName': _firstNameCtrl.text.trim(),
        'lastName': _lastNameCtrl.text.trim(),
        'type': type,
        'nationality': _nationality,
        'idType': _idType,
        'idNumber': _idNumberCtrl.text.trim(),
        'dateOfBirth': DateFormatter.formatDate(_dob!),
      });
    }

    final basePrice = _flight?.price ?? 0;
    final totalPrice = (basePrice + _extraPrice) * _totalPassengers;

    Navigator.of(context).pushNamed('/booking-payment', arguments: {
      'flightId': int.tryParse(_flightId) ?? 0,
      'flight': _flight,
      'passengers': passengers,
      'seatIds': _seatIds,
      'totalPrice': totalPrice,
      if (_promoId != null) 'promoId': _promoId,
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
      body: !_isInitialized
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
                        const SizedBox(height: 12),
                        _buildSinglePassengerForm(),
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
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: AppColors.surfaceVariant,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(f.airline, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('${f.origin} -> ${f.destination}', style: const TextStyle(fontSize: 13)),
            Text('${f.departureTime} - ${f.arrivalTime}',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            if (_seatIds.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text('Kursi: ${_selectedSeats.map((s) => s.seatNumber).join(', ')}',
                  style: const TextStyle(fontSize: 12)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSinglePassengerForm() {
    final inputDecoration = InputDecoration(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      filled: true,
      fillColor: AppColors.surfaceVariant,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Data Penumpang',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
         
          
            const SizedBox(height: 12),
            InputField(
              label: 'Nama Depan',
              controller: _firstNameCtrl,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Nama depan wajib diisi' : null,
            ),
            const SizedBox(height: 12),
            InputField(
              label: 'Nama Belakang',
              controller: _lastNameCtrl,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Nama belakang wajib diisi' : null,
            ),
            const SizedBox(height: 12),
            _labelText('Jenis Identitas'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              initialValue: _idType,
              decoration: inputDecoration,
              items: ['KTP', 'PASSPORT']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                  .toList(),
              onChanged: (v) => setState(() => _idType = v ?? 'KTP'),
            ),
            const SizedBox(height: 12),
            InputField(
              label: 'Nomor Identitas',
              controller: _idNumberCtrl,
              keyboardType: TextInputType.number,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Nomor identitas wajib diisi' : null,
            ),
            const SizedBox(height: 12),
            _labelText('Kewarganegaraan'),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              initialValue: _nationality,
              decoration: inputDecoration,
              items: ['Indonesia', 'Malaysia', 'Singapore', 'Philippines', 'Thailand', 'Other']
                  .map((n) => DropdownMenuItem(value: n, child: Text(n)))
                  .toList(),
              onChanged: (v) => setState(() => _nationality = v ?? 'Indonesia'),
            ),
            const SizedBox(height: 12),
            _labelText('Tanggal Lahir'),
            const SizedBox(height: 8),
            InkWell(
              onTap: _selectDob,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Text(
                      _dob != null
                          ? DateFormatter.formatShortDate(DateFormatter.formatDate(_dob!))
                          : 'Pilih tanggal lahir',
                      style: TextStyle(
                        color: _dob != null ? AppColors.textPrimary : AppColors.textHint,
                      ),
                    ),
                    const Spacer(),
                    const Icon(Icons.calendar_today, size: 16, color: AppColors.primary),
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
    return Text(
      text,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.textSecondary,
      ),
    );
  }
}
