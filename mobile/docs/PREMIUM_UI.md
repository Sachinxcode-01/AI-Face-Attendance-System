Premium UI (feature/premium-ui)

Overview
- Adds a premium design system: tokens, theme, reusable components (PremiumAppBar, PremiumButton, GlassCard, PremiumScaffold), motion utilities and responsive helpers.

How to run
1. flutter pub get
2. flutter run

Notes
- Logos: assets/logos/logo.svg included. To export PNGs use scripts/svg_to_png.ps1 (requires ImageMagick or Inkscape).
- Fonts are loaded at runtime via google_fonts; no ttf files are embedded.

Next steps
- Visual QA on multiple devices, refine spacing/animation, export high-resolution PNGs for app store assets.
