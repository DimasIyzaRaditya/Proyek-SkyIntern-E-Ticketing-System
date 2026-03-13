import 'package:flutter/material.dart';
import '../services/seat_service.dart';
import '../models/seat_model.dart';
import '../models/flight_model.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';

class BookingSeatScreen extends StatefulWidget {
  const BookingSeatScreen({super.key});

  @override
  State<BookingSeatScreen> createState() => _BookingSeatScreenState();
}

class _BookingSeatScreenState extends State<BookingSeatScreen> {
  List<Seat> _seats = [];
  final Set<int> _selectedSeatIds = {};
  bool _isLoading = true;
  String? _error;
  bool _isHolding = false;
  bool _isInitialized = false;
  bool _navigatingForward = false;

  late String _flightId;
  late int _adults;
  late int _children;
  FlightCardItem? _flight;
  int? _existingBookingId;

  int get _totalPassengers => _adults + _children;
  String get _flightCode =>
      (_flight?.flightNumber.trim().isNotEmpty ?? false)
          ? _flight!.flightNumber.trim()
          : _flightId;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInitialized) return;
    _isInitialized = true;
    final rawArgs = ModalRoute.of(context)?.settings.arguments;
    final args = rawArgs is Map ? Map<String, dynamic>.from(rawArgs) : null;
    if (args != null) {
      _flightId = args['flightId']?.toString() ?? '';
      _adults = (args['adults'] as int?) ?? 1;
      _children = (args['children'] as int?) ?? 0;
      _flight = args['flight'] as FlightCardItem?;
      _existingBookingId = args['existingBookingId'] as int?;
      _loadSeats();
    } else {
      setState(() {
        _error = 'Data tidak ditemukan';
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    // Hanya lepas seat jika user navigasi kembali (bukan ke halaman berikutnya)
    if (!_navigatingForward) {
      _releaseSelectedSeats();
    }
    super.dispose();
  }

  Future<void> _loadSeats() async {
    try {
      final seats = await SeatService.getFlightSeats(_flightId);
      if (mounted) {
        setState(() {
          _seats = seats;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _toggleSeat(Seat seat) async {
    if (seat.isOccupied || (seat.isHeld && !_selectedSeatIds.contains(seat.id))) {
      return;
    }

    if (_selectedSeatIds.contains(seat.id)) {
      setState(() => _selectedSeatIds.remove(seat.id));
      try {
        await SeatService.releaseSeats(_flightId, [seat.id]);
      } catch (_) {}
    } else {
      if (_selectedSeatIds.length >= _totalPassengers) {
        _showSnack('Maksimal $_totalPassengers kursi yang dapat dipilih');
        return;
      }
      setState(() {
        _selectedSeatIds.add(seat.id);
        _isHolding = true;
      });
      try {
        await SeatService.holdSeats(_flightId, [seat.id]);
      } catch (e) {
        setState(() => _selectedSeatIds.remove(seat.id));
        _showSnack(
            'Kursi tidak dapat dipilih: ${e.toString().replaceFirst('Exception: ', '')}');
      } finally {
        if (mounted) setState(() => _isHolding = false);
      }
    }
  }

  Future<void> _releaseSelectedSeats() async {
    if (_selectedSeatIds.isEmpty) return;
    try {
      await SeatService.releaseSeats(_flightId, _selectedSeatIds.toList());
    } catch (_) {}
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), duration: const Duration(seconds: 2)),
    );
  }

  void _handleContinue() {
    _navigatingForward = true; // jangan lepas seat saat dispose karena navigasi maju
    final selectedSeats =
        _seats.where((s) => _selectedSeatIds.contains(s.id)).toList();
    final extraPrice =
        selectedSeats.fold(0, (sum, s) => sum + s.additionalPrice);
    final rawArgs = ModalRoute.of(context)?.settings.arguments;
    final args = rawArgs is Map ? Map<String, dynamic>.from(rawArgs) : null;
    Navigator.of(context).pushNamed('/booking-passenger', arguments: {
      'flightId': _flightId,
      'flight': _flight,
      'selectedSeats': selectedSeats,
      'seatIds': _selectedSeatIds.toList(),
      'extraPrice': extraPrice,
      'adults': _adults,
      'children': _children,
      'origin': args?['origin'] ?? '',
      'destination': args?['destination'] ?? '',
      if (_existingBookingId != null) 'existingBookingId': _existingBookingId,
    });
  }

  Color _seatColor(Seat seat) {
    if (seat.isOccupied) return const Color(0xFFEF4444);   // merah — sudah terisi
    if (seat.isHeld && !_selectedSeatIds.contains(seat.id)) {
      return const Color(0xFFF59E0B);                       // kuning — ditahan user lain
    }
    if (_selectedSeatIds.contains(seat.id)) return AppColors.primary; // biru — dipilih
    if (seat.additionalPrice > 0) return const Color(0xFFF97316);     // oranye — kursi spesial
    return const Color(0xFF22C55E);                         // hijau cerah — tersedia
  }

  Widget _buildSeatsNotGeneratedWarning() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF59E0B), width: 1.2),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFFDE68A),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFB45309),
                  size: 34,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Kursi Belum Tersedia',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF92400E),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Admin belum melakukan generate seat untuk penerbangan ini.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF92400E),
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFCD34D)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.flight_rounded,
                        size: 18, color: Color(0xFFB45309)),
                    const SizedBox(width: 8),
                    Text(
                      'Kode penerbangan: $_flightCode',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF92400E),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Silakan hubungi admin atau coba lagi nanti.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasNoSeats = !_isLoading && _error == null && _seats.isEmpty;

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
            title: const Text('Pilih Kursi', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Text(_error!,
                      style: const TextStyle(color: AppColors.error)))
              : Column(
                  children: [
                    if (!hasNoSeats) ...[
                      Container(
                        color: AppColors.background,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _legendItem(const Color(0xFF22C55E), 'Tersedia'),
                            _legendItem(AppColors.primary, 'Dipilih'),
                            _legendItem(const Color(0xFFF97316), 'Spesial'),
                            _legendItem(const Color(0xFFEF4444), 'Terisi'),
                          ],
                        ),
                      ),
                      Container(
                        color: AppColors.surfaceVariant,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline,
                                size: 16, color: AppColors.primary),
                            const SizedBox(width: 8),
                            Text('Pilih $_totalPassengers kursi',
                                style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.primaryDark)),
                            const Spacer(),
                            Text(
                              '${_selectedSeatIds.length}/$_totalPassengers dipilih',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryDark,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    Expanded(
                      child: hasNoSeats
                          ? _buildSeatsNotGeneratedWarning()
                          : _buildSeatMap(),
                    ),
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: PrimaryButton(
                          label: 'Lanjut ke Data Penumpang',
                          isDisabled: hasNoSeats,
                          onPressed: _selectedSeatIds.length < _totalPassengers
                              ? () => _showSnack(
                                  'Pilih $_totalPassengers kursi terlebih dahulu')
                              : _handleContinue,
                          isLoading: _isHolding,
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildSeatMap() {
    final Map<String, List<Seat>> rows = {};
    for (final seat in _seats) {
      final rowNum = seat.seatNumber.replaceAll(RegExp(r'[A-Za-z]'), '');
      rows.putIfAbsent(rowNum, () => []);
      rows[rowNum]!.add(seat);
    }
    final sortedRows = rows.keys.toList()
      ..sort((a, b) =>
          (int.tryParse(a) ?? 0).compareTo(int.tryParse(b) ?? 0));

    if (sortedRows.isEmpty) {
      return const Center(
          child: Text('Tidak ada data kursi tersedia',
              style: TextStyle(color: AppColors.textSecondary)));
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(width: 32),
              ...['A', 'B', 'C', '', 'D', 'E', 'F'].map((h) => Container(
                    width: h.isEmpty ? 16 : 40,
                    alignment: Alignment.center,
                    child: Text(h,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 12)),
                  )),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            itemCount: sortedRows.length,
            itemBuilder: (context, i) {
              final rowNum = sortedRows[i];
              final rowSeats = rows[rowNum]!
                ..sort((a, b) => a.seatNumber.compareTo(b.seatNumber));
              return _buildRow(rowNum, rowSeats);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildRow(String rowNum, List<Seat> rowSeats) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 32,
            child: Text(rowNum,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
          ),
          ...rowSeats.asMap().entries.map((entry) {
            final idx = entry.key;
            final seat = entry.value;
            return Row(
              children: [
                if (idx == 3) const SizedBox(width: 16),
                GestureDetector(
                  onTap: () => _toggleSeat(seat),
                  child: Container(
                    width: 36,
                    height: 36,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      color: _seatColor(seat),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: _selectedSeatIds.contains(seat.id)
                            ? AppColors.primaryDark
                            : Colors.transparent,
                        width: 2,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        seat.seatNumber.replaceAll(RegExp(r'[0-9]'), ''),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration:
              BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11)),
      ],
    );
  }
}

