import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ═════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM CONSTANTS & TOKENS
// ═════════════════════════════════════════════════════════════════════════════

class AuthDesign {
  // Colors
  static const Color primaryIndigo = Color(0xFF3D4AB8);
  static const Color orbLight = Color(0xFF9AA4EC);
  static const Color orbMid = Color(0xFF6670D0);
  static const Color orbDark = Color(0xFF4D58C0);
  static const Color cardBg = Color(0xFFFFFFFF);
  static const Color pageBg = Color(0xFFE8EAF6);
  static const Color textHeading = Color(0xFF1A1A3A);
  static const Color textLabel = Color(0xFFA0A0B8);
  static const Color textPlaceholder = Color(0xFFC8C8D8);
  static const Color underlineUnfocused = Color(0xFFE6E6F0);
  static const Color underlineFocused = Color(0xFF3D4AB8);
  static const Color textLink = Color(0xFF3D4AB8);

  // Hero height — fixed portion for the indigo hero band
  static const double heroHeight = 115.0;

  // Typography Helper Functions
  static TextStyle fontPoppins({
    required double fontSize,
    required FontWeight fontWeight,
    Color? color,
    double? opacity,
  }) {
    Color finalColor = color ?? textHeading;
    if (opacity != null) {
      finalColor = finalColor.withValues(alpha: opacity);
    }
    return GoogleFonts.poppins(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: finalColor,
    );
  }

  // Get Auth ThemeData
  static ThemeData get themeData {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: pageBg,
      primaryColor: primaryIndigo,
      textTheme: TextTheme(
        headlineLarge: fontPoppins(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white),
        titleLarge: fontPoppins(fontSize: 21, fontWeight: FontWeight.w700, color: textHeading),
        bodyLarge: fontPoppins(fontSize: 12, fontWeight: FontWeight.w400, color: textHeading),
        bodyMedium: fontPoppins(fontSize: 10.5, fontWeight: FontWeight.w500, color: textLabel),
        labelLarge: fontPoppins(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// REUSABLE HERO BACKGROUND COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

class HeroOrbBackground extends StatelessWidget {
  final bool isCompact;
  final VoidCallback? onBackTap;
  final Widget? child;

  const HeroOrbBackground({
    super.key,
    required this.isCompact,
    this.onBackTap,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    final double statusBarHeight = MediaQuery.of(context).padding.top;
    final double headerHeight = isCompact
        ? AuthDesign.heroHeight + statusBarHeight
        : MediaQuery.of(context).size.height;

    return Container(
      width: double.infinity,
      height: headerHeight,
      color: AuthDesign.primaryIndigo,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Radial Gradient Orbs
          if (isCompact) ...[
            // Orb 1 (Top-Right)
            Positioned(
              right: -40,
              top: -30 + statusBarHeight,
              child: _buildOrb(160),
            ),
            // Orb 2 (Overlapping Mid)
            Positioned(
              right: -10,
              top: 30 + statusBarHeight,
              child: _buildOrb(110),
            ),
            // Orb 3 (Left Small)
            Positioned(
              left: 40,
              top: 10 + statusBarHeight,
              child: _buildOrb(60),
            ),
            // Orb 4 (Lower Scattered)
            Positioned(
              left: 180,
              top: 60 + statusBarHeight,
              child: _buildOrb(45),
            ),
          ] else ...[
            // Orb 1 (Top-Right Big)
            Positioned(
              right: -60,
              top: -40,
              child: _buildOrb(280),
            ),
            // Orb 2 (Mid Overlapping)
            Positioned(
              right: -20,
              top: 140,
              child: _buildOrb(190),
            ),
            // Orb 3 (Left Mid)
            Positioned(
              left: -30,
              top: 280,
              child: _buildOrb(140),
            ),
            // Orb 4 (Lower Right Scattered)
            Positioned(
              right: 40,
              bottom: 180,
              child: _buildOrb(90),
            ),
            // Orb 5 (Lower Left Scattered)
            Positioned(
              left: 50,
              bottom: 260,
              child: _buildOrb(55),
            ),
          ],

          // Back Button for Compact Hero
          if (isCompact && onBackTap != null)
            Positioned(
              left: 16,
              top: statusBarHeight + 12,
              child: InkWell(
                onTap: onBackTap,
                borderRadius: BorderRadius.circular(4),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.arrow_back_ios_new,
                        color: Colors.white,
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Back',
                        style: AuthDesign.fontPoppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Content child
          ?child,
        ],
      ),
    );
  }

  Widget _buildOrb(double size) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 0.5,
          colors: [
            AuthDesign.orbLight,
            AuthDesign.orbDark,
          ],
        ),
      ),
    );
  }
}



// ═════════════════════════════════════════════════════════════════════════════
// REUSABLE UNDERLINED INPUT FIELD
// ═════════════════════════════════════════════════════════════════════════════

class UnderlineTextField extends StatefulWidget {
  final String label;
  final String? placeholder;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? Function(String?)? validator;
  final Widget? suffixIcon;
  final ValueChanged<String>? onChanged;

