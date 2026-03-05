import 'package:flutter/material.dart';
import '../models/flight_model.dart';
import '../services/flight_service.dart';

class FlightProvider extends ChangeNotifier {
  List<Airport> _airports = [];
  List<FlightCardItem> _flights = [];
  bool _isLoadingAirports = false;
  bool _isLoadingFlights = false;
  String? _error;

  List<Airport> get airports => _airports;
  List<FlightCardItem> get flights => _flights;
  bool get isLoadingAirports => _isLoadingAirports;
  bool get isLoadingFlights => _isLoadingFlights;
  String? get error => _error;

  Future<void> loadAirports() async {
    _isLoadingAirports = true;
    _error = null;
    notifyListeners();

    try {
      _airports = await FlightService.getAirports();
      _isLoadingAirports = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoadingAirports = false;
      notifyListeners();
    }
  }

  Future<void> searchFlights({
    required String origin,
    required String destination,
    required String departureDate,
    String? returnDate,
    String adult = '1',
    String child = '0',
    String? sortBy,
  }) async {
    _isLoadingFlights = true;
    _error = null;
    _flights = [];
    notifyListeners();

    try {
      _flights = await FlightService.searchFlights(
        origin: origin,
        destination: destination,
        departureDate: departureDate,
        returnDate: returnDate,
        adult: adult,
        child: child,
        sortBy: sortBy,
      );
      _isLoadingFlights = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoadingFlights = false;
      notifyListeners();
    }
  }

  void sortFlights(String sortBy) {
    if (_flights.isEmpty) return;

    switch (sortBy) {
      case 'price-low':
        _flights.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'price-high':
        _flights.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'duration':
        // Sort by duration (simplified)
        break;
      case 'departure':
        // Sort by departure time
        break;
    }
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
