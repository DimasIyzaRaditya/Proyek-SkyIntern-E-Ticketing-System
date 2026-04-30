import '../models/booking_model.dart';
import '../models/pagination_model.dart';
import 'api_client.dart';

class TicketDownloadResult {
  final List<int> bytes;
  final String fileName;
  final String contentType;

  const TicketDownloadResult({
    required this.bytes,
    required this.fileName,
    required this.contentType,
  });
}

class BookingService {
  static Future<PaginatedResult<Booking>> getMyBookings({
    int page = 1,
    int limit = 20,
    String? statusFilter,
    String? sortDirection,
    String? status,
  }) async {
    final query = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      if (statusFilter != null) 'statusFilter': statusFilter,
      if (sortDirection != null) 'sortDirection': sortDirection,
      if (status != null) 'status': status,
    };
    final endpoint = Uri(path: '/api/bookings', queryParameters: query)
        .toString();

    final response = await ApiClient.get(
      endpoint,
      requireAuth: true,
    );

    final bookingsList = response['bookings'] as List?;
    final items = (bookingsList ?? [])
        .map((e) => Booking.fromJson(e as Map<String, dynamic>))
        .toList();
    final pagination = response['pagination'] is Map
        ? PaginationMeta.fromJson(
            Map<String, dynamic>.from(response['pagination'] as Map),
          )
        : null;

    return PaginatedResult(items: items, pagination: pagination);
  }

  static Future<Map<String, dynamic>> createBooking({
    required int flightId,
    required List<Map<String, dynamic>> passengers,
    List<int>? seatIds,
    int? promoId,
  }) async {
    return await ApiClient.post(
      '/api/bookings',
      body: {
        'flightId': flightId,
        'passengers': passengers,
        if (seatIds != null) 'seatIds': seatIds,
        if (promoId != null) 'promoId': promoId,
      },
      requireAuth: true,
    );
  }

  static Future<Map<String, dynamic>> createPayment(int bookingId) async {
    return await ApiClient.post(
      '/api/bookings/$bookingId/payment',
      body: {'bookingId': bookingId},
      requireAuth: true,
    );
  }

  static Future<Map<String, dynamic>> cancelBooking(int bookingId) async {
    return await ApiClient.post(
      '/api/bookings/$bookingId/cancel',
      body: {},
      requireAuth: true,
    );
  }

  static Future<Map<String, dynamic>> rescheduleBooking(
    int bookingId, {
    required int newFlightId,
  }) async {
    return await ApiClient.post(
      '/api/bookings/$bookingId/reschedule',
      body: {'newFlightId': newFlightId},
      requireAuth: true,
    );
  }

  static Future<Map<String, dynamic>> syncPayment(int bookingId) async {
    return await ApiClient.post(
      '/api/bookings/$bookingId/sync-payment',
      body: {},
      requireAuth: true,
    );
  }

  static Future<Map<String, dynamic>> verifyBooking(String code) async {
    final normalizedCode = Uri.encodeQueryComponent(code.trim());
    return await ApiClient.get('/api/bookings/verify?code=$normalizedCode');
  }

  static Future<Map<String, dynamic>> getBookingDetail(int bookingId) async {
    return await ApiClient.get(
      '/api/bookings/$bookingId',
      requireAuth: true,
    );
  }

  static Future<TicketDownloadResult> downloadTicket(int ticketId) async {
    final response = await ApiClient.getBytes(
      '/api/bookings/tickets/$ticketId/download',
      requireAuth: true,
    );

    String fileName = 'e-ticket-$ticketId.txt';
    final disposition = response.contentDisposition;
    if (disposition != null) {
      final fileNameMatch = RegExp(r'filename="?([^";]+)"?', caseSensitive: false).firstMatch(disposition);
      final parsedName = fileNameMatch?.group(1)?.trim();
      if (parsedName != null && parsedName.isNotEmpty) {
        fileName = parsedName;
      }
    }

    return TicketDownloadResult(
      bytes: response.bytes,
      fileName: fileName,
      contentType: response.contentType ?? 'application/octet-stream',
    );
  }
}
