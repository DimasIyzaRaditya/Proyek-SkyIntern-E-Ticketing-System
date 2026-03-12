class Booking {
  final int id;
  final int flightId;
  final String bookingCode;
  final String status;
  final String createdAt;
  final FlightInfo flight;
  final List<PassengerInfo> passengers;
  final TicketInfo? ticket;

  Booking({
    required this.id,
    required this.flightId,
    required this.bookingCode,
    required this.status,
    required this.createdAt,
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
  final String airline;
  final String originCity;
  final String originCode;
  final String destinationCity;
  final String destinationCode;

  FlightInfo({
    required this.id,
    required this.flightNumber,
    required this.departureTime,
    required this.airline,
    required this.originCity,
    required this.originCode,
    required this.destinationCity,
    required this.destinationCode,
  });

  factory FlightInfo.fromJson(Map<String, dynamic> json) {
    return FlightInfo(
      id: json['id'] as int? ?? 0,
      flightNumber: json['flightNumber'] ?? '',
      departureTime: json['departureTime'] ?? '',
      airline: json['airline']?['name'] ?? 'Unknown',
      originCity: json['origin']?['city'] ?? '',
      originCode: json['origin']?['code'] ?? 'XXX',
      destinationCity: json['destination']?['city'] ?? '',
      destinationCode: json['destination']?['code'] ?? 'XXX',
    );
  }
}

class PassengerInfo {
  final String firstName;
  final String lastName;
  final String type;

  PassengerInfo({
    required this.firstName,
    required this.lastName,
    required this.type,
  });

  factory PassengerInfo.fromJson(Map<String, dynamic> json) {
    return PassengerInfo(
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      type: json['type'] ?? 'ADULT',
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
