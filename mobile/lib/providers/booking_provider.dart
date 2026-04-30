import 'package:flutter/material.dart';
import '../models/booking_model.dart';
import '../models/pagination_model.dart';
import '../services/booking_service.dart';

class BookingProvider extends ChangeNotifier {
  List<Booking> _bookings = [];
  bool _isLoading = false;
  String? _error;
  PaginationMeta? _pagination;

  List<Booking> get bookings => _bookings;
  bool get isLoading => _isLoading;
  String? get error => _error;
  PaginationMeta? get pagination => _pagination;

  Future<void> loadBookings({
    int page = 1,
    int limit = 20,
    String statusFilter = 'All',
    String sortDirection = 'desc',
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await BookingService.getMyBookings(
        page: page,
        limit: limit,
        statusFilter: statusFilter,
        sortDirection: sortDirection,
      );
      _bookings = result.items;
      _pagination = result.pagination;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<int?> createBooking({
    required int flightId,
    required List<Map<String, dynamic>> passengers,
    List<int>? seatIds,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await BookingService.createBooking(
        flightId: flightId,
        passengers: passengers,
        seatIds: seatIds,
      );
      await loadBookings();
      _isLoading = false;
      notifyListeners();
      return result['booking']?['id'] as int? ?? result['id'] as int?;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> cancelBooking(int bookingId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await BookingService.cancelBooking(bookingId);
      await loadBookings();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
