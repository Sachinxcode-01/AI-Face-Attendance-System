/*
|--------------------------------------------------------------------------
| File: leave_model.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Data model representing student leave applications, balances, and approval tracking.
|--------------------------------------------------------------------------
*/

/// Leave Application Data Model
///
/// Encapsulates all data related to a student's leave request,
/// including date boundaries, status, HOD status, and attachment info.
class LeaveModel {
  final String? id;
  final String studentEmail;
  final String reason;
  final String startDate;
  final String endDate;
  final String status; // 'Pending' | 'Approved' | 'Rejected' | 'Clarification'
  final String? remarks;
  final String? documentUrl;
  final String? createdAt;
  final String leaveType; // 'sick' | 'personal' | 'emergency' | 'academic'
  final String hodStatus; // 'pending' | 'approved' | 'rejected' | 'none'
  final String? approvalDate;
  final bool isClarificationRequested;
  final String? attachmentName;

  const LeaveModel({
    this.id,
    required this.studentEmail,
    required this.reason,
    required this.startDate,
    required this.endDate,
    this.status = 'Pending',
    this.remarks,
    this.documentUrl,
    this.createdAt,
    this.leaveType = 'personal',
    this.hodStatus = 'none',
    this.approvalDate,
    this.isClarificationRequested = false,
    this.attachmentName,
  });

  /// Computed getter for the duration of the leave in days.
  int get durationDays {
    try {
      final start = DateTime.parse(startDate);
      final end = DateTime.parse(endDate);
      return end.difference(start).inDays + 1;
    } catch (_) {
      return 1;
    }
  }

  /// Factory constructor for deserialization from a JSON map.
  factory LeaveModel.fromJson(Map<String, dynamic> json) {
    return LeaveModel(
      id: json['id'] as String? ?? json['_id'] as String?,
      studentEmail:
          json['student_email'] as String? ?? json['user_id'] as String? ?? '',
      reason: json['reason'] as String? ?? 'No reason provided',
      startDate: json['start_date'] as String? ?? '',
      endDate: json['end_date'] as String? ?? '',
      status: json['status'] as String? ?? 'Pending',
      remarks: json['remarks'] as String?,
      documentUrl: json['document_url'] as String?,
      createdAt: json['created_at'] as String?,
      leaveType: json['leave_type'] as String? ?? 'personal',
      hodStatus: json['hod_status'] as String? ?? 'none',
      approvalDate: json['approval_date'] as String?,
      isClarificationRequested:
          json['is_clarification_requested'] as bool? ?? false,
      attachmentName: json['attachment_name'] as String?,
    );
  }

  /// Convert model properties back to a JSON-compatible map.
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'student_email': studentEmail,
      'reason': reason,
      'start_date': startDate,
      'end_date': endDate,
      'status': status,
      if (remarks != null) 'remarks': remarks,
      if (documentUrl != null) 'document_url': documentUrl,
      if (createdAt != null) 'created_at': createdAt,
      'leave_type': leaveType,
      'hod_status': hodStatus,
      if (approvalDate != null) 'approval_date': approvalDate,
      'is_clarification_requested': isClarificationRequested,
      if (attachmentName != null) 'attachment_name': attachmentName,
    };
  }

  /// Creates a copy of this LeaveModel with updated fields.
  LeaveModel copyWith({
    String? id,
    String? studentEmail,
    String? reason,
    String? startDate,
    String? endDate,
    String? status,
    String? remarks,
    String? documentUrl,
    String? createdAt,
    String? leaveType,
    String? hodStatus,
    String? approvalDate,
    bool? isClarificationRequested,
    String? attachmentName,
  }) {
    return LeaveModel(
      id: id ?? this.id,
      studentEmail: studentEmail ?? this.studentEmail,
      reason: reason ?? this.reason,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      status: status ?? this.status,
      remarks: remarks ?? this.remarks,
      documentUrl: documentUrl ?? this.documentUrl,
      createdAt: createdAt ?? this.createdAt,
      leaveType: leaveType ?? this.leaveType,
      hodStatus: hodStatus ?? this.hodStatus,
      approvalDate: approvalDate ?? this.approvalDate,
      isClarificationRequested:
          isClarificationRequested ?? this.isClarificationRequested,
      attachmentName: attachmentName ?? this.attachmentName,
    );
  }
}
