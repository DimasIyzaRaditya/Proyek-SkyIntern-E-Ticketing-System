import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/flight_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/common_widgets.dart';

class SearchResultsScreen extends StatefulWidget {
  const SearchResultsScreen({super.key});

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  String _sortBy = 'price-low';
  Map<String, dynamic>? _args;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _args ??= ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
  }

  final _sortOptions = [
    {'value': 'price-low', 'label': 'Harga Terendah', 'icon': Icons.trending_down_rounded},
    {'value': 'price-high', 'label': 'Harga Tertinggi', 'icon': Icons.trending_up_rounded},
    {'value': 'duration', 'label': 'Durasi', 'icon': Icons.timer_rounded},
    {'value': 'departure', 'label': 'Berangkat', 'icon': Icons.schedule_rounded},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
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
            title: const Text('Hasil Pencarian',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
      body: Consumer<FlightProvider>(
        builder: (context, prov, _) {
          return Column(
            children: [
              // Sort bar
              Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                color: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Urutkan',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _sortOptions.map((opt) {
                          final sel = _sortBy == opt['value'];
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: GestureDetector(
                              onTap: () {
                                setState(() => _sortBy = opt['value'] as String);
                                context.read<FlightProvider>().sortFlights(opt['value'] as String);
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  gradient: sel ? AppColors.primaryGradient : null,
                                  color: sel ? null : AppColors.background,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: sel ? Colors.transparent : AppColors.border),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(opt['icon'] as IconData,
                                        size: 14,
                                        color: sel ? Colors.white : AppColors.textSecondary),
                                    const SizedBox(width: 6),
                                    Text(opt['label'] as String,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: sel ? Colors.white : AppColors.textSecondary,
                                        )),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),

              // Results
              Expanded(
                child: prov.isLoadingFlights
                    ? ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: 4,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, __) => const ShimmerBox(height: 150, width: double.infinity, borderRadius: 16),
                      )
                    : prov.error != null
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: AppColors.error.withValues(alpha: 0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.signal_wifi_bad_rounded, size: 48, color: AppColors.error),
                                ),
                                const SizedBox(height: 16),
                                const Text('Terjadi Kesalahan',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                const SizedBox(height: 8),
                                Text(prov.error ?? 'Kesalahan tidak diketahui',
                                    style: const TextStyle(color: AppColors.textSecondary),
                                    textAlign: TextAlign.center),
                                const SizedBox(height: 20),
                                PrimaryButton(label: 'Kembali', onPressed: () => Navigator.pop(context)),
                              ],
                            ),
                          )
                        : prov.flights.isEmpty
                            ? const EmptyState(
                                icon: Icons.flight_takeoff_rounded,
                                title: 'Tidak ada penerbangan',
                                subtitle: 'Coba ubah tanggal atau pilihan rute Anda',
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.all(16),
                                itemCount: prov.flights.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 12),
                                itemBuilder: (ctx, i) {
                                  final f = prov.flights[i];
                                  return TweenAnimationBuilder<double>(
                                    duration: Duration(milliseconds: 250 + i * 50),
                                    tween: Tween(begin: 0.0, end: 1.0),
                                    curve: Curves.easeOut,
                                    builder: (_, v, child) => Opacity(opacity: v,
                                        child: Transform.translate(offset: Offset(0, 14 * (1 - v)), child: child)),
                                    child: FlightCard(
                                      flightNumber: f.flightNumber,
                                      airline: f.airline,
                                      departureTime: f.departureTime,
                                      arrivalTime: f.arrivalTime,
                                      duration: f.duration,
                                      origin: f.origin,
                                      destination: f.destination,
                                      price: f.price,
                                      facilities: f.facilities,
                                      onTap: () => Navigator.of(ctx).pushNamed(
                                        '/flight-detail',
                                        arguments: {
                                          'flightId': f.id,
                                          'origin': _args?['origin'] ?? '',
                                          'destination': _args?['destination'] ?? '',
                                          'adults': _args?['adults'] ?? 1,
                                          'children': _args?['children'] ?? 0,
                                        },
                                      ),
                                    ),
                                  );
                                },
                              ),
              ),
            ],
          );
        },
      ),
    );
  }
}

