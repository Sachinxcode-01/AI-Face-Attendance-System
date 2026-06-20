import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';

class PremiumAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final double? leadingWidth;
  final Widget? titleWidget;
  final bool centerTitle;
  final double elevation;
  final Color? backgroundColor;
  const PremiumAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.leadingWidth,
    this.titleWidget,
    this.centerTitle = false,
    this.elevation = 0.0,
    this.backgroundColor,
  });

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: backgroundColor ?? Colors.transparent,
      elevation: elevation,
      centerTitle: centerTitle,
      leading: leading,
      leadingWidth: leadingWidth,
      title: titleWidget ?? Row(
        children: [
          SvgPicture.asset('assets/logos/logo.svg', width: 44, height: 44),
          const SizedBox(width: 12),
          Text(
            title,
            style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: Theme.of(context).textTheme.titleLarge?.color),
          ),
        ],
      ),
      actions: actions,
    );
  }
}
