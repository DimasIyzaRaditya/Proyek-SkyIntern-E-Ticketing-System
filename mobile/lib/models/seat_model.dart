class Seat {
  final int id;
  final String seatNumber;
  final String seatClass;
  final String status;
  final int additionalPrice;

  const Seat({
    required this.id,
    required this.seatNumber,
    required this.seatClass,
    required this.status,
    required this.additionalPrice,
  });

  bool get isAvailable => status == 'AVAILABLE';
  bool get isOccupied => status == 'OCCUPIED';
  bool get isHeld => status == 'HELD';

  factory Seat.fromJson(Map<String, dynamic> json) {
    return Seat(
      id: json['id'] as int,
      seatNumber: json['seatNumber'] ?? '',
      seatClass: json['class'] ?? json['seatClass'] ?? 'ECONOMY',
      status: json['status'] ?? 'AVAILABLE',
      additionalPrice: (json['additionalPrice'] as num?)?.toInt() ?? 0,
    );
  }

  Seat copyWith({String? status}) {
    return Seat(
      id: id,
      seatNumber: seatNumber,
      seatClass: seatClass,
      status: status ?? this.status,
      additionalPrice: additionalPrice,
    );
  }
}
