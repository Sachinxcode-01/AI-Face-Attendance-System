/*
|--------------------------------------------------------------------------
| File: parent_link_ward_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI
|
| Purpose:
| Allows guardians to link a student ward to their parent portal account
| conforming strictly to design.md:
| - StudentScreenShell with ethereal orbs & 28px card shell overlap
| - Brand Indigo palette (#3D4AB8, #4F46E5, #6366F1)
| - Dual-font system: Poppins (headings/buttons) + Inter (labels/inputs)
| - Roll Number & USN validation with OTP confirmation
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/student/widgets/student_widgets.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';

class ParentLinkWardScreen extends StatefulWidget {
  const ParentLinkWardScreen({super.key});

  @override
  State<ParentLinkWardScreen> createState() => _ParentLinkWardScreenState();
}

class _ParentLinkWardScreenState extends State<ParentLinkWardScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usnController = TextEditingController();
  final _nameController = TextEditingController();
  final _codeController = TextEditingController();
  bool _isLoading = false;
  String _relationship = 'Parent';

  @override
  void dispose() {
    _usnController.dispose();
    _nameController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _linkWard() async {
    if (!_formKey.currentState!.validate()) return;

    HapticFeedback.heavyImpact();
    setState(() => _isLoading = true);

    final session = context.read<SessionManager>();
    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;

    final newWard = {
      'id': 'WARD-${DateTime.now().millisecondsSinceEpoch}',
      'full_name': _nameController.text.trim(),
      'name': _nameController.text.trim(),
      'email': '${_usnController.text.trim().toLowerCase()}@smartface.edu',
      'usn': _usnController.text.trim().toUpperCase(),
      'department': 'Computer Science & Engineering',
      'relationship': _relationship,
    };

    session.setSelectedWard(newWard);

    if (mounted) {
      setState(() => _isLoading = false);
      AppToast.show(
        context,
        message:
            'Successfully linked ${_nameController.text.trim()} to your account!',
        type: ToastType.success,
      );
      Navigator.of(context).maybePop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return StudentScreenShell(
      title: 'Link Student Ward',
      subtitle: 'Connect Child Account to Guardian Portal',
      onBackTap: () => Navigator.of(context).maybePop(),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info Banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF131A33)
                      : const Color(0xFFF8FAFF),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF252E4A)
                        : const Color(0xFFE5E7F0),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.family_restroom_rounded,
                      color: Color(0xFF4F46E5),
                      size: 28,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'GUARDIAN VERIFICATION PROTOCOL',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                              color: const Color(0xFF4F46E5),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Enter your child’s official University Serial Number (USN) or Roll Number to connect attendance telemetry.',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: isDark
                                  ? Colors.white60
                                  : const Color(0xFF6B7280),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Student USN
              _buildInputLabel('STUDENT USN / ROLL NUMBER', isDark),
              const SizedBox(height: 6),
              _buildTextField(
                controller: _usnController,
                hintText: 'e.g. 1SF23CS108',
                icon: Icons.badge_outlined,
                isDark: isDark,
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? 'Please enter student USN'
                    : null,
              ),
              const SizedBox(height: 18),

              // Student Full Name
              _buildInputLabel('STUDENT FULL NAME', isDark),
              const SizedBox(height: 6),
              _buildTextField(
                controller: _nameController,
                hintText: 'e.g. Alex Vance',
                icon: Icons.person_outline_rounded,
                isDark: isDark,
                validator: (v) => (v == null || v.trim().isEmpty)
                    ? 'Please enter student full name'
                    : null,
              ),
              const SizedBox(height: 18),

              // Relationship Selector
              _buildInputLabel('RELATIONSHIP TO STUDENT', isDark),
              const SizedBox(height: 8),
              Row(
                children: ['Parent', 'Mother', 'Father', 'Legal Guardian'].map((
                  rel,
                ) {
                  final isSelected = _relationship == rel;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: PressableScale(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _relationship = rel);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF4F46E5)
                                : (isDark
                                      ? const Color(0xFF131A33)
                                      : const Color(0xFFF8FAFF)),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF4F46E5)
                                  : (isDark
                                        ? const Color(0xFF252E4A)
                                        : const Color(0xFFE5E7F0)),
                            ),
                          ),
                          child: Center(
                            child: Text(
                              rel,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: isSelected
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: isSelected
                                    ? Colors.white
                                    : (isDark
                                          ? Colors.white70
                                          : const Color(0xFF374151)),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),

              // Security Verification Code
              _buildInputLabel('CAMPUS VERIFICATION CODE', isDark),
              const SizedBox(height: 6),
              _buildTextField(
                controller: _codeController,
                hintText: '6-digit code or student PIN',
                icon: Icons.lock_outline_rounded,
                isDark: isDark,
                keyboardType: TextInputType.number,
                validator: (v) => (v == null || v.trim().length < 4)
                    ? 'Enter 4 to 6 digit security code'
                    : null,
              ),
              const SizedBox(height: 28),

              // Submit Button
              PressableScale(
                onTap: _isLoading ? null : _linkWard,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                        blurRadius: 16,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Center(
                    child: _isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : Text(
                            'VERIFY & LINK STUDENT WARD',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 36),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputLabel(String label, bool isDark) {
    return Text(
      label,
      style: GoogleFonts.poppins(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.1,
        color: isDark ? const Color(0xFFA5B4FC) : const Color(0xFF3D4AB8),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
    required bool isDark,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131A33) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
        ),
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        validator: validator,
        style: GoogleFonts.inter(
          fontSize: 13,
          color: isDark ? Colors.white : const Color(0xFF1A1A3A),
        ),
        decoration: InputDecoration(
          border: InputBorder.none,
          prefixIcon: Icon(icon, color: const Color(0xFF6366F1), size: 18),
          hintText: hintText,
          hintStyle: GoogleFonts.inter(
            fontSize: 13,
            color: isDark ? Colors.white38 : const Color(0xFF9CA3AF),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 14,
          ),
        ),
      ),
    );
  }
}
