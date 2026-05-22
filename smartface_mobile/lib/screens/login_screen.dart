import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../core/session_manager.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _auth = FirebaseAuth.instance;
  bool _isLoading = false;
  bool _otpSent = false;

  String selectedRole = 'Student';

  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      final GoogleSignInAccount? googleUser = await GoogleSignIn(
        serverClientId: '153684832501-4mikvqi78kam3j1tcmnab7gp1o3e7mnt.apps.googleusercontent.com',
      ).signIn();
      if (googleUser == null) {
        setState(() => _isLoading = false);
        return;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final UserCredential userCredential = await _auth.signInWithCredential(credential);
      
      if (userCredential.user != null) {
        final email = userCredential.user!.email ?? '';
        final name = userCredential.user!.displayName ?? 'User';
        
        final result = await ApiService.googleLogin(email, name, selectedRole);
        
        if (result.containsKey('access_token')) {
          if (!mounted) return;
          final session = context.read<SessionManager>();
          await session.saveSession(
            token: result['access_token'],
            email: email,
            role: result['role'],
          );
          if (!mounted) return;
          final bool biometricRegistered = result['biometric_registered'] ?? false;
          final String targetRoute = biometricRegistered ? '/dashboard' : '/setup';
          Navigator.pushReplacementNamed(
            context, 
            targetRoute,
            arguments: {
              'role': result['role'], 
              'token': result['access_token'], 
              'email': email
            },
          );
        } else {
          throw Exception(result['detail'] ?? 'Google Login failed on server');
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Google Sign-In failed: $e')),
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
      final result = await ApiService.sendLoginOtp(_emailController.text.trim());
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
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
        _otpController.text.trim()
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
        final bool biometricRegistered = result['biometric_registered'] ?? false;
        final String targetRoute = biometricRegistered ? '/dashboard' : '/setup';
        Navigator.pushReplacementNamed(
          context, 
          targetRoute,
          arguments: {
            'role': result['role'], 
            'token': result['access_token'], 
            'email': _emailController.text.trim()
          },
        );
      } else {
        throw Exception(result['detail'] ?? 'Verification failed');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Invalid OTP: $e')),
      );
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
                padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // --- LUXURY BRAND LOGO ZONE ---
                    _buildAnimatedLogoHUD(),
                    
                    const SizedBox(height: 24),
                    
                    Text(
                      'SmartAttendance-AI',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 34,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                        color: const Color(0xFFFFD700),
                        shadows: [
                          const Shadow(color: Colors.black45, offset: Offset(0, 4), blurRadius: 10),
                        ],
                      ),
                    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.15, end: 0, duration: 400.ms),
                    
                    const SizedBox(height: 4),

                    Text(
                      'PREMIUM BIOMETRIC INTELLIGENCE',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        color: Colors.white38,
                        letterSpacing: 3,
                        fontWeight: FontWeight.w600,
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
                        .scaleXY(begin: 0.95, end: 1.0, curve: Curves.easeOutBack, duration: 500.ms),
                    
                    const SizedBox(height: 25),
                    
                    // --- FOOTER SIGN-UP TRIGGER ---
                    _buildFooterNavigator()
                        .animate()
                        .fadeIn(delay: 600.ms, duration: 400.ms),
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
          child: Container(
            width: 280,
            height: 280,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFFFD700).withValues(alpha: 0.12),
            ),
          ).animate(onPlay: (c) => c.repeat(reverse: true))
           .scale(begin: const Offset(0.9, 0.9), end: const Offset(1.25, 1.25), duration: 5.seconds, curve: Curves.easeInOut)
           .move(begin: const Offset(0, 0), end: const Offset(20, 30), duration: 5.seconds, curve: Curves.easeInOut),
        ),

        // Floating Ambient Mesh Light 2 (Indigo Pulse)
        Positioned(
          bottom: -100,
          right: -80,
          child: Container(
            width: 380,
            height: 380,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF1D2671).withValues(alpha: 0.28),
            ),
          ).animate(onPlay: (c) => c.repeat(reverse: true))
           .scale(begin: const Offset(1.15, 1.15), end: const Offset(0.85, 0.85), duration: 7.seconds, curve: Curves.easeInOut)
           .move(begin: const Offset(0, 0), end: const Offset(-30, -40), duration: 7.seconds, curve: Curves.easeInOut),
        ),

        // Floating Ambient Mesh Light 3 (Cyber Cyan)
        Positioned(
          top: 250,
          right: -90,
          child: Container(
            width: 220,
            height: 220,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF00F2FE).withValues(alpha: 0.08),
            ),
          ).animate(onPlay: (c) => c.repeat(reverse: true))
           .scale(begin: const Offset(0.8, 0.8), end: const Offset(1.2, 1.2), duration: 6.seconds, curve: Curves.easeInOut)
           .move(begin: const Offset(0, 0), end: const Offset(-20, 20), duration: 6.seconds, curve: Curves.easeInOut),
        ),

        // Matte Glassmorphic Blur Shield
        BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
          child: Container(
            color: Colors.transparent,
          ),
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
        ).animate(onPlay: (c) => c.repeat(reverse: true))
         .shimmer(duration: 5.seconds, color: const Color(0xFFFFD700).withValues(alpha: 0.2)),
      ],
    );
  }

  // 2. Beautiful holographic 3D Logo HUD
  Widget _buildAnimatedLogoHUD() {
    return Center(
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Cyber golden radar wave
          Container(
            height: 155,
            width: 155,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xFFFFD700).withValues(alpha: 0.15), 
                width: 1.5
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFFD700).withValues(alpha: 0.06),
                  blurRadius: 35,
                  spreadRadius: 8,
                )
              ],
            ),
          ).animate(onPlay: (c) => c.repeat())
           .shimmer(duration: 2000.ms, color: const Color(0xFFFFD700).withValues(alpha: 0.25))
           .scale(begin: const Offset(0.92, 0.92), end: const Offset(1.08, 1.08), curve: Curves.easeInOut, duration: 1200.ms),
          
          // Rotating tracking points
          Container(
            height: 135,
            width: 135,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xFFFFD700).withValues(alpha: 0.35),
                width: 1,
                strokeAlign: BorderSide.strokeAlignOutside
              ),
            ),
          ).animate(onPlay: (c) => c.repeat())
           .rotate(duration: 8.seconds),

          // Central luxury Logo Shield
          Hero(
            tag: 'logo',
            child: Container(
              height: 110,
              width: 110,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF030510),
                border: Border.all(
                  color: const Color(0xFFFFD700).withValues(alpha: 0.6),
                  width: 2.0,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black54,
                    blurRadius: 12,
                    offset: const Offset(0, 8),
                  )
                ],
                image: const DecorationImage(
                  image: AssetImage('assets/images/logo.png'),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ).animate(onPlay: (c) => c.repeat(reverse: true))
           .moveY(begin: -4, end: 4, duration: 1200.ms, curve: Curves.easeInOut)
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

  // 3. Sliding Premium Roles selection
  Widget _buildPremiumRoleSelector() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
      ),
      child: Row(
        children: ['Student', 'Teacher', 'Admin'].map((role) {
          bool isSelected = selectedRole == role;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() => selectedRole = role);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                padding: const EdgeInsets.symmetric(vertical: 13),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? const LinearGradient(
                          colors: [Color(0xFFFFD700), Color(0xFFFFA500)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : null,
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: const Color(0xFFFFD700).withValues(alpha: 0.25),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ]
                      : null,
                ),
                child: Text(
                  role,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    color: isSelected ? Colors.black : Colors.white60,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    fontSize: 14,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // 4. Glassmorphic Form Access Panel
  Widget _buildGlassmorphicFormCard() {
    return Container(
      padding: const EdgeInsets.all(26),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 30,
            offset: const Offset(0, 15),
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(32),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Column(
            children: [
              if (!_otpSent) ...[
                _buildTextField(
                  controller: _emailController,
                  hint: 'Institutional Email',
                  icon: Icons.alternate_email_rounded,
                ),
                const SizedBox(height: 22),
                _buildButton(
                  text: 'REQUEST SECURE OTP',
                  onPressed: _sendOtp,
                ),
              ] else ...[
                Text(
                  'Verification Code Sent to',
                  style: GoogleFonts.outfit(color: Colors.white38, fontSize: 12),
                ),
                const SizedBox(height: 3),
                Text(
                  _emailController.text,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ).animate().fadeIn(),
                const SizedBox(height: 22),
                _buildTextField(
                  controller: _otpController,
                  hint: 'Enter 6-Digit OTP',
                  icon: Icons.security_rounded,
                  isOtp: true,
                ),
                const SizedBox(height: 22),
                _buildButton(
                  text: 'AUTHENTICATE & ENTER',
                  onPressed: _verifyOtp,
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => setState(() => _otpSent = false),
                  child: Text(
                    'Use different email address',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFFFFD700).withValues(alpha: 0.6), 
                      fontSize: 12,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
              
              const SizedBox(height: 20),
              
              const Row(
                children: [
                  Expanded(child: Divider(color: Colors.white10, height: 1)),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 14),
                    child: Text(
                      'OR AUTHORIZE SECURELY', 
                      style: TextStyle(color: Colors.white24, fontSize: 9, letterSpacing: 1.5, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Expanded(child: Divider(color: Colors.white10, height: 1)),
                ],
              ),
              
              const SizedBox(height: 20),
              
              // Google secondary login
              SizedBox(
                width: double.infinity,
                height: 58,
                child: OutlinedButton.icon(
                  onPressed: _signInWithGoogle,
                  icon: const FaIcon(FontAwesomeIcons.google, size: 16),
                  label: Text(
                    'Continue with Google',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14, letterSpacing: 0.5),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white70,
                    side: const BorderSide(color: Colors.white10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 5. Digital input with responsive glowing transitions
  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isOtp = false,
  }) {
    return Focus(
      child: Builder(
        builder: (context) {
          final isFocused = Focus.of(context).hasFocus;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isFocused ? const Color(0xFFFFD700) : Colors.white.withValues(alpha: 0.08),
                width: isFocused ? 1.5 : 1.0,
              ),
              boxShadow: isFocused
                  ? [
                      BoxShadow(
                        color: const Color(0xFFFFD700).withValues(alpha: 0.08),
                        blurRadius: 10,
                        spreadRadius: 1,
                      )
                    ]
                  : [],
            ),
            child: TextField(
              controller: controller,
              keyboardType: isOtp ? TextInputType.number : TextInputType.emailAddress,
              style: GoogleFonts.outfit(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500),
              textAlign: isOtp ? TextAlign.center : TextAlign.start,
              decoration: InputDecoration(
                prefixIcon: isOtp 
                    ? null 
                    : Icon(icon, color: isFocused ? const Color(0xFFFFD700) : Colors.white38, size: 20),
                hintText: hint,
                hintStyle: GoogleFonts.outfit(color: Colors.white24, fontSize: 14),
                filled: true,
                fillColor: Colors.black.withValues(alpha: 0.15),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
              ),
            ),
          );
        }
      ),
    );
  }

  // 6. Premium tactile golden key action button
  Widget _buildButton({required String text, required VoidCallback onPressed}) {
    return Container(
      width: double.infinity,
      height: 58,
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFD700).withValues(alpha: 0.2),
            blurRadius: 15,
            spreadRadius: 1,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFFFD700),
          foregroundColor: Colors.black,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
        child: Text(
          text,
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, letterSpacing: 1.5, fontSize: 13),
        ),
      ),
    );
  }

  // 7. Footer navigation
  Widget _buildFooterNavigator() {
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text(
          'New to SmartAttendance?', 
          style: GoogleFonts.outfit(color: Colors.white30, fontSize: 14),
        ),
        TextButton(
          onPressed: () => Navigator.pushNamed(context, '/register'),
          child: Text(
            'JOIN NOW', 
            style: GoogleFonts.outfit(color: const Color(0xFFFFD700), fontWeight: FontWeight.bold, fontSize: 14)
          ),
        ),
      ],
    );
  }

  // 8. Cybernetic Scanner loading overlay
  Widget _buildBiometricScannerLoading() {
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 300),
      opacity: _isLoading ? 1.0 : 0.0,
      child: Container(
        width: double.infinity,
        height: double.infinity,
        color: Colors.black.withValues(alpha: 0.88),
        child: Stack(
          children: [
            // Ambient grid scan backdrop
            Opacity(
              opacity: 0.12,
              child: Container(
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage('assets/images/ai_face_grid.png'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
            
            // Neon vertical laser sweeping scanning sweep bar
            Positioned(
              left: 0,
              right: 0,
              child: Container(
                height: 4,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFFFFD700).withValues(alpha: 0.0),
                      const Color(0xFFFFD700),
                      const Color(0xFFFFD700).withValues(alpha: 0.0),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFFD700).withValues(alpha: 0.7),
                      blurRadius: 18,
                      spreadRadius: 2.5,
                    )
                  ],
                ),
              ),
            ).animate(onPlay: (c) => c.repeat(reverse: true))
             .moveY(begin: 0, end: MediaQuery.of(context).size.height, duration: 2400.ms, curve: Curves.easeInOut),

            // Target central HUD scanner rings
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      // Golden tech scanning ring outer (rotating clockwise)
                      Container(
                        width: 190,
                        height: 190,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFFFD700).withValues(alpha: 0.4),
                            width: 1.5,
                          ),
                        ),
                      ).animate(onPlay: (c) => c.repeat())
                       .rotate(duration: 4.seconds),

                      // Holographic segmented scanner ring (rotating counter-clockwise)
                      Container(
                        width: 165,
                        height: 165,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFFFFD700).withValues(alpha: 0.2),
                            width: 6,
                            strokeAlign: BorderSide.strokeAlignOutside,
                          ),
                        ),
                      ).animate(onPlay: (c) => c.repeat())
                       .rotate(duration: 5.seconds, begin: 1, end: 0),

                      // Ambient scanner pulse ring
                      Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFFFD700).withValues(alpha: 0.04),
                        ),
                      ).animate(onPlay: (c) => c.repeat())
                       .scale(begin: const Offset(0.8, 0.8), end: const Offset(1.25, 1.25), curve: Curves.easeOut, duration: 1500.ms)
                       .fadeOut(duration: 1500.ms),

                      // Biometric core scanning icon
                      const Icon(
                        Icons.fingerprint_rounded,
                        color: Color(0xFFFFD700),
                        size: 60,
                      ).animate(onPlay: (c) => c.repeat(reverse: true))
                       .scale(begin: const Offset(0.92, 0.92), end: const Offset(1.08, 1.08), duration: 1000.ms)
                       .shimmer(duration: 2000.ms),
                    ],
                  ),
                  
                  const SizedBox(height: 45),
                  
                  // Interactive scanner diagnostic logs
                  _buildScanningTextLogs(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Scanning logger showing system logs
  Widget _buildScanningTextLogs() {
    return Column(
      children: [
        Text(
          'AUTHENTICATING SECURE PROTOCOL',
          style: GoogleFonts.outfit(
            color: const Color(0xFFFFD700),
            fontSize: 16,
            fontWeight: FontWeight.bold,
            letterSpacing: 2,
          ),
        ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 1600.ms),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
          ),
          child: StreamBuilder<String>(
            stream: _scanningLogStream(),
            builder: (context, snapshot) {
              return Text(
                snapshot.data ?? '[SYS] ESTABLISHING QUANTUM LINK...',
                style: GoogleFonts.robotoMono(
                  color: Colors.white54,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Stream<String> _scanningLogStream() async* {
    final logs = [
      '[SYS] ESTABLISHING SECURE GATEWAY...',
      '[SEC] INITIATING JWT AUTHENTICATOR...',
      '[BIO] DECRYPTING BIOMETRIC EMBEDDINGS...',
      '[KEY] HANDSHAKE VERIFICATION SYNC...',
      '[SYS] ACCESS TOKEN COMPILATION OK.',
    ];
    int index = 0;
    while (true) {
      yield logs[index % logs.length];
      await Future.delayed(const Duration(milliseconds: 1000));
      index++;
    }
  }
}
