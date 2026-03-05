import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/flight_provider.dart';
import '../models/flight_model.dart';
import '../widgets/common_widgets.dart';
import '../utils/helpers.dart';
import '../utils/formatters.dart';

class SearchScreen extends StatefulWidget {
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String? originCode;
  String? destinationCode;
  DateTime? departureDate;
  DateTime? returnDate;
  int adults = 1;
  int children = 0;
  List<Airport> airports = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAirports();
    });
    departureDate = DateTime.now().add(Duration(days: 1));
    returnDate = departureDate!.add(Duration(days: 1));
  }

  Future<void> _loadAirports() async {
    try {
      final flightProvider = context.read<FlightProvider>();
      await flightProvider.loadAirports();
      setState(() {
        airports = flightProvider.airports;
      });
    } catch (e) {
      showSnackBar(context, 'Gagal memuat data bandara', isError: true);
    }
  }

  Future<void> _selectDate(bool isReturn) async {
    final selected = await showDatePicker(
      context: context,
      initialDate: isReturn ? returnDate! : departureDate!,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(Duration(days: 365)),
    );

    if (selected != null) {
      setState(() {
        if (isReturn) {
          returnDate = selected;
        } else {
          departureDate = selected;
          if (returnDate!.isBefore(departureDate!)) {
            returnDate = departureDate!.add(Duration(days: 1));
          }
        }
      });
    }
  }

  Future<void> _handleSearch() async {
    if (originCode == null || destinationCode == null) {
      showSnackBar(context, 'Pilih bandara keberangkatan dan tujuan', isError: true);
      return;
    }

    try {
      final flightProvider = context.read<FlightProvider>();
      await flightProvider.searchFlights(
        origin: originCode!,
        destination: destinationCode!,
        departureDate: DateFormatter.formatDate(departureDate!),
        returnDate: DateFormatter.formatDate(returnDate!),
        adult: adults.toString(),
        child: children.toString(),
      );

      Navigator.of(context).pushNamed(
        '/search-results',
        arguments: {
          'origin': originCode,
          'destination': destinationCode,
        },
      );
    } catch (e) {
      showSnackBar(context, e.toString(), isError: true);
    }
  }

  void _showAirportPicker(bool isOrigin) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        child: ListView(
          children: airports.map((airport) {
            return ListTile(
              title: Text('${airport.city} (${airport.code})'),
              subtitle: Text(airport.airportName),
              onTap: () {
                setState(() {
                  if (isOrigin) {
                    originCode = airport.code;
                  } else {
                    destinationCode = airport.code;
                  }
                });
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'Cari Penerbangan', showBackButton: false),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  children: [
                    ListTile(
                      title: Text('Dari'),
                      subtitle: Text(originCode ?? 'Pilih bandara'),
                      trailing: Icon(Icons.flight_takeoff),
                      onTap: () => _showAirportPicker(true),
                    ),
                    Divider(),
                    ListTile(
                      title: Text('Ke'),
                      subtitle: Text(destinationCode ?? 'Pilih bandara'),
                      trailing: Icon(Icons.flight_land),
                      onTap: () => _showAirportPicker(false),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: InkWell(
                      onTap: () => _selectDate(false),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Keberangkatan', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            SizedBox(height: 4),
                            Text(
                              DateFormatter.formatShortDate(DateFormatter.formatDate(departureDate!)),
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: InkWell(
                      onTap: () => _selectDate(true),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Kembali', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            SizedBox(height: 4),
                            Text(
                              DateFormatter.formatShortDate(DateFormatter.formatDate(returnDate!)),
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Penumpang Dewasa', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                adults.toString(),
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    icon: Icon(Icons.remove),
                                    onPressed: adults > 1 ? () => setState(() => adults--) : null,
                                  ),
                                  IconButton(
                                    icon: Icon(Icons.add),
                                    onPressed: () => setState(() => adults++),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Penumpang Anak', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                children.toString(),
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    icon: Icon(Icons.remove),
                                    onPressed: children > 0 ? () => setState(() => children--) : null,
                                  ),
                                  IconButton(
                                    icon: Icon(Icons.add),
                                    onPressed: () => setState(() => children++),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 32),
            PrimaryButton(
              label: 'Cari Penerbangan',
              onPressed: _handleSearch,
            ),
          ],
        ),
      ),
    );
  }
}
