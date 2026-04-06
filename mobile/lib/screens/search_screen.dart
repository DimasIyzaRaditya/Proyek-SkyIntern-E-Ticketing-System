import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/flight_model.dart';
import '../providers/flight_provider.dart';
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
  String? originCode;
  String? destinationCode;
  int? originId;
  int? destinationId;
  late DateTime departureDate;
  late DateTime returnDate;
  int adults = 1;
  int childCount = 0;
  bool isRoundTrip = false;
  List<Airport> airports = [];

  late AnimationController _animCtrl;

  @override
  void initState() {
    super.initState();
    departureDate = DateTime.now().add(const Duration(days: 1));
    returnDate = departureDate.add(const Duration(days: 1));
    _animCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _animCtrl.forward();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAirports());
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

  Future<void> _selectDate(bool isReturn) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isReturn ? returnDate : departureDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
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
      showSnackBar(context, 'Pilih bandara keberangkatan dan tujuan',
          isError: true);
      return;
    }
    if (originCode == destinationCode) {
      showSnackBar(context, 'Bandara asal dan tujuan tidak boleh sama',
          isError: true);
      return;
    }
    try {
      final fp = context.read<FlightProvider>();
      await fp.searchFlights(
        originId: originId!.toString(),
        destinationId: destinationId!.toString(),
        departureDate: DateFormatter.formatDate(departureDate),
        returnDate:
            isRoundTrip ? DateFormatter.formatDate(returnDate) : null,
        adult: adults.toString(),
        child: childCount.toString(),
      );
      if (mounted) {
        Navigator.pushNamed(context, '/search-results', arguments: {
          'origin': originCode,
          'destination': destinationCode,
          'adults': adults,
          'children': childCount,
        });
      }
    } catch (e) {
      if (mounted) showSnackBar(context, e.toString(), isError: true);
    }
  }

  Future<void> _showGuestPicker() async {
    int tempAdults = adults;
    int tempChildren = childCount;

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
                    'Guests',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 16),
                  _guestCounterRow(
                    label: 'Adult',
                    count: tempAdults,
                    onDec: tempAdults > 1
                        ? () => setModalState(() => tempAdults--)
                        : null,
                    onInc: () => setModalState(() => tempAdults++),
                  ),
                  const SizedBox(height: 12),
                  _guestCounterRow(
                    label: 'Child',
                    count: tempChildren,
                    onDec: tempChildren > 0
                        ? () => setModalState(() => tempChildren--)
                        : null,
                    onInc: () => setModalState(() => tempChildren++),
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
                filtered = q.isEmpty
                    ? List.from(airports)
                    : airports
                        .where((a) =>
                            a.code.toLowerCase().contains(q) ||
                            a.city.toLowerCase().contains(q) ||
                            a.airportName.toLowerCase().contains(q))
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
                              color: AppColors.textPrimary),
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
                            color: AppColors.textSecondary, fontSize: 14),
                        prefixIcon: const Icon(Icons.search_rounded,
                            color: AppColors.primary, size: 20),
                        suffixIcon: ValueListenableBuilder<TextEditingValue>(
                          valueListenable: searchCtrl,
                          builder: (_, val, __) => val.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close_rounded,
                                      size: 18,
                                      color: AppColors.textSecondary),
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
                            horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.border),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide:
                              const BorderSide(color: AppColors.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 1.5),
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
                                    Icon(Icons.search_off_rounded,
                                        size: 48,
                                        color: AppColors.textSecondary
                                            .withValues(alpha: 0.4)),
                                    const SizedBox(height: 12),
                                    const Text(
                                      'Bandara tidak ditemukan',
                                      style: TextStyle(
                                          color: AppColors.textSecondary,
                                          fontSize: 14),
                                    ),
                                  ],
                                ),
                              )
                            : ListView.separated(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 8),
                                itemCount: filtered.length,
                                separatorBuilder: (_, __) => const Divider(
                                    height: 1, indent: 16, endIndent: 16),
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
                                            ? AppColors.primary
                                                .withValues(alpha: 0.1)
                                            : AppColors.background,
                                        borderRadius:
                                            BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        a.code,
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: isSelected
                                                ? AppColors.primary
                                                : AppColors.textSecondary,
                                            fontSize: 12),
                                      ),
                                    ),
                                    title: Text(a.city,
                                        style: TextStyle(
                                            fontWeight: FontWeight.w600,
                                            color: isSelected
                                                ? AppColors.primary
                                                : AppColors.textPrimary)),
                                    subtitle: Text(a.airportName,
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textSecondary)),
                                    trailing: isSelected
                                        ? const Icon(
                                            Icons.check_circle_rounded,
                                            color: AppColors.primary,
                                            size: 20)
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
    final originAirport =
        originCode != null ? airports.where((a) => a.code == originCode).firstOrNull : null;
    final destinationAirport =
        destinationCode != null ? airports.where((a) => a.code == destinationCode).firstOrNull : null;
    final originDisplay = originAirport != null
        ? '${originAirport.city}, ${originAirport.country} (${originAirport.code})'
        : 'Pilih keberangkatan';
    final destinationDisplay = destinationAirport != null
        ? '${destinationAirport.city}, ${destinationAirport.country} (${destinationAirport.code})'
        : 'Pilih tujuan';

    return Scaffold(
      backgroundColor: const Color(0xFFF3F6FB),
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
              padding: EdgeInsets.fromLTRB(isWide ? 34 : 16, 14, isWide ? 34 : 16, 26),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0C3B7E), Color(0xFF1D4E9B)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(Icons.airplanemode_active_rounded, color: Colors.white, size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'SkyIntern',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const Spacer(),
                      Container(
                        width: 44,
                        height: 44,
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
                  const SizedBox(height: 14),
                  Container(
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
                        const SizedBox(height: 14),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(color: const Color(0xFFD8DEE9)),
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
                                padding: EdgeInsets.fromLTRB(14, 14, 14, 8),
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
                              Stack(
                                alignment: Alignment.center,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: InkWell(
                                          onTap: () => _showAirportPicker(true),
                                          borderRadius: const BorderRadius.only(topLeft: Radius.circular(22)),
                                          child: Padding(
                                            padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.flight_takeoff_rounded, color: Color(0xFF2563EB), size: 20),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    originDisplay,
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 18),
                                      Expanded(
                                        child: InkWell(
                                          onTap: () => _showAirportPicker(false),
                                          borderRadius: const BorderRadius.only(topRight: Radius.circular(22)),
                                          child: Padding(
                                            padding: const EdgeInsets.fromLTRB(8, 12, 12, 12),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.flight_land_rounded, color: Color(0xFF2563EB), size: 20),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Text(
                                                    destinationDisplay,
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  GestureDetector(
                                    onTap: () => setState(() {
                                      final tmpCode = originCode;
                                      originCode = destinationCode;
                                      destinationCode = tmpCode;
                                      final tmpId = originId;
                                      originId = destinationId;
                                      destinationId = tmpId;
                                    }),
                                    child: Container(
                                      width: 46,
                                      height: 46,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFFFFFF),
                                        shape: BoxShape.circle,
                                        border: Border.all(color: const Color(0xFFD5DCE8)),
                                        boxShadow: const [
                                          BoxShadow(color: Color(0x330F172A), blurRadius: 8, offset: Offset(0, 2)),
                                        ],
                                      ),
                                      child: const Icon(Icons.swap_vert_rounded, color: Color(0xFF2563EB), size: 22),
                                    ),
                                  ),
                                ],
                              ),
                              const Padding(
                                padding: EdgeInsets.fromLTRB(14, 8, 14, 0),
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
                              const Divider(height: 1, thickness: 1, color: Color(0xFFE5E7EB)),
                              InkWell(
                                onTap: () async {
                                  await _selectDate(false);
                                  if (!mounted) return;
                                  await _selectDate(true);
                                },
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.calendar_today_rounded, color: Color(0xFF2563EB), size: 20),
                                      const SizedBox(width: 10),
                                      Text(
                                        '${DateFormatter.formatShortDate(DateFormatter.formatDate(departureDate))} - ${DateFormatter.formatShortDate(DateFormatter.formatDate(returnDate))}',
                                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const Padding(
                                padding: EdgeInsets.fromLTRB(14, 8, 14, 0),
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
                              const Divider(height: 1, thickness: 1, color: Color(0xFFE5E7EB)),
                              InkWell(
                                onTap: _showGuestPicker,
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.people_outline_rounded, color: Color(0xFF2563EB), size: 22),
                                      const SizedBox(width: 10),
                                      Text(
                                        '$adults Adult(s), $childCount Child',
                                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF111827)),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const Divider(height: 1, thickness: 1, color: Color(0xFFE5E7EB)),
                              Consumer<FlightProvider>(
                                builder: (_, fp, __) => SizedBox(
                                  width: double.infinity,
                                  child: TextButton.icon(
                                    onPressed: fp.isLoadingFlights ? null : _handleSearch,
                                    icon: const Icon(Icons.search_rounded, color: Colors.white, size: 28),
                                    label: Text(
                                      fp.isLoadingFlights ? 'Mencari...' : 'Cari Tiket',
                                      style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Colors.white),
                                    ),
                                    style: TextButton.styleFrom(
                                      backgroundColor: const Color(0xFFFF7A1A),
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                      shape: const RoundedRectangleBorder(
                                        borderRadius: BorderRadius.only(
                                          bottomLeft: Radius.circular(20),
                                          bottomRight: Radius.circular(20),
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
            Padding(
              padding: EdgeInsets.fromLTRB(isWide ? 26 : 16, 24, isWide ? 26 : 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Domestic Flight Best Deals for You',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: const [
                        _DealTab(label: 'Lampung', active: true),
                        SizedBox(width: 10),
                        _DealTab(label: 'Jawa Selatan'),
                        SizedBox(width: 10),
                        _DealTab(label: 'Malang'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DealTab extends StatelessWidget {
  final String label;
  final bool active;

  const _DealTab({required this.label, this.active = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: active ? const Color(0xFFE8F0FF) : Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: active ? const Color(0xFFBFD3FF) : const Color(0xFFD7DEEA),
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: active ? FontWeight.w700 : FontWeight.w600,
          color: active ? const Color(0xFF1D4ED8) : const Color(0xFF64748B),
        ),
      ),
    );
  }
}
