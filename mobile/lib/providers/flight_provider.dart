import 'package:flutter/material.dart';
import '../models/flight_model.dart';
import '../models/pagination_model.dart';
import '../services/flight_service.dart';

class FlightProvider extends ChangeNotifier {
  List<Airport> _airports = [];
  List<FlightCardItem> _flights = [];
  bool _isLoadingAirports = false;
  bool _isLoadingFlights = false;
  String? _error;
  PaginationMeta? _pagination;

  List<Airport> get airports => _airports;
  List<FlightCardItem> get flights => _flights;
  bool get isLoadingAirports => _isLoadingAirports;
  bool get isLoadingFlights => _isLoadingFlights;
  String? get error => _error;
  PaginationMeta? get pagination => _pagination;

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
    required String originId,
    required String destinationId,
    required String departureDate,
    String? returnDate,
    String adult = '1',
    String child = '0',
    String? sortBy,
    int page = 1,
    int limit = 20,
  }) async {
    _isLoadingFlights = true;
    _error = null;
    _flights = [];
    _pagination = null;
    notifyListeners();

    try {
      final result = await FlightService.searchFlights(
        originId: originId,
        destinationId: destinationId,
        departureDate: departureDate,
        returnDate: returnDate,
        adult: adult,
        child: child,
        sortBy: sortBy,
        page: page,
        limit: limit,
      );
      _flights = result.items;
      _pagination = result.pagination;
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
        _flights.sort((a, b) {
          int parseMins(String dur) {
            final h = int.tryParse(RegExp(r'(\d+)h').firstMatch(dur)?.group(1) ?? '0') ?? 0;
            final m = int.tryParse(RegExp(r'(\d+)m').firstMatch(dur)?.group(1) ?? '0') ?? 0;
            return h * 60 + m;
          }
          return parseMins(a.duration).compareTo(parseMins(b.duration));
        });
        break;
      case 'departure':
        _flights.sort((a, b) => a.departureTime.compareTo(b.departureTime));
        break;
    }
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
