class UserSession {
  final int id;
  final String fullName;
  final String email;
  final String? phoneNumber;
  final String? avatarUrl;
  final String role;

  UserSession({
    required this.id,
    required this.fullName,
    required this.email,
    this.phoneNumber,
    this.avatarUrl,
    required this.role,
  });

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      id: json['id'] as int,
      fullName: json['name'] ?? json['fullName'] ?? '',
      email: json['email'] ?? '',
      phoneNumber: json['phone'] ?? json['phoneNumber'],
      avatarUrl: json['avatarUrl'],
      role: (json['role'] ?? 'USER').toLowerCase() == 'admin' ? 'admin' : 'user',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'fullName': fullName,
    'email': email,
    'phoneNumber': phoneNumber,
    'avatarUrl': avatarUrl,
    'role': role,
  };
}
