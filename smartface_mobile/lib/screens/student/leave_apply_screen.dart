import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../core/constants.dart';
import '../../core/theme_controller.dart';

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
  bool _isSubmitting = false;

  Future<void> _selectDateRange(BuildContext context) async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.dark(
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

  void _submitApplication() async {
    if (_formKey.currentState!.validate() && _startDate != null) {
      setState(() => _isSubmitting = true);

      final args = ModalRoute.of(context)?.settings.arguments as Map?;
      final email = args?['email'] ?? 'student@example.com';

      final leaveData = {
        'user_id': email,
        'reason': _reasonController.text,
        'start_date': _startDate!.toUtc().toIso8601String(),
        'end_date': _endDate!.toUtc().toIso8601String(),
        'status': 'Pending',
        'document_url': null,
        'remarks': 'Awaiting department head review.',
        'created_at': DateTime.now().toUtc().toIso8601String(),
      };

      try {
        final response = await ApiService.applyLeave(leaveData);

        if (!mounted) return;
        setState(() => _isSubmitting = false);

        if (response.containsKey('id') || response.containsKey('message')) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Leave application submitted successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(
            context,
            true,
          ); // Return true to trigger refresh in history screen
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
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.bgDark : AppColors.bgLight,
        image: DecorationImage(
          image: const NetworkImage(
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
          ),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            isDark ? Colors.black.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.85),
            isDark ? BlendMode.dstATop : BlendMode.srcOver,
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(
            'Apply for Leave',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppColors.bgDark,
            ),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back_ios, color: isDark ? Colors.white : AppColors.bgDark),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 32),
                _buildDateSelector(),
                const SizedBox(height: 24),
                _buildReasonField(),
                const SizedBox(height: 24),
                _buildUploadSection(),
                const SizedBox(height: 40),
                _buildSubmitButton(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'REQUEST ABSENCE',
          style: GoogleFonts.inter(
            fontSize: 12,
            letterSpacing: 2,
            color: AppColors.gold,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Ensure your application is submitted at least 24 hours in advance.',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.6),
            fontSize: 14,
          ),
        ),
      ],
    ).animate().fadeIn(duration: 600.ms).slideX(begin: -0.1);
  }

  Widget _buildDateSelector() {
    return GestureDetector(
      onTap: () => _selectDateRange(context),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.15)),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today, color: AppColors.gold),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Duration',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _startDate == null
                        ? 'Select Dates'
                        : '${_startDate!.day}/${_startDate!.month} - ${_endDate!.day}/${_endDate!.month}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios,
              color: Colors.white24,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReasonField() {
    return TextFormField(
      controller: _reasonController,
      maxLines: 4,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: 'Reason for Leave',
        labelStyle: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
        alignLabelWithHint: true,
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: AppColors.gold, width: 1.5),
        ),
      ),
      validator: (value) =>
          value == null || value.isEmpty ? 'Please provide a reason' : null,
    );
  }

  Widget _buildUploadSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.05),
          style: BorderStyle.solid,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.cloud_upload_outlined,
              color: Colors.white54,
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Supporting Documents',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Upload medical certificates or letters',
                  style: TextStyle(color: Colors.white38, fontSize: 11),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () {},
            child: const Text(
              'ATTACH',
              style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold),
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
          padding: const EdgeInsets.symmetric(vertical: 18),
          backgroundColor: AppColors.gold,
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 5,
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
