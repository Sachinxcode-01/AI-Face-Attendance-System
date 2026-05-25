import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../core/constants.dart';
import '../core/session_manager.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _auth = FirebaseAuth.instance;
  bool _isLoading = false;
  bool _otpSent = false;
  bool _usePassword = true;
  bool _showPassword = false;

  String selectedRole = 'Student';

  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      final GoogleSignInAccount? googleUser = await GoogleSignIn(
        serverClientId:
            '153684832501-4mikvqi78kam3j1tcmnab7gp1o3e7mnt.apps.googleusercontent.com',
      ).signIn();
      if (googleUser == null) {
        setState(() => _isLoading = false);
        return;
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final UserCredential userCredential = await _auth.signInWithCredential(
        credential,
      );

      if (userCredential.user != null) {
        final email = userCredential.user!.email ?? '';
        final name = userCredential.user!.displayName ?? 'User';
        final photoUrl = userCredential.user!.photoURL;

        final result = await ApiService.googleLogin(
          email,
          name,
          selectedRole,
          avatarUrl: photoUrl,
        );

        if (result.containsKey('access_token')) {
          if (!mounted) return;
          final session = context.read<SessionManager>();
          await session.saveSession(
            token: result['access_token'],
            email: email,
            role: result['role'],
          );
          if (!mounted) return;
          final bool biometricRegistered =
              result['biometric_registered'] ?? false;
          final String targetRoute = biometricRegistered
              ? '/dashboard'
              : '/setup';
          Navigator.pushReplacementNamed(
            context,
            targetRoute,
            arguments: {
              'role': result['role'],
              'token': result['access_token'],
              'email': email,
            },
          );
        } else {
          throw Exception(result['detail'] ?? 'Google Login failed on server');
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Google Sign-In failed: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _signInWithPassword() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter email and password')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await ApiService.loginWithPassword(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );

      if (result.containsKey('access_token')) {
        if (!mounted) return;
        final session = context.read<SessionManager>();
        await session.saveSession(
          token: result['access_token'],
          email: _emailController.text.trim(),
          role: result['role'],
        );
        if (!mounted) return;
        final bool biometricRegistered =
            result['biometric_registered'] ?? false;
        final String targetRoute = biometricRegistered
            ? '/dashboard'
            : '/setup';
        Navigator.pushReplacementNamed(
          context,
          targetRoute,
          arguments: {
            'role': result['role'],
            'token': result['access_token'],
            'email': _emailController.text.trim(),
          },
        );
      } else {
        throw Exception(result['detail'] ?? 'Login failed');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Login failed: ${e.toString().replaceAll("Exception: ", "")}',
          ),
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _sendOtp() async {
    if (_emailController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your institutional email')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await ApiService.sendLoginOtp(
        _emailController.text.trim(),
      );
      if (result.containsKey('message')) {
        setState(() => _otpSent = true);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('OTP sent to your email!')),
        );
      } else {
        throw Exception(result['detail'] ?? 'Failed to send OTP');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit OTP')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await ApiService.verifyLoginOtp(
        _emailController.text.trim(),
        _otpController.text.trim(),
      );

      if (result.containsKey('access_token')) {
        if (!mounted) return;
        final session = context.read<SessionManager>();
        await session.saveSession(
          token: result['access_token'],
          email: _emailController.text.trim(),
          role: result['role'],
        );
        if (!mounted) return;
        final bool biometricRegistered =
            result['biometric_registered'] ?? false;
        final String targetRoute = biometricRegistered
            ? '/dashboard'
            : '/setup';
        Navigator.pushReplacementNamed(
          context,
          targetRoute,
          arguments: {
            'role': result['role'],
            'token': result['access_token'],
            'email': _emailController.text.trim(),
          },
        );
      } else {
        throw Exception(result['detail'] ?? 'Verification failed');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Invalid OTP: $e')));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // 🌌 Beautiful Ambient Glow Mesh Background
          _buildAmbientGlowBackground(),

          // 📱 Form Scroll Area
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 28.0,
                  vertical: 16.0,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // --- LUXURY BRAND LOGO ZONE ---
                    _buildAnimatedLogoHUD(),

                    const SizedBox(height: 24),

                    Text(
                          'SmartAttendance-\nAI',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 38,
                            height: 1.15,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                            color: AppColors.gold,
                            shadows: [
                              const Shadow(
                                color: Colors.black54,
                                offset: Offset(0, 4),
                                blurRadius: 12,
                              ),
                              Shadow(
                                color: AppColors.gold.withValues(alpha: 0.3),
                                blurRadius: 20,
                              ),
                            ],
                          ),
                        )
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: 0.15, end: 0, duration: 400.ms),

                    const SizedBox(height: 8),

                    Text(
                      'PREMIUM BIOMETRIC INTELLIGENCE',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.white38,
                        letterSpacing: 3.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

                    const SizedBox(height: 35),

                    // --- STYLISH SLIDING ROLE SELECTOR ---
                    if (!_otpSent)
                      _buildPremiumRoleSelector()
                          .animate()
                          .fadeIn(delay: 300.ms, duration: 400.ms)
                          .slideY(begin: 0.1, end: 0, duration: 400.ms),

                    const SizedBox(height: 25),

                    // --- GLASSMORPHIC ACCESS CARD ---
                    _buildGlassmorphicFormCard()
                        .animate()
                        .fadeIn(delay: 400.ms, duration: 500.ms)
                        .scaleXY(
                          begin: 0.95,
                          end: 1.0,
                          curve: Curves.easeOutBack,
                          duration: 500.ms,
                        ),

                    const SizedBox(height: 25),

                    // --- FOOTER SIGN-UP TRIGGER ---
                    _buildFooterNavigator().animate().fadeIn(
                      delay: 600.ms,
                      duration: 400.ms,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 🛡️ CYBERNETIC BIOMETRIC HUD SCANNER OVERLAY
          if (_isLoading) _buildBiometricScannerLoading(),
        ],
      ),
    );
  }

  // 1. Ambient Breathing Glow mesh helper
  Widget _buildAmbientGlowBackground() {
    return Stack(
      children: [
        // Base dark cosmic space canvas
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF040613), // Ultra Deep Space Black
                Color(0xFF0C1033), // Royal Dark Navy
              ],
            ),
          ),
        ),

        // Floating Ambient Mesh Light 1 (Gold/Amber)
        Positioned(
          top: -80,
          left: -40,
          child:
              Container(
                    width: 280,
                    height: 280,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.gold.withValues(alpha: 0.12),
                    ),
                  )
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .scale(
                    begin: const Offset(0.9, 0.9),
                    end: const Offset(1.25, 1.25),
                    duration: 5.seconds,
                    curve: Curves.easeInOut,
                  )
                  .move(
                    begin: const Offset(0, 0),
                    end: const Offset(20, 30),
                    duration: 5.seconds,
                    curve: Curves.easeInOut,
                  ),
        ),

        // Floating Ambient Mesh Light 2 (Indigo Pulse)
        Positioned(
          bottom: -100,
          right: -80,
          child:
              Container(
                    width: 380,
                    height: 380,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFF1D2671).withValues(alpha: 0.28),
                    ),
                  )
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .scale(
                    begin: const Offset(1.15, 1.15),
                    end: const Offset(0.85, 0.85),
                    duration: 7.seconds,
                    curve: Curves.easeInOut,
                  )
                  .move(
                    begin: const Offset(0, 0),
                    end: const Offset(-30, -40),
                    duration: 7.seconds,
                    curve: Curves.easeInOut,
                  ),
        ),

        // Floating Ambient Mesh Light 3 (Cyber Cyan)
        Positioned(
          top: 250,
          right: -90,
          child:
              Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFF00F2FE).withValues(alpha: 0.08),
                    ),
                  )
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .scale(
                    begin: const Offset(0.8, 0.8),
                    end: const Offset(1.2, 1.2),
                    duration: 6.seconds,
                    curve: Curves.easeInOut,
                  )
                  .move(
                    begin: const Offset(0, 0),
                    end: const Offset(-20, 20),
                    duration: 6.seconds,
                    curve: Curves.easeInOut,
                  ),
        ),

        // Matte Glassmorphic Blur Shield
        BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
          child: Container(color: Colors.transparent),
        ),

        // Glowing Cybernetic Facial Grid Mesh
        Opacity(
              opacity: 0.07,
              child: Container(
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage('assets/images/ai_face_grid.png'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            )
            .animate(onPlay: (c) => c.repeat(reverse: true))
            .shimmer(
              duration: 5.seconds,
              color: AppColors.gold.withValues(alpha: 0.2),
            ),
      ],
    );
  }

  // 2. Beautiful holographic 3D Logo HUD with cybernetic overlays
  Widget _buildAnimatedLogoHUD() {
    return Center(
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Cyber golden radar wave
          Container(
                height: 185,
                width: 185,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.12),
                    width: 1.5,
                  ),
                ),
              )
              .animate(onPlay: (c) => c.repeat())
              .scale(
                begin: const Offset(0.85, 0.85),
                end: const Offset(1.15, 1.15),
                curve: Curves.easeInOut,
                duration: 2500.ms,
              )
              .fadeOut(duration: 2500.ms),

          // Outer thin tech ring
          Container(
            height: 165,
            width: 165,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.gold.withValues(alpha: 0.18),
                width: 1,
              ),
            ),
          ),

          // Holographic text indicators matching visual layout
          Positioned(
            left: -42,
            child: Opacity(
              opacity: 0.35,
              child: Text(
                'BIOMETRIC\nAUTHENTICATION',
                style: GoogleFonts.robotoMono(
                  fontSize: 7.5,
                  fontWeight: FontWeight.bold,
                  color: Colors.white38,
                  height: 1.3,
                ),
              ),
            ),
          ),

          Positioned(
            right: -32,
            child: Opacity(
              opacity: 0.35,
              child: Text(
                'USER RECOGNIZED\nPOINTS: 284',
                style: GoogleFonts.robotoMono(
                  fontSize: 7.5,
                  fontWeight: FontWeight.bold,
                  color: Colors.white38,
                  height: 1.3,
                ),
              ),
            ),
          ),

          // Concentric rotating tracking point rings
          Container(
            height: 145,
            width: 145,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.gold.withValues(alpha: 0.3),
                width: 1,
                strokeAlign: BorderSide.strokeAlignOutside,
              ),
            ),
          ).animate(onPlay: (c) => c.repeat()).rotate(duration: 12.seconds),

          // Rotating dashed circular HUD indicator
          Container(
            height: 130,
            width: 130,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.06),
                width: 1,
              ),
            ),
          ),

          // Central luxury Logo Shield
          Hero(
                tag: 'logo',
                child: Container(
                  height: 105,
                  width: 105,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF030510),
                    border: Border.all(color: AppColors.gold, width: 2.5),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.25),
                        blurRadius: 15,
                        spreadRadius: 1,
                      ),
                      const BoxShadow(
                        color: Colors.black54,
                        blurRadius: 10,
                        offset: Offset(0, 5),
                      ),
                    ],
                    image: const DecorationImage(
                      image: AssetImage('assets/images/logo.png'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              )
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .moveY(
                begin: -4,
                end: 4,
                duration: 1500.ms,
                curve: Curves.easeInOut,
              )
              .custom(
                builder: (context, value, child) => Transform(
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.0015)
                    ..rotateY(value * 0.08),
                  alignment: Alignment.center,
                  child: child,
                ),
              ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).scale(curve: Curves.easeOutBack);
  }

  // 3. Sliding Premium Roles selection with animated ambient glow capsule
  Widget _buildPremiumRoleSelector() {
    final roles = ['Student', 'Teacher', 'Admin'];
    final selectedIndex = roles.indexOf(selectedRole);
    return Container(
      height: 60,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final tabWidth = constraints.maxWidth / 3;
          return Stack(
            children: [
              // Beautiful animated soft gold glowing bubble behind the selected tab
              AnimatedPositioned(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeInOut,
                left: selectedIndex * tabWidth,
                top: 0,
                bottom: 0,
                width: tabWidth,
                child: Container(
                  margin: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(26),
                    gradient: const LinearGradient(
                      colors: [AppColors.gold, Color(0xFFFF9E00)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.4),
                        blurRadius: 15,
                        spreadRadius: 2,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                ),
              ),
              // The tabs themselves
              Row(
                children: roles.map((role) {
                  final isSelected = selectedRole == role;
                  return Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () {
                        setState(() => selectedRole = role);
                      },
                      child: Center(
                        child: Text(
                          role,
                          style: GoogleFonts.inter(
                            color: isSelected ? Colors.black : Colors.white60,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.w600,
                            fontSize: 15,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }

  // 4. Glassmorphic Form Access Panel matching pixel-perfect spacing
  Widget _buildGlassmorphicFormCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
      decoration: BoxDecoration(
        color: const Color(0xFF070B1A).withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.04),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.55),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
        ],
      ),
      child: Column(
        children: [
          if (_usePassword) ...[
            _buildTextField(
              controller: _emailController,
              hint: 'Institutional Email',
              icon: Icons.alternate_email_rounded,
            ),
            const SizedBox(height: 20),
            _buildTextField(
              controller: _passwordController,
              hint: 'Password',
              icon: Icons.lock_outline_rounded,
              isPassword: true,
              obscureText: !_showPassword,
              suffixIcon: IconButton(
                icon: Icon(
                  _showPassword
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  color: Colors.white38,
                  size: 20,
                ),
                onPressed: () => setState(() => _showPassword = !_showPassword),
              ),
            ),
            const SizedBox(height: 20),
            _buildButton(text: 'SIGN IN', onPressed: _signInWithPassword),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => setState(() {
                _usePassword = false;
                _otpSent = false;
              }),
              child: Text(
                'Sign In with OTP instead',
                style: GoogleFonts.inter(
                  color: AppColors.gold.withValues(alpha: 0.7),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ] else if (!_otpSent) ...[
            _buildTextField(
              controller: _emailController,
              hint: 'Institutional Email',
              icon: Icons.alternate_email_rounded,
            ),
            const SizedBox(height: 20),
            _buildButton(text: 'REQUEST SECURE OTP', onPressed: _sendOtp),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => setState(() => _usePassword = true),
              child: Text(
                'Sign In with Password instead',
                style: GoogleFonts.inter(
                  color: AppColors.gold.withValues(alpha: 0.7),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ] else ...[
            Text(
              'Verification Code Sent to',
              style: GoogleFonts.inter(color: Colors.white38, fontSize: 12),
            ),
            const SizedBox(height: 4),
            Text(
              _emailController.text,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ).animate().fadeIn(),
            const SizedBox(height: 20),
            _buildTextField(
              controller: _otpController,
              hint: 'Enter 6-Digit OTP',
              icon: Icons.security_rounded,
              isOtp: true,
            ),
            const SizedBox(height: 20),
            _buildButton(text: 'AUTHENTICATE & ENTER', onPressed: _verifyOtp),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: () => setState(() => _otpSent = false),
              child: Text(
                'Use different email address',
                style: GoogleFonts.inter(
                  color: AppColors.gold.withValues(alpha: 0.7),
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],

          const SizedBox(height: 24),

          Row(
            children: [
              Expanded(
                child: Divider(
                  color: Colors.white.withValues(alpha: 0.06),
                  height: 1,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Text(
                  'OR AUTHORIZE SECURELY',
                  style: GoogleFonts.inter(
                    color: Colors.white24,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Expanded(
                child: Divider(
                  color: Colors.white.withValues(alpha: 0.06),
                  height: 1,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Google secondary login
          SizedBox(
            width: double.infinity,
            height: 62,
            child: OutlinedButton(
              onPressed: _signInWithGoogle,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: BorderSide(
                  color: Colors.white.withValues(alpha: 0.08),
                  width: 1.2,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const GoogleGLogo(size: 22),
                  const SizedBox(width: 12),
                  Text(
                    'Continue with Google',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 5. Digital input with responsive glowing transitions
  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isOtp = false,
    bool isPassword = false,
    bool obscureText = false,
    Widget? suffixIcon,
  }) {
    return Focus(
      child: Builder(
        builder: (context) {
          final isFocused = Focus.of(context).hasFocus;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isFocused
                    ? AppColors.gold
                    : Colors.white.withValues(alpha: 0.08),
                width: isFocused ? 1.5 : 1.0,
              ),
              boxShadow: isFocused
                  ? [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.08),
                        blurRadius: 10,
                        spreadRadius: 1,
                      ),
                    ]
                  : [],
            ),
            child: TextField(
              controller: controller,
              keyboardType: isOtp
                  ? TextInputType.number
                  : isPassword
                  ? TextInputType.visiblePassword
                  : TextInputType.emailAddress,
              obscureText: obscureText,
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              textAlign: isOtp ? TextAlign.center : TextAlign.start,
              decoration: InputDecoration(
                prefixIcon: isOtp
                    ? null
                    : Padding(
                        padding: const EdgeInsets.only(left: 18.0, right: 14.0),
                        child: Icon(
                          icon,
                          color: isFocused ? AppColors.gold : Colors.white38,
                          size: 22,
                        ),
                      ),
                prefixIconConstraints: const BoxConstraints(
                  minWidth: 0,
                  minHeight: 0,
                ),
                suffixIcon: suffixIcon,
                hintText: hint,
                hintStyle: GoogleFonts.inter(
                  color: Colors.white38,
                  fontSize: 16,
                ),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.02),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  vertical: 20,
                  horizontal: 20,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // 6. Premium tactile golden key action button with rich 3D gold shadow glow
  Widget _buildButton({required String text, required VoidCallback onPressed}) {
    return Container(
      width: double.infinity,
      height: 62,
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: AppColors.gold.withValues(alpha: 0.35),
            blurRadius: 20,
            spreadRadius: 2,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFFFB300),
          foregroundColor: Colors.black,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        child: Text(
          text,
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w900,
            letterSpacing: 2.0,
            fontSize: 15,
            color: Colors.black,
          ),
        ),
      ),
    );
  }

  // 7. Footer navigation with customized link
  Widget _buildFooterNavigator() {
    return Container(
      padding: const EdgeInsets.only(top: 10, bottom: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'New to SmartAttendance? ',
            style: GoogleFonts.inter(
              color: Colors.white30,
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, '/register'),
            child: Text(
              'JOIN NOW',
              style: GoogleFonts.inter(
                color: AppColors.gold,
                fontWeight: FontWeight.w900,
                fontSize: 15,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 8. Professional Glassmorphic loading overlay
  Widget _buildBiometricScannerLoading() {
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 300),
      opacity: _isLoading ? 1.0 : 0.0,
      child: Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.black.withValues(alpha: 0.75),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 36),
              decoration: BoxDecoration(
                color: const Color(0xFF070B1A).withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.25),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.gold.withValues(alpha: 0.1),
                    blurRadius: 30,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(
                    width: 48,
                    height: 48,
                    child: CircularProgressIndicator(
                      strokeWidth: 4,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'AUTHENTICATING',
                    style: GoogleFonts.inter(
                      color: AppColors.gold,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Establishing secure session...',
                    style: GoogleFonts.inter(
                      color: Colors.white38,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  HIGH-FIDELITY DRAWN GOOGLE BRANDING WIDGETS
// ─────────────────────────────────────────────

class GoogleGLogo extends StatelessWidget {
  final double size;
  const GoogleGLogo({super.key, this.size = 22});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
      padding: EdgeInsets.all(size * 0.15),
      child: CustomPaint(
        size: Size(size * 0.7, size * 0.7),
        painter: const GoogleLogoPainter(),
      ),
    );
  }
}

class GoogleLogoPainter extends CustomPainter {
  const GoogleLogoPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double r = w / 2;
    final center = Offset(r, r);

    // Thickness of the logo relative to size
    final double thickness = w * 0.22;
    final Rect rect = Rect.fromCircle(
      center: center,
      radius: r - thickness / 2,
    );

    // Paints for four color segments
    final paintRed = Paint()
      ..color = const Color(0xFFEA4335)
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.butt;

    final paintYellow = Paint()
      ..color = const Color(0xFFFBBC05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.butt;

    final paintGreen = Paint()
      ..color = const Color(0xFF34A853)
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.butt;

    final paintBlue = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.butt;

    // Arcs matching Google's G segments
    // Red covers top segment
    canvas.drawArc(rect, 3.927, 1.57, false, paintRed);
    // Yellow covers left segment
    canvas.drawArc(rect, 2.356, 1.57, false, paintYellow);
    // Green covers bottom segment
    canvas.drawArc(rect, 0.785, 1.57, false, paintGreen);
    // Blue covers right segment
    canvas.drawArc(rect, -0.785, 1.57, false, paintBlue);

    // Draw the horizontal bar matching the blue color
    final barPaint = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;

    final Rect barRect = Rect.fromLTRB(
      r,
      r - thickness / 2,
      w,
      r + thickness / 2,
    );
    canvas.drawRect(barRect, barPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
