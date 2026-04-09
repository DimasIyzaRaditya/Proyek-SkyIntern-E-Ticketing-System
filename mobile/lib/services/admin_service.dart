import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'api_client.dart';

/// Service untuk semua endpoint admin (/api/admin/*)
class AdminService {
  // ─── Airlines ─────────────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getAirlines() async {
    final res = await ApiClient.get('/api/admin/airlines', requireAuth: true);
    final list = res['airlines'] as List<dynamic>? ?? [];
    return list.cast<Map<String, dynamic>>();
  }

  /// Buat maskapai baru. Logo bersifat opsional — kirim multipart tanpa file.
  static Future<void> createAirline({
    required String code,
    required String name,
    required String country,
    List<int>? logoBytes,
    String? logoFileName,
    String? logoMimeType,
  }) async {
    final request =
        http.MultipartRequest(
            'POST',
            Uri.parse('${ApiClient.baseUrl}/api/admin/airlines'),
          )
          ..headers['X-Platform'] = 'mobile'
          ..headers['Authorization'] = 'Bearer ${ApiClient.authToken}'
          ..fields['code'] = code
          ..fields['name'] = name
          ..fields['country'] = country;

    if (logoBytes != null && logoBytes.isNotEmpty) {
      final mime = logoMimeType ?? 'image/jpeg';
      final parts = mime.split('/');
      final mediaType = parts.length == 2
          ? MediaType(parts[0], parts[1])
          : MediaType('image', 'jpeg');

      request.files.add(
        http.MultipartFile.fromBytes(
          'logo',
          logoBytes,
          filename: logoFileName ?? 'airline-logo.jpg',
          contentType: mediaType,
        ),
      );
    }

    final streamedRes = await request.send();
    final body = await streamedRes.stream.bytesToString();
    if (streamedRes.statusCode != 200 && streamedRes.statusCode != 201) {
      final err = json.decode(body);
      throw Exception(err['message'] ?? 'Gagal membuat maskapai');
    }
  }

  static Future<void> updateAirline({
    required int id,
    required String code,
    required String name,
    required String country,
    List<int>? logoBytes,
    String? logoFileName,
    String? logoMimeType,
  }) async {
    final request =
        http.MultipartRequest(
            'PUT',
            Uri.parse('${ApiClient.baseUrl}/api/admin/airlines/$id'),
          )
          ..headers['X-Platform'] = 'mobile'
          ..headers['Authorization'] = 'Bearer ${ApiClient.authToken}'
          ..fields['code'] = code
          ..fields['name'] = name
          ..fields['country'] = country;

    if (logoBytes != null && logoBytes.isNotEmpty) {
      final mime = logoMimeType ?? 'image/jpeg';
      final parts = mime.split('/');
      final mediaType = parts.length == 2
          ? MediaType(parts[0], parts[1])
          : MediaType('image', 'jpeg');

      request.files.add(
        http.MultipartFile.fromBytes(
          'logo',
          logoBytes,
          filename: logoFileName ?? 'airline-logo.jpg',
          contentType: mediaType,
        ),
      );
    }

    final streamedRes = await request.send();
    final body = await streamedRes.stream.bytesToString();
    if (streamedRes.statusCode != 200) {
      final err = json.decode(body);
      throw Exception(err['message'] ?? 'Gagal memperbarui maskapai');
    }
  }

  static Future<void> deleteAirline(int id) async {
    await ApiClient.delete('/api/admin/airlines/$id', requireAuth: true);
  }

  // ─── Airports ─────────────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getAirports() async {
    final res = await ApiClient.get('/api/admin/airports', requireAuth: true);
    final list = res['airports'] as List<dynamic>? ?? [];
    return list.cast<Map<String, dynamic>>();
  }

  static Future<void> createAirport({
    required String name,
    required String city,
    required String country,
  }) async {
    await ApiClient.post(
      '/api/admin/airports',
      body: {'name': name, 'city': city, 'country': country},
      requireAuth: true,
    );
  }

  static Future<void> updateAirport({
    required int id,
    required String name,
    required String city,
    required String country,
  }) async {
    await ApiClient.put(
      '/api/admin/airports/$id',
      body: {'name': name, 'city': city, 'country': country},
      requireAuth: true,
    );
  }

  static Future<void> deleteAirport(int id) async {
    await ApiClient.delete('/api/admin/airports/$id', requireAuth: true);
  }

  // ─── Flights (Schedules) ──────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getFlights() async {
    final res = await ApiClient.get('/api/admin/flights', requireAuth: true);
    final list = res['flights'] as List<dynamic>? ?? [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  static Future<void> createFlight({
    required String flightNumber,
    required int airlineId,
    required int originId,
    required int destinationId,
    required String departureTime,
    required String arrivalTime,
    required int basePrice,
    int tax = 0,
    int adminFee = 0,
    String? aircraft,
    String? facilities,
  }) async {
    await ApiClient.post(
      '/api/admin/flights',
      body: {
        'flightNumber': flightNumber,
        'airlineId': airlineId,
        'originId': originId,
        'destinationId': destinationId,
        'departureTime': departureTime,
        'arrivalTime': arrivalTime,
        'basePrice': basePrice,
        'tax': tax,
        'adminFee': adminFee,
        if (aircraft != null) 'aircraft': aircraft,
        if (facilities != null) 'facilities': facilities,
      },
      requireAuth: true,
    );
  }

  static Future<void> updateFlight({
    required int id,
    required String flightNumber,
    required int airlineId,
    required int originId,
    required int destinationId,
    required String departureTime,
    required String arrivalTime,
    required int basePrice,
    int tax = 0,
    int adminFee = 0,
    String? aircraft,
    String? facilities,
  }) async {
    await ApiClient.put(
      '/api/admin/flights/$id',
      body: {
        'flightNumber': flightNumber,
        'airlineId': airlineId,
        'originId': originId,
        'destinationId': destinationId,
        'departureTime': departureTime,
        'arrivalTime': arrivalTime,
        'basePrice': basePrice,
        'tax': tax,
        'adminFee': adminFee,
        if (aircraft != null) 'aircraft': aircraft,
        if (facilities != null) 'facilities': facilities,
      },
      requireAuth: true,
    );
  }

  static Future<void> deleteFlight(int id) async {
    await ApiClient.delete('/api/admin/flights/$id', requireAuth: true);
  }

  // ─── Seats ────────────────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getFlightSeats(int flightId) async {
    final res = await ApiClient.get(
      '/api/flights/$flightId/seats',
      requireAuth: true,
    );

    // Backend returns { seatMap: { FIRST: [...], BUSINESS: [...], ECONOMY: [...] } }
    // Each item is a FlightSeat with a nested `seat` object.
    final List<dynamic> raw;
    if (res['seatMap'] is Map) {
      final seatMap = res['seatMap'] as Map<String, dynamic>;
      final tmp = <dynamic>[];
      for (final cls in ['FIRST', 'BUSINESS', 'ECONOMY']) {
        final bucket = seatMap[cls];
        if (bucket is List) tmp.addAll(bucket);
      }
      raw = tmp;
    } else if (res['seats'] is List) {
      raw = res['seats'] as List<dynamic>;
    } else {
      return [];
    }

    // Flatten nested seat fields to top level so the screen can access
    // seatNumber, seatClass, status, additionalPrice directly.
    return raw.map<Map<String, dynamic>>((item) {
      final fs = Map<String, dynamic>.from(item as Map);
      final nested = (fs['seat'] is Map)
          ? Map<String, dynamic>.from(fs['seat'] as Map)
          : <String, dynamic>{};
      return <String, dynamic>{
        ...fs,
        'seatNumber': (fs['seatNumber'] ?? nested['seatNumber'] ?? '')
            .toString(),
        'seatClass': (fs['seatClass'] ?? nested['seatClass'] ?? 'ECONOMY')
            .toString(),
        'class': (fs['class'] ?? nested['seatClass'] ?? 'ECONOMY').toString(),
      };
    }).toList();
  }

  static Future<void> generateSeats(int flightId) async {
    await ApiClient.post(
      '/api/admin/seats/generate',
      body: {'flightId': flightId},
      requireAuth: true,
    );
  }

  static Future<void> createSeat({
    required int flightId,
    required String seatNumber,
    required String seatClass,
    bool isExitRow = false,
    int additionalPrice = 0,
  }) async {
    await ApiClient.post(
      '/api/admin/seats',
      body: {
        'flightId': flightId,
        'seats': [
          {
            'seatNumber': seatNumber,
            'seatClass': seatClass,
            'isExitRow': isExitRow,
            'additionalPrice': additionalPrice,
          },
        ],
      },
      requireAuth: true,
    );
  }

  static Future<void> updateSeat({
    required int seatId,
    required String status,
    required int additionalPrice,
  }) async {
    await ApiClient.put(
      '/api/admin/seats/$seatId',
      body: {'status': status, 'additionalPrice': additionalPrice},
      requireAuth: true,
    );
  }

  // ─── Bookings / Transactions ──────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getBookings({
    String? status,
  }) async {
    final query = status != null ? '?status=$status' : '';
    final res = await ApiClient.get(
      '/api/admin/bookings$query',
      requireAuth: true,
    );
    final list = res['bookings'] as List<dynamic>? ?? [];
    return list.cast<Map<String, dynamic>>();
  }

  /// [action] bisa: cancel | markpaid | markpending | markissued
  static Future<void> updateBookingStatus({
    required int bookingId,
    required String action,
  }) async {
    await ApiClient.put(
      '/api/admin/bookings/$bookingId/status',
      body: {'action': action},
      requireAuth: true,
    );
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getUsers() async {
    final res = await ApiClient.get('/api/admin/users', requireAuth: true);
    final list = res['users'] as List<dynamic>? ?? [];
    return list.cast<Map<String, dynamic>>();
  }

  /// Toggle block/unblock. Backend PUT /api/admin/users/:id/block toggles state.
  static Future<bool> blockUser(int userId) async {
    final res = await ApiClient.put(
      '/api/admin/users/$userId/block',
      body: {},
      requireAuth: true,
    );
    return (res['user'] as Map<String, dynamic>?)?['isBlocked'] as bool? ??
        false;
  }

  // ─── Promos ───────────────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getPromos() async {
    final res = await ApiClient.get('/api/admin/promos', requireAuth: true);
    final list = res['promos'] as List<dynamic>? ?? [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  static Future<Map<String, dynamic>> createPromo({
    required String title,
    String? description,
    int discount = 0,
    required String startDate,
    required String endDate,
    bool isActive = true,
    int? flightId,
  }) async {
    final res = await ApiClient.post(
      '/api/admin/promos',
      body: {
        'title': title,
        if (description != null && description.trim().isNotEmpty)
          'description': description.trim(),
        'discount': discount,
        'startDate': startDate,
        'endDate': endDate,
        'isActive': isActive,
        'flightId': flightId,
      },
      requireAuth: true,
    );
    return Map<String, dynamic>.from(res['promo'] as Map);
  }

  static Future<Map<String, dynamic>> updatePromo({
    required int id,
    String? title,
    String? description,
    int? discount,
    String? startDate,
    String? endDate,
    bool? isActive,
    int? flightId,
    bool includeFlightId = false,
  }) async {
    final payload = <String, dynamic>{
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (discount != null) 'discount': discount,
      if (startDate != null) 'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
      if (isActive != null) 'isActive': isActive,
    };

    if (includeFlightId) {
      payload['flightId'] = flightId;
    }

    final res = await ApiClient.put(
      '/api/admin/promos/$id',
      body: payload,
      requireAuth: true,
    );
    return Map<String, dynamic>.from(res['promo'] as Map);
  }

  static Future<void> deletePromo(int id) async {
    await ApiClient.delete('/api/admin/promos/$id', requireAuth: true);
  }
}
