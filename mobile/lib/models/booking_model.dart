// Derives a 3-letter display code from city name
String _deriveCode(String? city) {
  if (city == null || city.isEmpty) return 'XXX';
  final letters = city.replaceAll(RegExp(r'[^a-zA-Z]'), '');
  if (letters.length >= 3) return letters.substring(0, 3).toUpperCase();
  return letters.toUpperCase().padRight(3, 'X');
}

class Booking {
  final int id;
  final int flightId;
  final String bookingCode;
  final String status;
  final String createdAt;
  final int totalPrice;
  final String? selectedSeats;
  final FlightInfo flight;
  final List<PassengerInfo> passengers;
  final TicketInfo? ticket;

  Booking({
    required this.id,
    required this.flightId,
    required this.bookingCode,
    required this.status,
    required this.createdAt,
    required this.totalPrice,
    this.selectedSeats,
    required this.flight,
    required this.passengers,
    this.ticket,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] as int,
      flightId: json['flightId'] as int? ?? 0,
      bookingCode: json['bookingCode'] ?? '',
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] ?? '',
        totalPrice: (json['totalPrice'] as num?)?.toInt() ?? 0,
        selectedSeats: json['selectedSeats'] as String?,
      flight: FlightInfo.fromJson(json['flight'] ?? {}),
      passengers: ((json['passengers'] ?? []) as List)
          .map((e) => PassengerInfo.fromJson(e as Map<String, dynamic>))
          .toList(),
      ticket: json['ticket'] != null ? TicketInfo.fromJson(json['ticket']) : null,
    );
  }
}

class FlightInfo {
  final int id;
  final String flightNumber;
  final String departureTime;
  final String arrivalTime;
  final String airline;
  final String originName;
  final String originCity;
  final String originCode;
  final String destinationName;
  final String destinationCity;
  final String destinationCode;

  FlightInfo({
    required this.id,
    required this.flightNumber,
    required this.departureTime,
    required this.arrivalTime,
    required this.airline,
    required this.originName,
    required this.originCity,
    required this.originCode,
    required this.destinationName,
    required this.destinationCity,
    required this.destinationCode,
  });

  factory FlightInfo.fromJson(Map<String, dynamic> json) {
    return FlightInfo(
      id: json['id'] as int? ?? 0,
      flightNumber: json['flightNumber'] ?? '',
      departureTime: json['departureTime'] ?? '',
      arrivalTime: json['arrivalTime'] ?? '',
      airline: json['airline']?['name'] ?? 'Unknown',
      originName: json['origin']?['name'] ?? '',
      originCity: json['origin']?['city'] ?? '',
      originCode: _deriveCode(json['origin']?['city'] as String?),
      destinationName: json['destination']?['name'] ?? '',
      destinationCity: json['destination']?['city'] ?? '',
      destinationCode: _deriveCode(json['destination']?['city'] as String?),
    );
  }
}

class PassengerInfo {
  final String title;
  final String firstName;
  final String lastName;
  final String type;
  final String? documentType;
  final String? documentNumber;

  PassengerInfo({
    required this.title,
    required this.firstName,
    required this.lastName,
    required this.type,
    this.documentType,
    this.documentNumber,
  });

  factory PassengerInfo.fromJson(Map<String, dynamic> json) {
    return PassengerInfo(
      title: json['title'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      type: json['type'] ?? 'ADULT',
      documentType: json['documentType'] as String?,
      documentNumber: json['documentNumber'] as String?,
    );
  }
}

class TicketInfo {
  final int id;
  final String? pdfUrl;

  TicketInfo({
    required this.id,
    this.pdfUrl,
  });

  factory TicketInfo.fromJson(Map<String, dynamic> json) {
    return TicketInfo(
      id: json['id'] as int,
      pdfUrl: json['pdfUrl'],
    );
  }
}
