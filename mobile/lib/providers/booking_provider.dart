import 'package:flutter/material.dart';
import '../models/booking_model.dart';
import '../services/booking_service.dart';

class BookingProvider extends ChangeNotifier {
  List<Booking> _bookings = [];
  bool _isLoading = false;
  String? _error;

  List<Booking> get bookings => _bookings;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadBookings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _bookings = await BookingService.getMyBookings();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createBooking({
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
