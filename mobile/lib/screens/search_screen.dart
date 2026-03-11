import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/flight_model.dart';
import '../providers/flight_provider.dart';
import '../utils/app_theme.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import '../widgets/common_widgets.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen>
    with SingleTickerProviderStateMixin {
  String? originCode;
  String? destinationCode;
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
    if (originCode == null || destinationCode == null) {
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
        origin: originCode!,
        destination: destinationCode!,
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
                                            .withOpacity(0.4)),
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
                                                .withOpacity(0.1)
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
                                        } else {
                                          destinationCode = a.code;
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

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(
          title: 'Cari Penerbangan',
          showBackButton: false),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(
            horizontal: isWide ? 80 : 16, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Trip type toggle
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  _TripToggle(
                    label: 'Sekali Jalan',
                    icon: Icons.arrow_right_alt_rounded,
                    selected: !isRoundTrip,
                    onTap: () => setState(() => isRoundTrip = false),
                  ),
                  _TripToggle(
                    label: 'Pulang Pergi',
                    icon: Icons.swap_horiz_rounded,
                    selected: isRoundTrip,
                    onTap: () => setState(() => isRoundTrip = true),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Route selection card
            GlassCard(
              padding: const EdgeInsets.all(4),
              child: Column(
                children: [
                  _AirportTile(
                    label: 'Dari',
                    icon: Icons.flight_takeoff_rounded,
                    code: originCode,
                    airports: airports,
                    onTap: () => _showAirportPicker(true),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        Expanded(
                            child: Divider(
                                color: AppColors.border.withOpacity(0.6))),
                        GestureDetector(
                          onTap: () => setState(() {
                            final tmp = originCode;
                            originCode = destinationCode;
                            destinationCode = tmp;
                          }),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.swap_vert_rounded,
                                color: Colors.white, size: 18),
                          ),
                        ),
                        Expanded(
                            child: Divider(
                                color: AppColors.border.withOpacity(0.6))),
                      ],
                    ),
                  ),
                  _AirportTile(
                    label: 'Ke',
                    icon: Icons.flight_land_rounded,
                    code: destinationCode,
                    airports: airports,
                    onTap: () => _showAirportPicker(false),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Date selection
            Row(
              children: [
                Expanded(
                  child: _DateCard(
                    label: 'Tanggal Berangkat',
                    date: departureDate,
                    onTap: () => _selectDate(false),
                  ),
                ),
                if (isRoundTrip) ...[
                  const SizedBox(width: 10),
                  Expanded(
                    child: _DateCard(
                      label: 'Tanggal Kembali',
                      date: returnDate,
                      onTap: () => _selectDate(true),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),

            // Passenger count
            GlassCard(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: _PassengerCounter(
                      label: 'Dewasa',
                      icon: Icons.person_rounded,
                      count: adults,
                      onDec: adults > 1 ? () => setState(() => adults--) : null,
                      onInc: () => setState(() => adults++),
                    ),
                  ),
                  Container(
                      height: 40,
                      width: 1,
                      color: AppColors.border,
                      margin: const EdgeInsets.symmetric(horizontal: 12)),
                  Expanded(
                    child: _PassengerCounter(
                      label: 'Anak',
                      icon: Icons.child_care_rounded,
                      count: childCount,
                      onDec: childCount > 0
                          ? () => setState(() => childCount--)
                          : null,
                      onInc: () => setState(() => childCount++),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Consumer<FlightProvider>(
              builder: (_, fp, __) => PrimaryButton(
                label: 'Cari Penerbangan',
                icon: Icons.search_rounded,
                isLoading: fp.isLoadingFlights,
                onPressed: _handleSearch,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Helper Widgets ───────────────────────────────────────────────────────────

class _TripToggle extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _TripToggle(
      {required this.label,
      required this.icon,
      required this.selected,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.all(4),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            gradient: selected ? AppColors.primaryGradient : null,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  size: 16,
                  color: selected ? Colors.white : AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(label,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color:
                          selected ? Colors.white : AppColors.textSecondary)),
            ],
          ),
        ),
      ),
    );
  }
}

class _AirportTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final String? code;
  final List<Airport> airports;
  final VoidCallback onTap;

  const _AirportTile(
      {required this.label,
      required this.icon,
      required this.code,
      required this.airports,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    final airport =
        code != null ? airports.where((a) => a.code == code).firstOrNull : null;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: code != null
                    ? AppColors.primary.withOpacity(0.1)
                    : AppColors.background,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon,
                  color: code != null ? AppColors.primary : AppColors.textHint,
                  size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textHint,
                          fontWeight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text(
                    airport != null
                        ? '${airport.city} (${airport.code})'
                        : 'Pilih bandara...',
                    style: TextStyle(
                        fontSize: 15,
                        fontWeight: code != null
                            ? FontWeight.bold
                            : FontWeight.normal,
                        color: code != null
                            ? AppColors.textPrimary
                            : AppColors.textHint),
                  ),
                  if (airport != null)
                    Text(airport.airportName,
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.textSecondary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded,
                color: AppColors.textHint, size: 20),
          ],
        ),
      ),
    );
  }
}

class _DateCard extends StatelessWidget {
  final String label;
  final DateTime date;
  final VoidCallback onTap;

  const _DateCard(
      {required this.label, required this.date, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              const Icon(Icons.calendar_today_rounded,
                  color: AppColors.primary, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textHint,
                            fontWeight: FontWeight.w500)),
                    const SizedBox(height: 2),
                    Text(
                      DateFormatter.formatShortDate(
                          DateFormatter.formatDate(date)),
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PassengerCounter extends StatelessWidget {
  final String label;
  final IconData icon;
  final int count;
  final VoidCallback? onDec;
  final VoidCallback onInc;

  const _PassengerCounter(
      {required this.label,
      required this.icon,
      required this.count,
      required this.onDec,
      required this.onInc});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: AppColors.primary),
            const SizedBox(width: 6),
            Text(label,
                style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500)),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _CounterBtn(
              icon: Icons.remove_rounded,
              onTap: onDec,
              enabled: onDec != null,
            ),
            Expanded(
              child: Center(
                child: Text(
                  '$count',
                  style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary),
                ),
              ),
            ),
            _CounterBtn(icon: Icons.add_rounded, onTap: onInc, enabled: true),
          ],
        ),
      ],
    );
  }
}

class _CounterBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final bool enabled;

  const _CounterBtn(
      {required this.icon, required this.onTap, required this.enabled});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: enabled
              ? AppColors.primary.withOpacity(0.1)
              : AppColors.border,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon,
            size: 18,
            color: enabled ? AppColors.primary : AppColors.textHint),
      ),
    );
  }
}
