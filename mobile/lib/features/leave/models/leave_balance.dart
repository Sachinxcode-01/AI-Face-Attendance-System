/*
|--------------------------------------------------------------------------
| File: leave_balance.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Data model representing the leave balance quota available for a student.
|--------------------------------------------------------------------------
*/

class LeaveBalance {
  final int sick;
  final int personal;
  final int emergency;
  final int academic;

  const LeaveBalance({
    required this.sick,
    required this.personal,
    required this.emergency,
    required this.academic,
  });

  /// Factory constructor for default initial balance.
  factory LeaveBalance.initial() {
    return const LeaveBalance(
      sick: 10,
      personal: 15,
      emergency: 5,
      academic: 12,
    );
  }

  /// Factory constructor from JSON map.
  factory LeaveBalance.fromJson(Map<String, dynamic> json) {
    return LeaveBalance(
      sick: json['sick'] as int? ?? 10,
      personal: json['personal'] as int? ?? 15,
      emergency: json['emergency'] as int? ?? 5,
      academic: json['academic'] as int? ?? 12,
    );
  }

  /// Converts leave balances to a JSON compatible map.
  Map<String, dynamic> toJson() => {
    'sick': sick,
    'personal': personal,
    'emergency': emergency,
    'academic': academic,
  };

  /// Returns a copy of LeaveBalance with updated values.
  LeaveBalance copyWith({
    int? sick,
    int? personal,
    int? emergency,
    int? academic,
  }) {
    return LeaveBalance(
      sick: sick ?? this.sick,
      personal: personal ?? this.personal,
      emergency: emergency ?? this.emergency,
      academic: academic ?? this.academic,
    );
  }

  /// Helper getter for total available leaves.
  int get totalAvailable => sick + personal + emergency + academic;
}
