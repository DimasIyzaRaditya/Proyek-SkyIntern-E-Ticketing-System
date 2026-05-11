import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../models/flight_model.dart';
import '../providers/flight_provider.dart';
import '../services/api_client.dart';
import '../services/promo_service.dart';
import '../utils/app_theme.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import '../widgets/mobile_side_menu.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen>
    with SingleTickerProviderStateMixin {
  static const String _heroPatternAsset = 'assets/images/home-hero.svg';
  static const String _promoBgAsset = 'assets/images/bg.jpg';

  String? originCode;
  String? destinationCode;
  int? originId;
  int? destinationId;
  late DateTime departureDate;
  late DateTime returnDate;
  int adults = 1;
  int childCount = 0;
  int infantCount = 0;
  bool isRoundTrip = false;
  List<Airport> airports = [];
  List<PromoItem> promos = const [];
  bool isLoadingPromos = false;

  late AnimationController _animCtrl;

  @override
  void initState() {
    super.initState();
    departureDate = DateTime.now().add(const Duration(days: 1));
    returnDate = departureDate.add(const Duration(days: 1));
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _animCtrl.forward();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAirports();
      _loadPromos();
    });
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAirports() async {
    try {
      final fp = context.read<FlightProvider>();
      await fp.loadAirports();
      if (mounted) setState(() => airports = fp.airports);
    } catch (e) {
      if (mounted) showSnackBar(context, 'Gagal memuat bandara', isError: true);
    }
  }

  Future<void> _loadPromos() async {
    try {
      setState(() => isLoadingPromos = true);
      final activePromos = await PromoService.getActivePromos();
      if (!mounted) return;
      setState(() => promos = activePromos.take(6).toList());
    } catch (_) {
      if (mounted) {
        showSnackBar(context, 'Gagal memuat promo', isError: true);
      }
    } finally {
      if (mounted) {
        setState(() => isLoadingPromos = false);
      }
    }
  }

  Future<void> _selectDate(bool isReturn) async {
    final pickerTitle = isReturn
        ? 'Pilih Tanggal Pulang'
        : 'Pilih Tanggal Pergi';
    final picked = await showDatePicker(
      context: context,
      initialDate: isReturn ? returnDate : departureDate,
      firstDate: isReturn ? departureDate : DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: pickerTitle,
      fieldLabelText: pickerTitle,
      confirmText: 'Pilih',
      cancelText: 'Batal',
      builder: (ctx, child) => Theme(
        data: ThemeData(
          colorScheme: const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        if (isReturn) {
          returnDate = picked;
        } else {
          departureDate = picked;
          if (returnDate.isBefore(departureDate)) {
            returnDate = departureDate.add(const Duration(days: 1));
          }
        }
      });
    }
  }

  Future<void> _handleSearch() async {
    if (originId == null || destinationId == null) {
      showSnackBar(
        context,
        'Pilih bandara keberangkatan dan tujuan',
        isError: true,
      );
      return;
    }
    if (originCode == destinationCode) {
      showSnackBar(
        context,
        'Bandara asal dan tujuan tidak boleh sama',
        isError: true,
      );
      return;
    }
    try {
      final fp = context.read<FlightProvider>();
      await fp.searchFlights(
        originId: originId!.toString(),
        destinationId: destinationId!.toString(),
        departureDate: DateFormatter.formatDate(departureDate),
        returnDate: isRoundTrip ? DateFormatter.formatDate(returnDate) : null,
        adult: adults.toString(),
        child: childCount.toString(),
        page: 1,
        limit: 20,
      );
      if (mounted) {
        Navigator.pushNamed(
          context,
          '/search-results',
          arguments: {
            'origin': originCode,
            'destination': destinationCode,
            'originId': originId,
            'destinationId': destinationId,
            'adults': adults,
            'children': childCount,
            'infants': infantCount,
            'departureDate': DateFormatter.formatDate(departureDate),
            if (isRoundTrip) 'returnDate': DateFormatter.formatDate(returnDate),
          },
        );
      }
    } catch (e) {
      if (mounted) showSnackBar(context, e.toString(), isError: true);
    }
  }

  Future<List<FlightCardItem>> _loadPromoFlightChoices() async {
    final response = await ApiClient.get(
      '/api/flights/search?sortBy=departure-asc&limit=200',
    );
    final flights = response['flights'] as List? ?? const [];
    return flights
        .map(
          (item) =>
              FlightCardItem.fromJson(Map<String, dynamic>.from(item as Map)),
        )
        .toList();
  }

  void _openPromoFlightDetail(PromoItem promo, {FlightCardItem? flight}) {
    final flightId = promo.isFlightPromo ? promo.flightId : flight?.id;
    if (flightId == null || flightId.isEmpty) {
      showSnackBar(
        context,
        'Penerbangan untuk promo ini tidak tersedia',
        isError: true,
      );
      return;
    }

    Navigator.pushNamed(
      context,
      '/flight-detail',
      arguments: {
        'flightId': flightId,
        'origin': promo.isFlightPromo
            ? (promo.origin ?? '')
            : (flight?.origin ?? ''),
        'destination': promo.isFlightPromo
            ? (promo.destination ?? '')
            : (flight?.destination ?? ''),
        'adults': adults,
        'children': childCount,
        'infants': infantCount,
        'promoId': promo.id,
      },
    );
  }

  Future<void> _handlePromoTap(PromoItem promo) async {
    if (promo.isFlightPromo) {
      _openPromoFlightDetail(promo);
      return;
    }

    final selectedFlight = await showModalBottomSheet<FlightCardItem>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        final maxHeight = MediaQuery.of(ctx).size.height * 0.76;
        return SafeArea(
          child: SizedBox(
            height: maxHeight,
            child: FutureBuilder<List<FlightCardItem>>(
              future: _loadPromoFlightChoices(),
              builder: (ctx, snapshot) {
                final flights = snapshot.data ?? const <FlightCardItem>[];

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(18, 16, 10, 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  promo.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Pilih penerbangan untuk memakai promo ${promo.discount}%',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.pop(ctx),
                            icon: const Icon(Icons.close_rounded),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1, color: Color(0xFFE5E7EB)),
                    if (snapshot.connectionState == ConnectionState.waiting)
                      const Expanded(
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else if (snapshot.hasError)
                      Expanded(
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: Text(
                              'Gagal memuat penerbangan: ${snapshot.error}',
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: AppColors.error),
                            ),
                          ),
                        ),
                      )
                    else if (flights.isEmpty)
                      const Expanded(
                        child: Center(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: Text(
                              'Belum ada penerbangan yang tersedia.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Color(0xFF64748B)),
                            ),
                          ),
                        ),
                      )
                    else
                      Expanded(
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(14, 12, 14, 18),
                          itemCount: flights.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 10),
                          itemBuilder: (_, index) {
                            final flight = flights[index];
                            return InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () => Navigator.pop(ctx, flight),
                              child: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 42,
                                      height: 42,
                                      decoration: BoxDecoration(
                                        gradient: AppColors.primaryGradient,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Icon(
                                        Icons.flight_takeoff_rounded,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            '${flight.origin} → ${flight.destination}',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w800,
                                              color: Color(0xFF0F172A),
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            '${flight.flightNumber} • ${flight.departureTime} - ${flight.arrivalTime}',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      CurrencyFormatter.formatPrice(
                                        flight.price,
                                      ),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF2563EB),
                                      ),
                                    ),
                                  ],
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
          ),
        );
      },
    );

    if (!mounted || selectedFlight == null) return;
    _openPromoFlightDetail(promo, flight: selectedFlight);
  }

  Future<void> _showGuestPicker() async {
    int tempAdults = adults;
    int tempChildren = childCount;
    int tempInfants = infantCount;

    final applied = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Jumlah Penumpang',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 16),
                  _guestCounterRow(
                    label: 'Dewasa',
                    count: tempAdults,
                    onDec: tempAdults > 1
                        ? () => setModalState(() {
                            tempAdults--;
                            if (tempInfants > tempAdults) {
                              tempInfants = tempAdults;
                            }
                          })
                        : null,
                    onInc: () => setModalState(() => tempAdults++),
                  ),
                  const SizedBox(height: 12),
                  _guestCounterRow(
                    label: 'Anak',
                    count: tempChildren,
                    onDec: tempChildren > 0
                        ? () => setModalState(() => tempChildren--)
                        : null,
                    onInc: () => setModalState(() => tempChildren++),
                  ),
                  const SizedBox(height: 12),
                  _guestCounterRow(
                    label: 'Bayi',
                    count: tempInfants,
                    onDec: tempInfants > 0
                        ? () => setModalState(() => tempInfants--)
                        : null,
                    onInc: tempInfants < tempAdults
                        ? () => setModalState(() => tempInfants++)
                        : () {
                            showSnackBar(
                              context,
                              '1 dewasa hanya boleh membawa 1 bayi',
                              isError: true,
                            );
                          },
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: const Text(
                      'Dewasa/Anak mendapat kursi, Bayi tidak mendapat kursi sendiri.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Terapkan'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    if (applied == true && mounted) {
      setState(() {
        adults = tempAdults;
        childCount = tempChildren;
        infantCount = tempInfants;
      });
    }
  }

  Widget _guestCounterRow({
    required String label,
    required int count,
    required VoidCallback? onDec,
    required VoidCallback onInc,
  }) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
        ),
        IconButton(
          onPressed: onDec,
          icon: const Icon(Icons.remove_circle_outline),
          color: onDec == null ? AppColors.textHint : AppColors.primary,
        ),
        SizedBox(
          width: 30,
          child: Text(
            '$count',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
          ),
        ),
        IconButton(
          onPressed: onInc,
          icon: const Icon(Icons.add_circle_outline),
          color: AppColors.primary,
        ),
      ],
    );
  }

  Future<void> _openMobileMenu() async {
    await MobileSideMenu.show(context, activeItem: 'Flights');
  }

  void _showAirportPicker(bool isOrigin) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final searchCtrl = TextEditingController();
        List<Airport> filtered = List.from(airports);

        return StatefulBuilder(
          builder: (ctx, setModalState) {
            void onSearch(String query) {
              final q = query.toLowerCase().trim();
              setModalState(() {
                if (q.isEmpty || q.length < 3) {
                  filtered = List.from(airports);
                  return;
                }

                filtered = airports
                    .where(
                      (a) =>
                          a.code.toLowerCase().contains(q) ||
                          a.city.toLowerCase().contains(q) ||
                          a.airportName.toLowerCase().contains(q),
                    )
                    .toList();
              });
            }

            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              decoration: const BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            isOrigin
                                ? Icons.flight_takeoff_rounded
                                : Icons.flight_land_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          isOrigin
                              ? 'Pilih Bandara Asal'
                              : 'Pilih Bandara Tujuan',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Search field
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                    child: TextField(
                      controller: searchCtrl,
                      onChanged: onSearch,
                      autofocus: true,
                      decoration: InputDecoration(
                        hintText: 'Cari kota, bandara, atau kode...',
                        hintStyle: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                        ),
                        prefixIcon: const Icon(
                          Icons.search_rounded,
                          color: AppColors.primary,
                          size: 20,
                        ),
                        suffixIcon: ValueListenableBuilder<TextEditingValue>(
                          valueListenable: searchCtrl,
                          builder: (_, val, __) => val.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(
                                    Icons.close_rounded,
                                    size: 18,
                                    color: AppColors.textSecondary,
                                  ),
                                  onPressed: () {
                                    searchCtrl.clear();
                                    onSearch('');
                                  },
                                )
                              : const SizedBox.shrink(),
                        ),
                        filled: true,
                        fillColor: AppColors.background,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: AppColors.primary,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: airports.isEmpty
                        ? const Center(child: CircularProgressIndicator())
                        : filtered.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.search_off_rounded,
                                  size: 48,
                                  color: AppColors.textSecondary.withValues(
                                    alpha: 0.4,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'Bandara tidak ditemukan',
                                  style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const Divider(
                              height: 1,
                              indent: 16,
                              endIndent: 16,
                            ),
                            itemBuilder: (ctx, i) {
                              final a = filtered[i];
                              final isSelected = isOrigin
                                  ? originCode == a.code
                                  : destinationCode == a.code;
                              return ListTile(
                                leading: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppColors.primary.withValues(
                                            alpha: 0.1,
                                          )
                                        : AppColors.background,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    a.code,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: isSelected
                                          ? AppColors.primary
                                          : AppColors.textSecondary,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                title: Text(
                                  a.city,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: isSelected
                                        ? AppColors.primary
                                        : AppColors.textPrimary,
                                  ),
                                ),
                                subtitle: Text(
                                  a.airportName,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                trailing: isSelected
                                    ? const Icon(
                                        Icons.check_circle_rounded,
                                        color: AppColors.primary,
                                        size: 20,
                                      )
                                    : null,
                                onTap: () {
                                  setState(() {
                                    if (isOrigin) {
                                      originCode = a.code;
                                      originId = a.id;
                                    } else {
                                      destinationCode = a.code;
                                      destinationId = a.id;
                                    }
                                  });
                                  Navigator.pop(ctx);
                                },
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 600;
    final originAirport = originCode != null
        ? airports.where((a) => a.code == originCode).firstOrNull
        : null;
    final destinationAirport = destinationCode != null
        ? airports.where((a) => a.code == destinationCode).firstOrNull
        : null;
    final originDisplay = originAirport != null
        ? '${originAirport.city}, ${originAirport.country} (${originAirport.code})'
        : 'Pilih keberangkatan';
    final destinationDisplay = destinationAirport != null
        ? '${destinationAirport.city}, ${destinationAirport.country} (${destinationAirport.code})'
        : 'Pilih tujuan';

    return Scaffold(
      backgroundColor: const Color(0xFFF3F6FB),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0C3B7E), Color(0xFF1D4E9B)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            boxShadow: [
              BoxShadow(
                color: Color(0x1F1F3A5F),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            title: Row(
              children: const [
                Icon(
                  Icons.airplanemode_active_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                SizedBox(width: 8),
                Text(
                  'SkyIntern',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
            actions: [
              Container(
                width: 44,
                height: 44,
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white54),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: InkWell(
                  onTap: _openMobileMenu,
                  borderRadius: BorderRadius.circular(14),
                  child: const Icon(Icons.menu_rounded, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/chatbot'),
        backgroundColor: const Color(0xFF3B5BFF),
        foregroundColor: Colors.white,
        child: const Icon(Icons.chat_bubble_outline_rounded),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: EdgeInsets.fromLTRB(
                isWide ? 34 : 16,
                isWide ? 18 : 16,
                isWide ? 34 : 16,
                26,
              ),
              decoration: const BoxDecoration(color: Color(0xFF0B1F3B)),
              child: Stack(
                children: [
                  const Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment(-0.9, -1.0),
                          end: Alignment(1.0, 1.0),
                          colors: [
                            Color(0x6E06182C),
                            Color(0x430C2D54),
                            Color(0x7A081424),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: IgnorePointer(
                      child: Opacity(
                        opacity: 0.09,
                        child: SvgPicture.asset(
                          _heroPatternAsset,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                  Center(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(maxWidth: isWide ? 760 : 520),
                      child: Column(
                        children: [
                          const SizedBox(height: 4),
                          Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.fromLTRB(14, 18, 14, 0),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(24),
                              gradient: const LinearGradient(
                                colors: [Color(0xBA1B4E8A), Color(0xAA2B6CB0)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              border: Border.all(color: Colors.white30),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x26071A38),
                                  blurRadius: 18,
                                  offset: Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                const Text(
                                  'Terbang ke mana hari ini?',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 21,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Temukan tiket penerbangan terbaik dengan mudah & cepat.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Color(0xFFD0E2FF),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 26),
                                Container(
                                  margin: const EdgeInsets.fromLTRB(
                                    6,
                                    0,
                                    6,
                                    12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(22),
                                    border: Border.all(
                                      color: const Color(0xFFD8DEE9),
                                    ),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Color(0x12111827),
                                        blurRadius: 14,
                                        offset: Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    children: [
                                      const Padding(
                                        padding: EdgeInsets.fromLTRB(
                                          14,
                                          14,
                                          14,
                                          8,
                                        ),
                                        child: Align(
                                          alignment: Alignment.centerLeft,
                                          child: Text(
                                            'Keberangkatan & Tujuan',
                                            style: TextStyle(
                                              color: Color(0xFF475569),
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 0.2,
                                            ),
                                          ),
                                        ),
                                      ),
                                      InkWell(
                                        onTap: () => _showAirportPicker(true),
                                        child: Padding(
                                          padding: const EdgeInsets.fromLTRB(
                                            12,
                                            12,
                                            12,
                                            8,
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(
                                                Icons.flight_takeoff_rounded,
                                                color: Color(0xFF2563EB),
                                                size: 20,
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  originDisplay,
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.w700,
                                                    color: Color(0xFF111827),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      const Divider(
                                        height: 1,
                                        thickness: 1,
                                        color: Color(0xFFE9EEF5),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 6,
                                        ),
                                        child: GestureDetector(
                                          onTap: () => setState(() {
                                            final tmpCode = originCode;
                                            originCode = destinationCode;
                                            destinationCode = tmpCode;
                                            final tmpId = originId;
                                            originId = destinationId;
                                            destinationId = tmpId;
                                          }),
                                          child: Container(
                                            width: 38,
                                            height: 38,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF8FAFC),
                                              shape: BoxShape.circle,
                                              border: Border.all(
                                                color: const Color(0xFFD5DCE8),
                                              ),
                                              boxShadow: const [
                                                BoxShadow(
                                                  color: Color(0x330F172A),
                                                  blurRadius: 8,
                                                  offset: Offset(0, 2),
                                                ),
                                              ],
                                            ),
                                            child: const Icon(
                                              Icons.swap_vert_rounded,
                                              color: Color(0xFF2563EB),
                                              size: 20,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const Divider(
                                        height: 1,
                                        thickness: 1,
                                        color: Color(0xFFE9EEF5),
                                      ),
                                      InkWell(
                                        onTap: () => _showAirportPicker(false),
                                        child: Padding(
                                          padding: const EdgeInsets.fromLTRB(
                                            12,
                                            4,
                                            12,
                                            12,
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(
                                                Icons.flight_land_rounded,
                                                color: Color(0xFF2563EB),
                                                size: 20,
                                              ),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  destinationDisplay,
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                  style: const TextStyle(
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.w700,
                                                    color: Color(0xFF111827),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      const Padding(
                                        padding: EdgeInsets.fromLTRB(
                                          14,
                                          8,
                                          14,
                                          0,
                                        ),
                                        child: Align(
                                          alignment: Alignment.centerLeft,
                                          child: Text(
                                            'Tanggal Pergi & Pulang',
                                            style: TextStyle(
                                              color: Color(0xFF475569),
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 0.2,
                                            ),
                                          ),
                                        ),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.fromLTRB(
                                          14,
                                          8,
                                          14,
                                          10,
                                        ),
                                        child: Row(
                                          children: [
                                            SizedBox(
                                              width: 18,
                                              height: 18,
                                              child: Checkbox(
                                                value: isRoundTrip,
                                                activeColor: const Color(
                                                  0xFF2563EB,
                                                ),
                                                materialTapTargetSize:
                                                    MaterialTapTargetSize
                                                        .shrinkWrap,
                                                onChanged: (value) {
                                                  setState(() {
                                                    isRoundTrip =
                                                        value ?? false;
                                                    if (isRoundTrip &&
                                                        !returnDate.isAfter(
                                                          departureDate,
                                                        )) {
                                                      returnDate = departureDate
                                                          .add(
                                                            const Duration(
                                                              days: 1,
                                                            ),
                                                          );
                                                    }
                                                  });
                                                },
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            const Text(
                                              'Tanggal pulang',
                                              style: TextStyle(
                                                color: Color(0xFF334155),
                                                fontSize: 13,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const Divider(
                                        height: 1,
                                        thickness: 1,
                                        color: Color(0xFFE5E7EB),
                                      ),
                                      InkWell(
                                        onTap: () async {
                                          await _selectDate(false);
                                          if (!mounted || !isRoundTrip) return;
                                          await _selectDate(true);
                                        },
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 14,
                                            vertical: 12,
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(
                                                Icons.calendar_today_rounded,
                                                color: Color(0xFF2563EB),
                                                size: 20,
                                              ),
                                              const SizedBox(width: 10),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      isRoundTrip
                                                          ? '${DateFormatter.formatShortDate(DateFormatter.formatDate(departureDate))} - ${DateFormatter.formatShortDate(DateFormatter.formatDate(returnDate))}'
                                                          : DateFormatter.formatShortDate(
                                                              DateFormatter.formatDate(
                                                                departureDate,
                                                              ),
                                                            ),
                                                      style: const TextStyle(
                                                        fontSize: 15,
                                                        fontWeight:
                                                            FontWeight.w700,
                                                        color: Color(
                                                          0xFF111827,
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(height: 2),
                                                    Text(
                                                      isRoundTrip
                                                          ? 'Kalender pertama untuk tanggal pergi, lalu pilih tanggal pulang.'
                                                          : 'Mode sekali jalan: pilih tanggal pergi saja.',
                                                      style: const TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        color: Color(
                                                          0xFF64748B,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      const Padding(
                                        padding: EdgeInsets.fromLTRB(
                                          14,
                                          8,
                                          14,
                                          0,
                                        ),
                                        child: Align(
                                          alignment: Alignment.centerLeft,
                                          child: Text(
                                            'Penumpang',
                                            style: TextStyle(
                                              color: Color(0xFF475569),
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 0.2,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const Divider(
                                        height: 1,
                                        thickness: 1,
                                        color: Color(0xFFE5E7EB),
                                      ),
                                      InkWell(
                                        onTap: _showGuestPicker,
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 14,
                                            vertical: 12,
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(
                                                Icons.people_outline_rounded,
                                                color: Color(0xFF2563EB),
                                                size: 22,
                                              ),
                                              const SizedBox(width: 10),
                                              Text(
                                                '$adults Dewasa, $childCount Anak, $infantCount Bayi',
                                                style: const TextStyle(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.w700,
                                                  color: Color(0xFF111827),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                      const Divider(
                                        height: 1,
                                        thickness: 1,
                                        color: Color(0xFFE5E7EB),
                                      ),
                                      Consumer<FlightProvider>(
                                        builder: (_, fp, __) => SizedBox(
                                          width: double.infinity,
                                          child: TextButton.icon(
                                            onPressed: fp.isLoadingFlights
                                                ? null
                                                : _handleSearch,
                                            icon: const Icon(
                                              Icons.search_rounded,
                                              color: Colors.white,
                                              size: 28,
                                            ),
                                            label: Text(
                                              fp.isLoadingFlights
                                                  ? 'Mencari...'
                                                  : 'Cari Tiket',
                                              style: const TextStyle(
                                                fontSize: 19,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.white,
                                              ),
                                            ),
                                            style: TextButton.styleFrom(
                                              backgroundColor: const Color(
                                                0xFFFF7A1A,
                                              ),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical: 16,
                                                  ),
                                              shape:
                                                  const RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.only(
                                                          bottomLeft:
                                                              Radius.circular(
                                                                20,
                                                              ),
                                                          bottomRight:
                                                              Radius.circular(
                                                                20,
                                                              ),
                                                        ),
                                                  ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                isWide ? 26 : 16,
                24,
                isWide ? 26 : 16,
                0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 16),
                  _buildPromoSection(isWide),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPromoSection(bool isWide) {
    if (isLoadingPromos) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (promos.isEmpty) {
      return Container(
        margin: const EdgeInsets.only(bottom: 20),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE6EAF2)),
        ),
        child: const Row(
          children: [
            Icon(Icons.local_offer_outlined, color: Color(0xFF64748B)),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Belum ada promo aktif saat ini.',
                style: TextStyle(color: Color(0xFF64748B)),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Promo Aktif',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: isWide ? 190 : 176,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: promos.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) {
              final promo = promos[i];
              final until = promo.endDate != null
                  ? DateFormatter.formatDate(promo.endDate!)
                  : null;
              return SizedBox(
                width: isWide ? 360 : 310,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => _handlePromoTap(promo),
                  child: Ink(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x1E0F172A),
                          blurRadius: 12,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.asset(
                              _promoBgAsset,
                              fit: BoxFit.cover,
                              alignment: Alignment.centerRight,
                              filterQuality: FilterQuality.medium,
                              errorBuilder: (_, __, ___) =>
                                  Container(color: const Color(0xFF1D4E9B)),
                            ),
                          ),
                        ),
                        Positioned.fill(
                          child: IgnorePointer(
                            child: Opacity(
                              opacity: 0.06,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: SvgPicture.asset(
                                  _heroPatternAsset,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          ),
                        ),
                        Positioned.fill(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              gradient: const LinearGradient(
                                colors: [
                                  Color(0x7A06182C),
                                  Color(0x520C2D54),
                                  Color(0x8A081424),
                                ],
                                begin: Alignment(-0.9, -1.0),
                                end: Alignment(1.0, 1.0),
                              ),
                              border: Border.fromBorderSide(
                                BorderSide(color: Color(0x33FFFFFF)),
                              ),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      'HEMAT ${promo.discount}%',
                                      style: const TextStyle(
                                        color: Color(0xFF1E3A8A),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  Icon(
                                    promo.isFlightPromo
                                        ? Icons.flight_takeoff_rounded
                                        : Icons.public_rounded,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(
                                promo.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if ((promo.description ?? '')
                                  .trim()
                                  .isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  promo.description!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Color(0xFFDDE8FF),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                              const Spacer(),
                              Text(
                                promo.sourceLabel ?? 'Promo SkyIntern',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (until != null)
                                Text(
                                  'Berlaku sampai $until',
                                  style: const TextStyle(
                                    color: Color(0xFFD3E1FF),
                                    fontSize: 11,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
