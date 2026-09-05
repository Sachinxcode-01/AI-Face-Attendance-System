/*
|--------------------------------------------------------------------------
| File: leave_apply_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the screen for students to submit leave applications.
| Includes date-range picker, reason field validator, and document attachment placeholders.
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/leave/controllers/leave_controller.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class LeaveApplyScreen extends StatefulWidget {
  const LeaveApplyScreen({super.key});

  @override
  State<LeaveApplyScreen> createState() => _LeaveApplyScreenState();
}

class _LeaveApplyScreenState extends State<LeaveApplyScreen> {
  final _formKey = GlobalKey<FormState>();
  DateTime? _startDate;
  DateTime? _endDate;
  final _reasonController = TextEditingController();
  String _selectedLeaveType = 'personal';
  String? _attachmentName;
  bool _isSubmitting = false;

  final List<Map<String, String>> _leaveTypes = [
    {'value': 'sick', 'label': 'Sick Leave'},
    {'value': 'personal', 'label': 'Personal Leave'},
    {'value': 'emergency', 'label': 'Emergency Leave'},
    {'value': 'academic', 'label': 'Academic Leave'},
  ];

  int get _durationDays {
    if (_startDate == null || _endDate == null) return 0;
    return _endDate!.difference(_startDate!).inDays + 1;
  }

  Future<void> _selectDateRange(BuildContext context) async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 7)),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppColors.gold,
              onPrimary: Colors.black,
              surface: AppColors.bgModal,
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
    }
  }

  void _pickAttachment() {
    setState(() {
      _attachmentName =
          'medical_clearance_${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}.pdf';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Attached: $_attachmentName'),
        backgroundColor: Colors.teal,
      ),
    );
  }

  void _submitApplication() async {
    if (_formKey.currentState!.validate() && _startDate != null) {
      setState(() => _isSubmitting = true);

      final session = context.read<SessionManager>();
      final email = session.email ?? 'student@example.com';
      final controller = context.read<LeaveController>();

      final leaveData = {
        'student_email': email,
        'user_id': email,
        'reason': _reasonController.text.trim(),
        'start_date': _startDate!.toUtc().toIso8601String(),
        'end_date': _endDate!.toUtc().toIso8601String(),
        'leave_type': _selectedLeaveType,
        'attachment_name': _attachmentName,
        'status': 'Pending',
        'document_url': null,
        'remarks': 'Awaiting department head review.',
        'created_at': DateTime.now().toUtc().toIso8601String(),
      };

      try {
        final response = await controller.applyLeave(leaveData);

        if (!mounted) return;
        setState(() => _isSubmitting = false);

        if (response.containsKey('id') || response.containsKey('message')) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Leave application submitted successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Error: ${response['detail'] ?? 'Failed to submit leave application'}',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      } catch (e) {
        if (!mounted) return;
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Connection failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } else if (_startDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a date range')),
      );
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeController>().isDark;

    return AuroraBackground(
      baseColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      animate: isDark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Leave Request',
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios,
              color: isDark ? Colors.white : AppColors.bgDark,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(isDark),
                const SizedBox(height: 28),
                _buildTypeSelector(isDark),
                const SizedBox(height: 20),
                _buildDateSelector(isDark),
                const SizedBox(height: 20),
                _buildReasonField(isDark),
                const SizedBox(height: 20),
                _buildUploadSection(isDark),
                const SizedBox(height: 36),
                _buildSubmitButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'REQUEST ABSENCE',
          style: GoogleFonts.inter(
            fontSize: 11,
            letterSpacing: 2.0,
            color: AppColors.gold,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Submit a formal leave application below. All submissions are audited by faculty and HOD for attendance exemption eligibility.',
          style: TextStyle(
            color: isDark ? Colors.white70 : Colors.black87,
            fontSize: 14,
          ),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms).slideX(begin: -0.05);
  }

  Widget _buildTypeSelector(bool isDark) {
    return GlassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: DropdownButtonFormField<String>(
        initialValue: _selectedLeaveType,
        dropdownColor: AppColors.bgModal,
        style: TextStyle(
          color: isDark ? Colors.white : Colors.black87,
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
        decoration: InputDecoration(
          labelText: 'Leave Category',
          labelStyle: TextStyle(
            color: isDark ? Colors.white54 : Colors.black54,
          ),
          border: InputBorder.none,
        ),
        items: _leaveTypes.map((type) {
          return DropdownMenuItem<String>(
            value: type['value'],
            child: Text(type['label']!),
          );
        }).toList(),
        onChanged: (val) {
          if (val != null) {
            setState(() {
              _selectedLeaveType = val;
            });
          }
        },
      ),
    );
  }

  Widget _buildDateSelector(bool isDark) {
    return GestureDetector(
      onTap: () => _selectDateRange(context),
      child: GlassContainer(
        padding: const EdgeInsets.all(18),
        borderColor: AppColors.gold.withValues(alpha: 0.15),
        child: Row(
          children: [
            const Icon(Icons.calendar_today_rounded, color: AppColors.gold),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Duration & Dates',
                    style: TextStyle(
                      color: isDark ? Colors.white54 : Colors.black54,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _startDate == null
                        ? 'Select Absence Window'
                        : '${_startDate!.day}/${_startDate!.month} to ${_endDate!.day}/${_endDate!.month} ($_durationDays Days)',
                    style: TextStyle(
                      color: isDark ? Colors.white : AppColors.bgDark,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios_rounded,
              color: isDark ? Colors.white24 : Colors.black26,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReasonField(bool isDark) {
    return TextFormField(
      controller: _reasonController,
      maxLines: 4,
      style: TextStyle(color: isDark ? Colors.white : Colors.black87),
      decoration: InputDecoration(
        labelText: 'Detailed Reason for Absence',
        labelStyle: TextStyle(color: isDark ? Colors.white54 : Colors.black54),
        alignLabelWithHint: true,
        filled: true,
        fillColor: isDark
            ? Colors.white.withValues(alpha: 0.04)
            : Colors.black.withValues(alpha: 0.03),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.gold, width: 1.5),
        ),
      ),
      validator: (value) =>
          value == null || value.isEmpty ? 'Please specify your reason' : null,
    );
  }

  Widget _buildUploadSection(bool isDark) {
    return GlassContainer(
      padding: const EdgeInsets.all(18),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.cloud_upload_outlined,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _attachmentName ?? 'Supporting Document',
                  style: TextStyle(
                    color: isDark ? Colors.white : AppColors.bgDark,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'Upload medical certificate or event letters',
                  style: TextStyle(
                    color: isDark ? Colors.white38 : Colors.black45,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: _pickAttachment,
            child: Text(
              _attachmentName == null ? 'ATTACH' : 'REPLACE',
              style: const TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isSubmitting ? null : _submitApplication,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          backgroundColor: AppColors.gold,
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 4,
          shadowColor: AppColors.gold.withValues(alpha: 0.25),
        ),
        child: _isSubmitting
            ? const CircularProgressIndicator(color: Colors.black)
            : const Text(
                'SUBMIT APPLICATION',
                style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1),
              ),
      ),
    );
  }
}
