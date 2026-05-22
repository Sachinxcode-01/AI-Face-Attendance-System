import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/theme_controller.dart';
import '../../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  bool _isUploading = false;
  bool _initialized = false;
  bool _isDragOver = false;
  Map<String, dynamic> _profileData = {};
  File? _localAvatarFile; // local preview before server confirms

  // Rotating scan animation controller
  late AnimationController _scanController;
  late AnimationController _pulseController;

  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _scanController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _fetchProfile();
      _initialized = true;
    }
  }

  Future<void> _fetchProfile() async {
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final token = args?['token'] ?? '';
    final email = args?['email'] ?? '';

    if (token.isEmpty) {
      setState(() {
        _isLoading = false;
        _profileData = {
          'full_name': 'Demo User',
          'email': email.isNotEmpty ? email : 'demo@student.com',
          'phone': '+91 98765 43210',
          'student_id': 'SF-2026-9999',
          'college': 'SmartFace University',
          'department': 'CSE',
          'semester': 'Semester 6',
          'dob': '2002-01-01',
        };
      });
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await ApiService.getUserProfile(token);
      if (res.containsKey('email')) {
        setState(() {
          _profileData = res;
          _isLoading = false;
        });
      } else {
        throw Exception(res['detail'] ?? 'Failed to load profile');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading profile: $e')),
      );
    }
  }

  /// Shows bottom sheet to pick source: Gallery or Camera
  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF0F1532),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.3)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Update Profile Photo',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'JPEG, PNG or WEBP · Max 5 MB',
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.white38),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _sourceButton(
                    icon: Icons.photo_library_outlined,
                    label: 'Gallery',
                    onTap: () {
                      Navigator.pop(context);
                      _pickImage(ImageSource.gallery);
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _sourceButton(
                    icon: Icons.camera_alt_outlined,
                    label: 'Camera',
                    onTap: () {
                      Navigator.pop(context);
                      _pickImage(ImageSource.camera);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _sourceButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: const Color(0xFFFFD700).withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFFFD700).withValues(alpha: 0.25)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFFFFD700), size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final token = args?['token'] ?? '';

    try {
      final XFile? picked = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1024,
        maxHeight: 1024,
      );
      if (picked == null) return;

      final file = File(picked.path);
      final bytes = await file.readAsBytes();

      // Client-side size check (5 MB)
      if (bytes.length > 5 * 1024 * 1024) {
        if (!mounted) return;
        _showErrorSnack('Image too large. Please choose a file under 5 MB.');
        return;
      }

      // Show local preview immediately
      setState(() {
        _localAvatarFile = file;
        _isUploading = true;
      });

      if (token.isEmpty) {
        await Future.delayed(const Duration(milliseconds: 800));
        setState(() => _isUploading = false);
        _showSuccessSnack('Preview updated (demo mode — not saved to server).');
        return;
      }

      final result = await ApiService.uploadAvatar(file, token);

      if (!mounted) return;
      if (result.containsKey('avatar_url')) {
        setState(() {
          _profileData['avatar_url'] = result['avatar_url'];
          _isUploading = false;
        });
        _showSuccessSnack('Profile photo updated successfully! ✓');
      } else {
        setState(() {
          _localAvatarFile = null;
          _isUploading = false;
        });
        _showErrorSnack(result['detail'] ?? 'Upload failed. Please try again.');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _localAvatarFile = null;
        _isUploading = false;
      });
      _showErrorSnack('Error picking image: $e');
    }
  }

  void _showSuccessSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        const Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(msg, style: GoogleFonts.outfit())),
      ]),
      backgroundColor: const Color(0xFF1A8F5E),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ));
  }

  void _showErrorSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        const Icon(Icons.error_outline, color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(msg, style: GoogleFonts.outfit())),
      ]),
      backgroundColor: Colors.redAccent.shade700,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ));
  }

  void _showEditProfileSheet() {
    final nameCtrl = TextEditingController(text: _profileData['full_name'] ?? '');
    final phoneCtrl = TextEditingController(text: _profileData['phone'] ?? '');
    final dobCtrl = TextEditingController(text: _profileData['dob'] ?? '');
    final collegeCtrl = TextEditingController(text: _profileData['college'] ?? '');
    final deptCtrl = TextEditingController(text: _profileData['department'] ?? '');
    final semCtrl = TextEditingController(text: _profileData['semester'] ?? '');
    final idCtrl = TextEditingController(text: _profileData['student_id'] ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.78,
            decoration: const BoxDecoration(
              color: Color(0xFF0F1532),
              borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              border: Border(
                top: BorderSide(color: Color(0xFFFFD700), width: 1.5),
              ),
            ),
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
              child: Scaffold(
                backgroundColor: Colors.transparent,
                appBar: AppBar(
                  title: Text(
                    'Update Profile Details',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFFFFD700),
                    ),
                  ),
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  leading: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white70),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                body: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 10.0),
                  child: Column(
                    children: [
                      const SizedBox(height: 10),
                      _buildModalTextField('Full Name', Icons.person_outline, nameCtrl),
                      const SizedBox(height: 15),
                      _buildModalTextField('Phone Number', Icons.phone_android_outlined, phoneCtrl),
                      const SizedBox(height: 15),
                      _buildModalTextField('Date of Birth', Icons.calendar_today_outlined, dobCtrl),
                      const SizedBox(height: 15),
                      _buildModalTextField('College/Institution', Icons.school_outlined, collegeCtrl),
                      const SizedBox(height: 15),
                      _buildModalTextField('Department', Icons.account_tree_outlined, deptCtrl),
                      const SizedBox(height: 15),
                      _buildModalTextField('Current Semester', Icons.menu_book_outlined, semCtrl),
                      const SizedBox(height: 15),
                      _buildModalTextField('Student ID / Registration ID', Icons.badge_outlined, idCtrl),
                      const SizedBox(height: 35),
                      SizedBox(
                        width: double.infinity,
                        height: 55,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFFD700),
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 5,
                          ),
                          onPressed: () async {
                            final args = ModalRoute.of(this.context)?.settings.arguments as Map?;
                            final token = args?['token'] ?? '';
                            final updatedData = {
                              'full_name': nameCtrl.text.trim(),
                              'phone': phoneCtrl.text.trim(),
                              'dob': dobCtrl.text.trim(),
                              'college': collegeCtrl.text.trim(),
                              'department': deptCtrl.text.trim(),
                              'semester': semCtrl.text.trim(),
                              'student_id': idCtrl.text.trim(),
                            };
                            Navigator.pop(context);
                            setState(() => _isLoading = true);
                            try {
                              if (token.isNotEmpty) {
                                await ApiService.updateProfile(updatedData, token);
                              }
                              if (!mounted) return;
                              ScaffoldMessenger.of(this.context).showSnackBar(
                                SnackBar(
                                  content: Text('Profile synced successfully!', style: GoogleFonts.outfit()),
                                  backgroundColor: const Color(0xFF1A8F5E),
                                ),
                              );
                              _fetchProfile();
                            } catch (e) {
                              if (!mounted) return;
                              setState(() => _isLoading = false);
                              ScaffoldMessenger.of(this.context).showSnackBar(
                                SnackBar(content: Text('Failed to update: $e')),
                              );
                            }
                          },
                          child: Text(
                            'SAVE CHANGES',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildModalTextField(String label, IconData icon, TextEditingController controller) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white38, fontSize: 13),
        prefixIcon: Icon(icon, color: const Color(0xFFFFD700), size: 20),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.03),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Colors.white12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFFFD700), width: 1),
        ),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────
  //  AVATAR WIDGET — Clickable, drag-enabled, with upload HUD
  // ──────────────────────────────────────────────────────────────────
  Widget _buildAvatarSection(String initials) {
    final String? networkAvatarUrl = _profileData['avatar_url'] as String?;
    final hasNetworkAvatar = networkAvatarUrl != null && networkAvatarUrl.isNotEmpty;
    final hasLocalPreview = _localAvatarFile != null;

    ImageProvider? avatarImage;
    if (hasLocalPreview) {
      avatarImage = FileImage(_localAvatarFile!);
    } else if (hasNetworkAvatar) {
      final fullUrl = '${ApiService.baseUrl}$networkAvatarUrl?v=${DateTime.now().millisecondsSinceEpoch}';
      avatarImage = NetworkImage(fullUrl);
    }

    return DragTarget<String>(
      onWillAcceptWithDetails: (_) {
        setState(() => _isDragOver = true);
        return true;
      },
      onLeave: (_) => setState(() => _isDragOver = false),
      onAcceptWithDetails: (_) {
        setState(() => _isDragOver = false);
        _pickImage(ImageSource.gallery);
      },
      builder: (context, candidateData, rejectedData) {
        return GestureDetector(
          onTap: _isUploading ? null : _showImageSourceSheet,
          child: AnimatedBuilder(
            animation: Listenable.merge([_scanController, _pulseController]),
            builder: (ctx, child) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  // Outer pulsing glow ring
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 148,
                    height: 148,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: (_isDragOver
                                  ? Colors.cyanAccent
                                  : const Color(0xFFFFD700))
                              .withValues(
                                  alpha: _isUploading
                                      ? 0.15 + 0.25 * _pulseController.value
                                      : (_isDragOver ? 0.4 : 0.2)),
                          blurRadius: _isUploading ? 40 : 20,
                          spreadRadius: _isUploading ? 8 : 4,
                        ),
                      ],
                    ),
                  ),
                  // Gold border ring
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 144,
                    height: 144,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _isDragOver
                            ? Colors.cyanAccent
                            : const Color(0xFFFFD700),
                        width: _isDragOver ? 3 : 2,
                      ),
                    ),
                  ),
                  // Rotating scan arc (only when uploading)
                  if (_isUploading)
                    SizedBox(
                      width: 144,
                      height: 144,
                      child: CustomPaint(
                        painter: _ScanArcPainter(_scanController.value),
                      ),
                    ),
                  // Avatar circle
                  CircleAvatar(
                    radius: 68,
                    backgroundColor: const Color(0xFF0F1532),
                    backgroundImage: avatarImage,
                    child: avatarImage == null
                        ? Text(
                            initials.isNotEmpty ? initials : 'AI',
                            style: GoogleFonts.outfit(
                              fontSize: 34,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFFFD700),
                              letterSpacing: 1.5,
                            ),
                          )
                        : null,
                  ),
                  // Upload overlay
                  if (_isUploading)
                    Container(
                      width: 136,
                      height: 136,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.black.withValues(alpha: 0.55),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 28,
                            height: 28,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Color.lerp(
                                  const Color(0xFFFFD700),
                                  Colors.cyanAccent,
                                  _pulseController.value,
                                )!,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Uploading…',
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              color: Colors.white70,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  // Camera icon badge (bottom right)
                  if (!_isUploading)
                    Positioned(
                      bottom: 0,
                      right: 2,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: _isDragOver
                              ? Colors.cyanAccent
                              : const Color(0xFFFFD700),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFFFD700).withValues(alpha: 0.4),
                              blurRadius: 10,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: Icon(
                          _isDragOver
                              ? Icons.file_download_outlined
                              : Icons.camera_alt_rounded,
                          color: Colors.black,
                          size: 18,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;
    final initials = (_profileData['full_name'] ?? 'U')
        .toString()
        .trim()
        .split(' ')
        .map((e) => e.isNotEmpty ? e[0] : '')
        .take(2)
        .join()
        .toUpperCase();

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF0A0E21),
            Color(0xFF1D2671),
          ],
        ),
        image: DecorationImage(
          image: const NetworkImage(
              'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            Colors.black.withValues(alpha: 0.15),
            BlendMode.dstATop,
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(
            'My Profile',
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            if (!_isLoading)
              IconButton(
                onPressed: _showEditProfileSheet,
                icon: const Icon(Icons.edit_outlined, color: Color(0xFFFFD700)),
              ),
          ],
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFFD700)),
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 10.0),
                child: Column(
                  children: [
                    const SizedBox(height: 10),

                    // ── Avatar Upload Section ──────────────────────────
                    _buildAvatarSection(initials)
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .scale(delay: 100.ms),

                    const SizedBox(height: 10),

                    // Hint text
                    AnimatedOpacity(
                      opacity: _isUploading ? 0 : 1,
                      duration: const Duration(milliseconds: 300),
                      child: Text(
                        'Tap or drag an image to update photo',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          color: Colors.white30,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    // ── Name & Department ─────────────────────────────
                    Text(
                      _profileData['full_name'] ?? 'User',
                      style: GoogleFonts.outfit(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),

                    const SizedBox(height: 5),
                    Text(
                      _profileData['department'] != null && _profileData['college'] != null
                          ? '${_profileData['department']} • ${_profileData['college']}'
                          : 'SmartFace Academic Student',
                      style: GoogleFonts.outfit(color: Colors.white54, fontSize: 13),
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 300.ms),

                    const SizedBox(height: 35),

                    // ── Profile Fields ────────────────────────────────
                    _buildProfileCard(Icons.badge_outlined, 'Student ID', _profileData['student_id'] ?? 'N/A', 1),
                    _buildProfileCard(Icons.email_outlined, 'Institutional Email', _profileData['email'] ?? 'N/A', 2),
                    _buildProfileCard(Icons.phone_outlined, 'Phone Number', _profileData['phone'] ?? 'N/A', 3),
                    _buildProfileCard(Icons.calendar_today_outlined, 'Date of Birth', _profileData['dob'] ?? 'N/A', 4),
                    _buildProfileCard(Icons.school_outlined, 'Institution', _profileData['college'] ?? 'N/A', 5),
                    _buildProfileCard(Icons.account_tree_outlined, 'Department', _profileData['department'] ?? 'N/A', 6),
                    _buildProfileCard(Icons.layers_outlined, 'Semester / Year', _profileData['semester'] ?? 'N/A', 7),

                    const SizedBox(height: 24),

                    // ── App Customization ─────────────────────────────
                    Container(
                      margin: const EdgeInsets.only(bottom: 15),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.03),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFD700).withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
                              color: const Color(0xFFFFD700),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 18),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'THEME SYSTEM',
                                  style: GoogleFonts.outfit(
                                    color: Colors.white38,
                                    fontSize: 10,
                                    letterSpacing: 1,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  isDark ? 'Dark Mode Active' : 'Light Mode Active',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch.adaptive(
                            value: isDark,
                            activeTrackColor: const Color(0xFFFFD700),
                            activeThumbColor: Colors.black,
                            onChanged: (_) => themeCtrl.toggle(),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 800.ms).slideX(begin: 0.05),

                    const SizedBox(height: 16),

                    // ── Logout ────────────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () =>
                            Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false),
                        icon: const Icon(Icons.logout_rounded, size: 20),
                        label: Text(
                          'LOGOUT SESSION',
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.redAccent,
                          side: const BorderSide(color: Colors.redAccent, width: 1.5),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                    ).animate().fadeIn(delay: 700.ms),

                    const SizedBox(height: 40),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildProfileCard(IconData icon, String label, String value, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFD700).withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: const Color(0xFFFFD700), size: 22),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: GoogleFonts.outfit(color: Colors.white38, fontSize: 10, letterSpacing: 1),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: (100 * index).ms).slideX(begin: 0.05);
  }
}

// ──────────────────────────────────────────────────────────────────
//  Custom painter: rotating cyan scan arc for upload HUD
// ──────────────────────────────────────────────────────────────────
class _ScanArcPainter extends CustomPainter {
  final double progress;
  _ScanArcPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 3;
    final startAngle = 2 * pi * progress - pi / 2;
    const sweepAngle = pi * 0.6; // 108° arc

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        colors: [Colors.transparent, Colors.cyanAccent],
        startAngle: 0,
        endAngle: sweepAngle,
        transform: GradientRotation(startAngle),
      ).createShader(Rect.fromCircle(center: center, radius: radius));

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(_ScanArcPainter old) => old.progress != progress;
}
