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
    final double headerHeight = isCompact ? 115.0 + statusBarHeight : MediaQuery.of(context).size.height;

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
// REUSABLE FORM CARD COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

class AuthFormCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? topIcon;
  final List<Widget> children;

  const AuthFormCard({
    super.key,
    required this.title,
    this.subtitle,
    this.topIcon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: AuthDesign.cardBg,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(28),
          topRight: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x14323C96), // rgba(50, 60, 150, 0.08)
            blurRadius: 30,
            offset: Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
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
          ...children,
        ],
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
// REUSABLE SOCIAL OUTLINE ICONS ROW
// ═════════════════════════════════════════════════════════════════════════════

class SocialIconRow extends StatelessWidget {
  final String actionPrefix; // "Sign in" or "Sign up"

  const SocialIconRow({
    super.key,
    required this.actionPrefix,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
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
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildSocialIcon(Icons.facebook),
            const SizedBox(width: 24),
            _buildCustomXIcon(),
            const SizedBox(width: 24),
            _buildCustomGoogleIcon(),
            const SizedBox(width: 24),
            _buildSocialIcon(Icons.apple),
          ],
        ),
      ],
    );
  }

  Widget _buildSocialIcon(IconData icon) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: AuthDesign.primaryIndigo,
          width: 1.5,
        ),
      ),
      child: Center(
        child: Icon(
          icon,
          color: AuthDesign.primaryIndigo,
          size: 18,
        ),
      ),
    );
  }

  Widget _buildCustomXIcon() {
    // Custom X outline icon
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: AuthDesign.primaryIndigo,
          width: 1.5,
        ),
      ),
      child: const Center(
        child: Text(
          '𝕏',
          style: TextStyle(
            color: AuthDesign.primaryIndigo,
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildCustomGoogleIcon() {
    // A clean Google logo shape
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: AuthDesign.primaryIndigo,
          width: 1.5,
        ),
      ),
      child: Center(
        child: Text(
          'G',
          style: AuthDesign.fontPoppins(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AuthDesign.primaryIndigo,
          ),
        ),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPACT SCREEN STRUCTURAL LAYOUT WRAPPER
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
    return Theme(
      data: AuthDesign.themeData,
      child: Scaffold(
        body: Container(
          color: AuthDesign.pageBg,
          height: double.infinity,
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: Column(
              children: [
                HeroOrbBackground(
                  isCompact: true,
                  onBackTap: onBackTap,
                ),
                Transform.translate(
                  offset: const Offset(0, -28),
                  child: AuthFormCard(
                    title: title,
                    subtitle: subtitle,
                    topIcon: topIcon,
                    children: [
                      child,
                      if (bottomLink != null) ...[
                        const SizedBox(height: 24),
                        Center(child: bottomLink!),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