  const UnderlineTextField({
    super.key,
    required this.label,
    this.placeholder,
    this.controller,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.validator,
    this.suffixIcon,
    this.onChanged,
  });

  @override
  State<UnderlineTextField> createState() => _UnderlineTextFieldState();
}

class _UnderlineTextFieldState extends State<UnderlineTextField> {
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: AuthDesign.fontPoppins(
            fontSize: 10.5,
            fontWeight: FontWeight.w500,
            color: AuthDesign.textLabel,
          ),
        ),
        TextFormField(
          focusNode: _focusNode,
          controller: widget.controller,
          obscureText: widget.obscureText,
          keyboardType: widget.keyboardType,
          validator: widget.validator,
          onChanged: widget.onChanged,
          style: AuthDesign.fontPoppins(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AuthDesign.textHeading,
          ),
          decoration: InputDecoration(
            hintText: widget.placeholder,
            hintStyle: AuthDesign.fontPoppins(
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: AuthDesign.textPlaceholder,
            ),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(vertical: 8),
            border: const UnderlineInputBorder(
              borderSide: BorderSide(
                color: AuthDesign.underlineUnfocused,
                width: 1.5,
              ),
            ),
            enabledBorder: const UnderlineInputBorder(
              borderSide: BorderSide(
                color: AuthDesign.underlineUnfocused,
                width: 1.5,
              ),
            ),
            focusedBorder: const UnderlineInputBorder(
              borderSide: BorderSide(
                color: AuthDesign.underlineFocused,
                width: 1.5,
              ),
            ),
            errorStyle: const TextStyle(fontSize: 10, height: 0.8),
            suffixIcon: widget.suffixIcon,
            suffixIconConstraints: const BoxConstraints(
              minWidth: 24,
              minHeight: 24,
            ),
          ),
        ),
      ],
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// REUSABLE PRIMARY BUTTON
// ═════════════════════════════════════════════════════════════════════════════

class PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;

  const PrimaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AuthDesign.primaryIndigo,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(13),
          ),
          padding: EdgeInsets.zero,
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Text(
                text,
                style: AuthDesign.fontPoppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GOOGLE "G" MULTICOLOR LOGO — Custom Painter
// ═════════════════════════════════════════════════════════════════════════════

class _GoogleGPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double cx = size.width / 2;
    final double cy = size.height / 2;
    final double r = size.width / 2;

    // Clip to circle
    canvas.save();
    canvas.clipRRect(
      RRect.fromRectAndRadius(
        Rect.fromCircle(center: Offset(cx, cy), radius: r),
        Radius.circular(r),
      ),
    );

    // -- Draw the 4-color Google "G" using arcs and rectangles --
    // We use a simplified but accurate representation:
    // Outer arc (right half): blue top-right, red bottom-right
    // Inner cutout for the G-shape
    // Horizontal bar: blue

    final double strokeW = size.width * 0.22;
    final Rect arcRect = Rect.fromCenter(
      center: Offset(cx, cy),
      width: size.width * 0.82,
      height: size.height * 0.82,
    );

    // Red arc — bottom (180° to 270°)
    canvas.drawArc(
      arcRect,
      math.pi / 2,  // start at bottom
      math.pi / 2,  // 90°
      false,
      Paint()
        ..color = const Color(0xFFEA4335)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeW
        ..strokeCap = StrokeCap.butt,
    );
    // Yellow arc — bottom-left (270° to 360°)
    canvas.drawArc(
      arcRect,
      math.pi,
      math.pi / 2,
      false,
      Paint()
        ..color = const Color(0xFFFBBC05)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeW
        ..strokeCap = StrokeCap.butt,
    );
    // Green arc — top-left (0° to 90° going counter-clockwise, i.e. 270° to 360°)
    canvas.drawArc(
      arcRect,
      3 * math.pi / 2,
      math.pi / 2,
      false,
      Paint()
        ..color = const Color(0xFF34A853)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeW
        ..strokeCap = StrokeCap.butt,
    );
    // Blue arc — top-right (0° to 90°) and horizontal bar
    canvas.drawArc(
      arcRect,
      -math.pi / 4,          // start ~-45° (top-right)
      math.pi * 3 / 4,       // sweep to bottom-right
      false,
      Paint()
        ..color = const Color(0xFF4285F4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeW
        ..strokeCap = StrokeCap.butt,
    );

    // Horizontal bar (blue) — the middle crossbar of the G
    final double barY = cy;
    final double barLeft = cx - size.width * 0.02; // starts near center
    final double barRight = cx + size.width * 0.38; // extends right
    canvas.drawLine(
      Offset(barLeft, barY),
      Offset(barRight, barY),
      Paint()
        ..color = const Color(0xFF4285F4)
        ..strokeWidth = strokeW
        ..strokeCap = StrokeCap.butt,
    );

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ═════════════════════════════════════════════════════════════════════════════
// REUSABLE SOCIAL OUTLINE ICONS ROW
// ═════════════════════════════════════════════════════════════════════════════

class SocialIconRow extends StatelessWidget {
  final String actionPrefix; // "Sign in" or "Sign up"
  final VoidCallback? onGoogleTap;

  const SocialIconRow({
    super.key,
    required this.actionPrefix,
    this.onGoogleTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Divider row
        Row(
          children: [
            const Expanded(
              child: Divider(
                color: AuthDesign.underlineUnfocused,
                thickness: 1,
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12.0),
              child: Text(
                '$actionPrefix with',
                style: AuthDesign.fontPoppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AuthDesign.textLabel,
                ),
              ),
            ),
            const Expanded(
              child: Divider(
                color: AuthDesign.underlineUnfocused,
                thickness: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Social icons — only Google is kept as others are not implemented
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            GestureDetector(
              onTap: onGoogleTap,
              child: _buildGoogleIcon(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildIconShell({required Widget icon}) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(
          color: const Color(0xFFE0E0E0),
          width: 1,
        ),
      ),
      child: Center(child: icon),
    );
  }

  // Google — multicolor custom "G"
  Widget _buildGoogleIcon() {
    return _buildIconShell(
      icon: SizedBox(
        width: 22,
        height: 22,
        child: CustomPaint(painter: _GoogleGPainter()),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPACT SCREEN STRUCTURAL LAYOUT WRAPPER
//
// Layout strategy:
//   • The Scaffold body is wrapped in a full-screen Stack.
//   • Layer 0: pageBg color fills the entire screen.
//   • Layer 1: HeroOrbBackground sits at the top with a fixed height
//              (statusBarHeight + AuthDesign.heroHeight).
//   • Layer 2: The white AuthFormCard is positioned below the hero using
//              Positioned.fill with a top offset equal to the hero height
//              minus the 28-px overlap, so it always touches the bottom edge.
//   • The card's inner content is scrollable (SingleChildScrollView) so that
//              when the keyboard appears or content is tall, it remains usable.
// ═════════════════════════════════════════════════════════════════════════════

class AuthScreenLayout extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? topIcon;
  final VoidCallback? onBackTap;
  final Widget child;
  final Widget? bottomLink;

  const AuthScreenLayout({
    super.key,
    required this.title,
    this.subtitle,
    this.topIcon,
    this.onBackTap,
    required this.child,
    this.bottomLink,
  });

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final double statusBarH = mq.padding.top;
    final double bottomInset = mq.padding.bottom;

    // The hero band: status bar + fixed hero content area
    final double heroTotalH = statusBarH + AuthDesign.heroHeight;

    // The card overlaps the hero by 28px (the rounded corner visual trick)
    const double cardOverlap = 28.0;

    // Card top position
    final double cardTop = heroTotalH - cardOverlap;

    return Theme(
      data: AuthDesign.themeData,
      child: Scaffold(
        // resizeToAvoidBottomInset keeps the layout stable; we handle scroll
        // inside the card ourselves
        resizeToAvoidBottomInset: true,
        body: Container(
          color: AuthDesign.pageBg,
          width: double.infinity,
          height: double.infinity,
          child: Stack(
            children: [
              // ── Hero band ──────────────────────────────────────────────
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: HeroOrbBackground(
                  isCompact: true,
                  onBackTap: onBackTap,
                ),
              ),

              // ── White form card — fills from cardTop to bottom of screen ──
              Positioned(
                top: cardTop,
                left: 0,
                right: 0,
                bottom: 0,
                child: _AuthCardShell(
                  title: title,
                  subtitle: subtitle,
                  topIcon: topIcon,
                  bottomInset: bottomInset,
                  bottomLink: bottomLink,
                  child: child,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Internal shell that draws the rounded-top white card and manages scrollable
// form content + bottom link pinned to the bottom.
class _AuthCardShell extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? topIcon;
  final Widget child;
  final Widget? bottomLink;
  final double bottomInset; // safe area bottom

  const _AuthCardShell({
    required this.title,
    this.subtitle,
    this.topIcon,
    required this.child,
    this.bottomLink,
    required this.bottomInset,
  });

  @override
  Widget build(BuildContext context) {
    final double hPad = MediaQuery.of(context).size.width * 0.056;
    final double keyboardHeight = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: AuthDesign.cardBg,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(28),
          topRight: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x14323C96),
            blurRadius: 30,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.only(bottom: keyboardHeight),
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: hPad),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 22),
                  if (topIcon != null) ...[
                    Center(child: topIcon!),
                    const SizedBox(height: 12),
                  ],
                  Text(
                    title,
                    style: AuthDesign.fontPoppins(
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                      color: AuthDesign.textHeading,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      subtitle!,
                      style: AuthDesign.fontPoppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: AuthDesign.textLabel,
                      ),
                    ),
                  ],
                  const SizedBox(height: 22),
                  child,
                  if (bottomLink != null) ...[
                    const SizedBox(height: 24),
                    Center(child: bottomLink!),
                    const SizedBox(height: 24),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
