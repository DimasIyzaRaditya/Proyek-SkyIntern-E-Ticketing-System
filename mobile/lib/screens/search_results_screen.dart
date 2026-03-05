import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/flight_provider.dart';
import '../widgets/common_widgets.dart';
import '../utils/formatters.dart';

class SearchResultsScreen extends StatefulWidget {
  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  String _sortBy = 'price-low';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBar(title: 'Hasil Pencarian', showBackButton: true),
      body: Consumer<FlightProvider>(
        builder: (context, flightProvider, _) {
          return Column(
            children: [
              Container(
                color: Colors.blue.shade50,
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Urutkan Hasil',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        _buildSortChip('Harga Terendah', 'price-low'),
                        _buildSortChip('Harga Tertinggi', 'price-high'),
                        _buildSortChip('Durasi', 'duration'),
                        _buildSortChip('Waktu Berangkat', 'departure'),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: flightProvider.isLoadingFlights
                    ? Center(child: CircularProgressIndicator())
                    : flightProvider.error != null
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.error, size: 48, color: Colors.red),
                                SizedBox(height: 16),
                                Text(
                                  'Terjadi Kesalahan',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                                SizedBox(height: 8),
                                Text(flightProvider.error ?? 'Kesalahan tidak diketahui'),
                                SizedBox(height: 16),
                                PrimaryButton(
                                  label: 'Coba Lagi',
                                  width: 150,
                                  onPressed: () => Navigator.pop(context),
                                ),
                              ],
                            ),
                          )
                        : flightProvider.flights.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.flight_takeoff, size: 48, color: Colors.grey),
                                    SizedBox(height: 16),
                                    Text('Tidak ada penerbangan tersedia'),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                padding: EdgeInsets.all(16),
                                itemCount: flightProvider.flights.length,
                                itemBuilder: (context, index) {
                                  final flight = flightProvider.flights[index];
                                  return FlightCard(
                                    flightNumber: flight.flightNumber,
                                    airline: flight.airline,
                                    departureTime: flight.departureTime,
                                    arrivalTime: flight.arrivalTime,
                                    duration: flight.duration,
                                    origin: flight.origin,
                                    destination: flight.destination,
                                    price: flight.price,
                                    facilities: flight.facilities,
                                    onTap: () {
                                      Navigator.of(context).pushNamed(
                                        '/flight-detail',
                                        arguments: flight.id,
                                      );
                                    },
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

  Widget _buildSortChip(String label, String value) {
    final isSelected = _sortBy == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _sortBy = value;
        });
        context.read<FlightProvider>().sortFlights(value);
      },
      backgroundColor: Colors.white,
      selectedColor: Colors.blue.shade600,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.grey.shade700,
      ),
    );
  }
}
