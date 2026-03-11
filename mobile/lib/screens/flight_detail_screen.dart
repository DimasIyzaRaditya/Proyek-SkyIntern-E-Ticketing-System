import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/flight_service.dart';
import '../models/flight_model.dart';
import '../providers/auth_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';
import '../utils/formatters.dart';

class FlightDetailScreen extends StatefulWidget {
  const FlightDetailScreen({super.key});

  @override
  State<FlightDetailScreen> createState() => _FlightDetailScreenState();
}

class _FlightDetailScreenState extends State<FlightDetailScreen> {
  FlightCardItem? _flight;
  bool _isLoading = true;
  String? _error;
  bool _isInitialized = false;

  String _flightId = '';
  int _adults = 1;
  int _children = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInitialized) return;
    _isInitialized = true;
    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      _flightId = args['flightId']?.toString() ?? '';
      _adults = (args['adults'] as int?) ?? 1;
      _children = (args['children'] as int?) ?? 0;
      if (_flightId.isNotEmpty) _loadDetail();
    } else {
      setState(() {
        _error = 'Tidak ada data penerbangan';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadDetail() async {
    try {
      final flight = await FlightService.getFlightDetail(_flightId);
      if (mounted) {
        setState(() {
          _flight = flight;
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

  void _handleSelectSeat() {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Login Diperlukan'),
          content: const Text(
              'Silakan login terlebih dahulu untuk memesan tiket.'),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Batal')),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.of(context).pushNamed('/login');
              },
              child: const Text('Login'),
            ),
          ],
        ),
      );
      return;
    }

    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    Navigator.of(context).pushNamed('/booking-seat', arguments: {
      'flightId': _flightId,
      'flight': _flight,
      'adults': _adults,
      'children': _children,
      'origin': args?['origin'] ?? _flight?.origin ?? '',
      'destination': args?['destination'] ?? _flight?.destination ?? '',
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
            boxShadow: [BoxShadow(color: Color(0x220EA5E9), blurRadius: 12, offset: Offset(0, 4))],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text('Detail Penerbangan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
                      const Icon(Icons.error_outline,
                          size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_error!,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      PrimaryButton(
                          label: 'Kembali',
                          width: 140,
                          onPressed: () => Navigator.pop(context)),
                    ],
                  ),
                )
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    final f = _flight!;
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(f.airline,
                                style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.blue.shade700)),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(f.flightNumber,
                                  style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.blue.shade700)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(f.departureTime,
                                      style: const TextStyle(
                                          fontSize: 32,
                                          fontWeight: FontWeight.bold)),
                                  Text(f.origin,
                                      style: TextStyle(
                                          color: Colors.grey.shade600)),
                                ],
                              ),
                            ),
                            Column(
                              children: [
                                const Icon(Icons.flight, color: Colors.blue),
                                Text(f.duration,
                                    style: const TextStyle(
                                        fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(f.arrivalTime,
                                      style: const TextStyle(
                                          fontSize: 32,
                                          fontWeight: FontWeight.bold)),
                                  Text(f.destination,
                                      style: TextStyle(
                                          color: Colors.grey.shade600),
                                      textAlign: TextAlign.end),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _infoCard('Informasi Pesawat', [
                  _infoRow(Icons.airplanemode_active, 'Pesawat', f.aircraft),
                  _infoRow(Icons.confirmation_number, 'Nomor Penerbangan',
                      f.flightNumber),
                ]),
                const SizedBox(height: 16),
                Card(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Fasilitas',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: f.facilities
                              .map((fac) => Chip(
                                    label: Text(fac,
                                        style:
                                            const TextStyle(fontSize: 12)),
                                    backgroundColor: Colors.blue.shade50,
                                  ))
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Harga per orang',
                          style: TextStyle(color: Colors.grey.shade700)),
                      Text(
                        CurrencyFormatter.formatPrice(f.price),
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue.shade700),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: PrimaryButton(
                label: 'Pilih Kursi', onPressed: _handleSelectSeat),
          ),
        ),
      ],
    );
  }

  Widget _infoCard(String title, List<Widget> rows) {
    return Card(
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...rows,
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.blue.shade600),
          const SizedBox(width: 8),
          Text(label,
              style:
                  TextStyle(fontSize: 14, color: Colors.grey.shade600)),
          const Spacer(),
          Text(value,
              style: const TextStyle(
                  fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

