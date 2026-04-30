import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/flight_provider.dart';
import '../services/promo_service.dart';
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
  bool _isLoadingPromos = false;
  List<PromoItem> _promos = const [];
  int _page = 1;
  final int _perPage = 20;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _args ??= ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (_promos.isEmpty && !_isLoadingPromos) {
      _loadPromos();
    }
  }

  Future<void> _requestPage(int page) async {
    final args = _args;
    if (args == null) return;
    final originId = args['originId']?.toString();
    final destinationId = args['destinationId']?.toString();
    final departureDate = args['departureDate']?.toString();
    if (originId == null || destinationId == null || departureDate == null) {
      return;
    }

    final adult = (args['adults'] ?? 1).toString();
    final child = (args['children'] ?? 0).toString();
    final returnDate = args['returnDate']?.toString();

    setState(() => _page = page);
    await context.read<FlightProvider>().searchFlights(
          originId: originId,
          destinationId: destinationId,
          departureDate: departureDate,
          returnDate: returnDate,
          adult: adult,
          child: child,
          page: page,
          limit: _perPage,
        );
  }

  Future<void> _loadPromos() async {
    setState(() => _isLoadingPromos = true);
    try {
      final promos = await PromoService.getActivePromos();
      if (!mounted) return;
      setState(() => _promos = promos);
    } catch (_) {
      if (!mounted) return;
      setState(() => _promos = const []);
    } finally {
      if (mounted) setState(() => _isLoadingPromos = false);
    }
  }

  Future<int?> _pickPromoForFlight(String flightId) async {
    final applicable = _promos
        .where((p) => !p.isFlightPromo || p.flightId == flightId)
        .toList()
      ..sort((a, b) => b.discount.compareTo(a.discount));

    if (applicable.isEmpty) return null;

    int? selectedPromoId;
    final picked = await showModalBottomSheet<int?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pilih Promo',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Pilih promo sebelum melihat detail penerbangan',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 10),
                  RadioListTile<int?>(
                    value: null,
                    groupValue: selectedPromoId,
                    onChanged: (value) => setModalState(() => selectedPromoId = value),
                    title: const Text('Tanpa Promo'),
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                  ...applicable.map(
                    (promo) => RadioListTile<int?>(
                      value: promo.id,
                      groupValue: selectedPromoId,
                      onChanged: (value) => setModalState(() => selectedPromoId = value),
                      title: Text('${promo.title} (${promo.discount}%)'),
                      subtitle: promo.sourceLabel != null
                          ? Text(
                              promo.sourceLabel!,
                              style: const TextStyle(fontSize: 11),
                            )
                          : null,
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx, selectedPromoId),
                      child: const Text('Lanjut ke Detail'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    return picked;
  }

  Future<void> _openFlightDetail(BuildContext ctx, dynamic flightId) async {
    final flightIdStr = flightId.toString();
    final selectedPromoId = _isLoadingPromos
        ? null
        : await _pickPromoForFlight(flightIdStr);

    if (!mounted) return;

    Navigator.of(ctx).pushNamed(
      '/flight-detail',
      arguments: {
        'flightId': flightId,
        'origin': _args?['origin'] ?? '',
        'destination': _args?['destination'] ?? '',
        'adults': _args?['adults'] ?? 1,
        'children': _args?['children'] ?? 0,
        'infants': _args?['infants'] ?? 0,
        'promoId': selectedPromoId,
      },
    );
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
                            : Column(
                                children: [
                                  Expanded(
                                    child: ListView.separated(
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
                                            airlineLogo: f.logo,
                                            departureTime: f.departureTime,
                                            arrivalTime: f.arrivalTime,
                                            duration: f.duration,
                                            origin: f.origin,
                                            destination: f.destination,
                                            price: f.price,
                                            facilities: f.facilities,
                                            onTap: () => _openFlightDetail(ctx, f.id),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                                    child: ListPaginationBar(
                                      currentPage: _page,
                                      totalItems: prov.pagination?.totalItems ?? prov.flights.length,
                                      itemsPerPage: _perPage,
                                      onPageChanged: _requestPage,
                                    ),
                                  ),
                                ],
                              ),
              ),
            ],
          );
        },
      ),
    );
  }
}

