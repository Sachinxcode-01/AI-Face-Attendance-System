class LeaveModel {
  const LeaveModel({
    required this.id,
    required this.reason,
    required this.startDate,
    required this.endDate,
    required this.status,
    this.remarks,
  });

  final String id;
  final String reason;
  final String startDate;
  final String endDate;
  final String status;
  final String? remarks;

  factory LeaveModel.fromJson(Map<String, dynamic> json) {
    return LeaveModel(
      id: _stringValue(json['id'] ?? json['_id'] ?? json['leave_id']),
      reason: _stringValue(json['reason']),
      startDate: _stringValue(json['start_date'] ?? json['startDate']),
      endDate: _stringValue(json['end_date'] ?? json['endDate']),
      status: _stringValue(json['status'], fallback: 'pending'),
      remarks: _nullableString(json['remarks'] ?? json['admin_remarks']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'reason': reason,
      'start_date': startDate,
      'end_date': endDate,
      'status': status,
      if (remarks != null) 'remarks': remarks,
    };
  }

  static String _stringValue(Object? value, {String fallback = ''}) {
    if (value == null) return fallback;
    return value.toString();
  }

  static String? _nullableString(Object? value) {
    if (value == null) return null;
    final text = value.toString();
    return text.isEmpty ? null : text;
  }
}
