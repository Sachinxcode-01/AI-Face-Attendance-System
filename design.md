# 🎨 SmartFace UI/UX Design System Specification (`design.md`)

> **Single Source of Truth** for color palette, layout architecture, typography, components, and styling across **all SmartFace applications** (Mobile Flutter Client & Web Portals).
>
> Established from the pixel-perfect design standards of the **Forgot Password Screen** (`forgot_password_screen.dart`) and **Sign Up Page** (`register_screen.dart`).

---

## 1. 🌟 Design Philosophy & Brand Identity

The SmartFace visual language is built around **depth, clarity, and modern academic elegance**:

- **Primary Hero Aesthetic**: Rich Indigo/Royal Blue canvas (`#3D4AB8` / `#4F46E5`) with ethereal radial gradient orbs providing soft, high-tech illumination.
- **Card Overlap Geometry**: The content sheet gracefully sweeps upward to overlap the hero banner by **28px** with smooth **28px rounded top corners**, creating natural physical layering.
- **Calm Lavender Canvas**: Scaffolds sit atop a serene indigo-tinted page background (`#E8EAF6` in light mode, `#070A14` / `#0D1225` in dark mode) instead of harsh stark gray.
- **Dual-Font System**: **Poppins** for expressive display titles, headings, and buttons; **Inter** for ultra-crisp body text, labels, captions, and form inputs.
- **Tactile Micro-Interactions**: Micro-bounce press animations (0.94-0.96 scale), glowing box shadows, and graduated haptic pulses (`lightImpact`, `mediumImpact`, `heavyImpact`).

Every single screen across the mobile app and web portal **must** follow this exact design framework.

---

## 2. 🎨 Complete Color Palette Specification

### 2.1 Brand Core & Hero Colors

| Token Name | Hex Code | Flutter Value | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| `primaryIndigo` | `#3D4AB8` | `Color(0xFF3D4AB8)` | Hero banner base, focused underline, active checkbox, primary text link |
| `primary` | `#4F46E5` | `Color(0xFF4F46E5)` | Primary brand color, primary button gradient end, key icons |
| `primaryBright` | `#6366F1` | `Color(0xFF6366F1)` | Primary button gradient start, selected card border, active highlights |
| `primaryLight` | `#818CF8` | `Color(0xFF818CF8)` | Secondary accents, glow halo effect, active badge fills |
| `primaryDark` | `#3730A3` | `Color(0xFF3730A3)` | Pressed button state, deep shadows, hover borders |
| `primarySoft` | `#A5B4FC` | `Color(0xFFA5B4FC)` | Soft chips, subtle indicators, muted badge backgrounds |

### 2.2 Hero Orb Radial Gradients

The decorative glowing orbs inside the hero banner use a smooth two-stop radial gradient:

```dart
// Flutter Radial Gradient
RadialGradient(
  center: Alignment.center,
  radius: 0.5,
  colors: [
    Color(0xFF9AA4EC), // orbLight (Center / Glow source)
    Color(0xFF4D58C0), // orbDark  (Periphery / Fade)
  ],
)
```

| Orb Token | Hex Code | Flutter Value | Description |
| :--- | :--- | :--- | :--- |
| `orbLight` | `#9AA4EC` | `Color(0xFF9AA4EC)` | Orb gradient inner highlight (radiant light lavender) |
| `orbMid` | `#6670D0` | `Color(0xFF6670D0)` | Orb gradient midpoint transition |
| `orbDark` | `#4D58C0` | `Color(0xFF4D58C0)` | Orb gradient outer edge (merges into primary indigo) |

### 2.3 Surface, Page & Canvas Hierarchy

| Token Name | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `pageBg` | `#E8EAF6` (`Color(0xFFE8EAF6)`) | `#070A14` (`Color(0xFF070A14)`) | Whole screen canvas background behind the hero and card |
| `cardBg` | `#FFFFFF` (`Color(0xFFFFFFFF)`) | `#141D38` (`Color(0xFF141D38)`) | Primary white content card shell, modal bottom sheets |
| `surfaceLight` | `#F8FAFF` (`Color(0xFFF8FAFF)`) | `#131A33` (`Color(0xFF131A33)`) | Form input fill, secondary pill background |
| `selectedCardBg` | `#EEF2FF` (`Color(0xFFEEF2FF)`) | `#1A2340` (`Color(0xFF1A2340)`) | Active selected role card or tab background |
| `dialogBg` | `#FFFFFF` (`Color(0xFFFFFFFF)`) | `#1C2648` (`Color(0xFF1C2648)`) | Dialogs, alert popups, floating context menus |

### 2.4 Typography & Text Colors

| Token Name | Light Mode | Dark Mode | Target Elements |
| :--- | :--- | :--- | :--- |
| `textHeading` | `#1A1A3A` (`Color(0xFF1A1A3A)`) | `#F1F3F9` (`Color(0xFFF1F3F9)`) | Screen titles, card headings, modal titles |
| `textBody` | `#3D4260` (`Color(0xFF3D4260)`) | `#C8CCDF` (`Color(0xFFC8CCDF)`) | Descriptions, paragraphs, input entered text |
| `textLabel` | `#A0A0B8` (`Color(0xFFA0A0B8)`) | `#7C82A0` (`Color(0xFF7C82A0)`) | Form field labels, unselected role names, subtle subtitles |
| `textPlaceholder` | `#C8C8D8` (`Color(0xFFC8C8D8)`) | `#4B5170` (`Color(0xFF4B5170)`) | Input placeholder/hint text, search empty state |
| `textLink` | `#3D4AB8` (`Color(0xFF3D4AB8)`) | `#818CF8` (`Color(0xFF818CF8)`) | Interactive text links, "Sign in", "Terms", "Resend code" |

### 2.5 Borders, Dividers & Outlines

| Token Name | Light Mode | Dark Mode | Width | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `borderLight` / `borderDark` | `#E5E7F0` | `#252E4A` | `1.0px` | Unfocused text input border, card border |
| `underlineUnfocused` | `#E6E6F0` | `#1F2942` | `1.0px` | Social divider lines, inactive strength bar |
| `borderFocused` | `#4F46E5` | `#6366F1` | `1.5px` | Focused input border glow, active selection ring |
| `borderSelectedCard` | `#6366F1` | `#6366F1` | `2.0px` | Selected role card outline |
| `borderSocialButton` | `#E2E8F0` | `#252E4A` | `1.5px` | Google & GitHub social auth buttons |

### 2.6 Shadows & Elevation Tokens

```dart
// 1. Auth Card Top Elevation Shadow
BoxShadow(
  color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
  blurRadius: 30,
  offset: const Offset(0, -5),
)

// 2. Primary Button Glow Shadow
BoxShadow(
  color: const Color(0xFF4F46E5).withValues(alpha: 0.28),
  blurRadius: 18,
  offset: const Offset(0, 8),
)

// 3. Selected Role Card Ambient Glow
BoxShadow(
  color: const Color(0xFF6366F1).withValues(alpha: 0.08),
  blurRadius: 10,
  offset: const Offset(0, 4),
)

// 4. Social Auth Button Subtle Shadow
BoxShadow(
  color: Colors.black.withValues(alpha: 0.04),
  blurRadius: 6,
  offset: const Offset(0, 3),
)
```

---

## 3. 📐 Canonical Screen Layout Architecture (`AuthScreenLayout`)

All auth and presentation screens share the identical structural architecture established by the Forgot Password and Sign Up screens:

```
┌───────────────────────────────────────────────────────────────┐
│ Scaffold (Background: #E8EAF6)                                │
│                                                               │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 1. HERO BAND (Height: statusBarHeight + 115px)             │ │
│ │    - Base: #3D4AB8 (primaryIndigo)                        │ │
│ │    - Back Button: [ < Back ] (white, 14px Poppins w500)    │ │
│ │    - Ethereal Orb 1: Top-Right (160px diameter)           │ │
│ │    - Ethereal Orb 2: Mid-Right (110px diameter)           │ │
│ │    - Ethereal Orb 3: Left (60px diameter)                 │ │
│ │    - Ethereal Orb 4: Scattered (45px diameter)            │ │
│ └───────────────────────────────────────────────────────────┘ │
│         ▲                                                     │
│         │ 28px Visual Overlap                                 │
│ ┌───────┴───────────────────────────────────────────────────┐ │
│ │ 2. WHITE CONTENT CARD SHELL (_AuthCardShell)              │ │
│ │    - BorderRadius: Top-Left: 28px, Top-Right: 28px        │ │
│ │    - Background: #FFFFFF (Light) / #141D38 (Dark)         │ │
│ │    - Shadow: blur 30px, y: -5px (#8B98CE @ 15%)           │ │
│ │    - Padding: horizontal 5.6% of screen width (~22px)      │ │
│ │                                                           │ │
│ │    [Optional: 48x48 Compound Icon Stack]                  │ │
│ │    [Title: Poppins 22px Bold (#1A1A3A)]                   │ │
│ │    [Subtitle: Inter 14px Regular (#A0A0B8)]               │ │
│ │                                                           │ │
│ │    ── Scrollable Content Area (ClampingScrollPhysics) ──  │ │
│ │    [Form Field 1: Label + #F8FAFF Input Box]              │ │
│ │    [Form Field 2: Label + #F8FAFF Input Box]              │ │
│ │    [Interactive Widgets (Role Cards / Strength / Check)]  │ │
│ │    [Primary Button: 52px Gradient #6366F1 -> #4F46E5]     │ │
│ │    [Social Auth Row: Google & GitHub]                     │ │
│ │    [Bottom Footer Navigation Link]                        │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Exact Dimension Metrics

- **Hero Height**: `115.0px` + device top status bar padding (`MediaQuery.of(context).padding.top`).
- **Card Overlap Offset**: `28.0px` negative offset against the hero band (`top = heroHeight - 28.0`).
- **Card Corner Radius**: `28.0px` on `topLeft` and `topRight`.
- **Horizontal Screen Padding**: `5.6%` of device width (responsive: ~20px on mobile, ~24px on large devices).
- **Keyboard Adaptation**: Card bottom padding automatically accounts for `MediaQuery.of(context).viewInsets.bottom`.

---

## 4. 🔤 Typography Standards

We strictly adhere to a **two-font pairing**:

- **Display & Headings**: `GoogleFonts.poppins`
- **Body, Labels & Forms**: `GoogleFonts.inter`

| Style Level | Font Family | Size | Weight | Color (Light) | Color (Dark) | Tracking / Height | Usage |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| **Display Title** | Poppins | `28-32px` | `w800` | `#1A1A3A` | `#F1F3F9` | `-0.5px` | Onboarding splash headings |
| **Screen Heading** | Poppins | `21-24px` | `w700` | `#1A1A3A` | `#F1F3F9` | `-0.2px` | Screen title inside card ("Get started", "Reset your password") |
| **Subheading** | Poppins | `15-17px` | `w600` | `#3D4260` | `#C8CCDF` | normal | Section titles, modal headers |
| **Body Primary** | Inter | `13-14.5px` | `w400` | `#3D4260` | `#C8CCDF` | `1.45` | Form input values, screen subtitles, general descriptions |
| **Body Semibold** | Inter | `13-14.5px` | `w600` | `#1A1A3A` | `#F1F3F9` | `1.40` | Role names, button secondary labels, list titles |
| **Field Label** | Inter | `10.0-10.5px` | `w600` | `#A0A0B8` | `#7C82A0` | `1.2px` | Input field header labels (e.g., "Full name", "Email", "Select role") |
| **Caption / Hint** | Inter | `11.5px` | `w400` | `#C8C8D8` | `#4B5170` | `0.2px` | Placeholder text inside inputs, error/helper hints |
| **Button Text** | Poppins | `15.0px` | `w600` | `#FFFFFF` | `#FFFFFF` | `0.8px` | Primary action button text |
| **Footer Link** | Poppins | `11.0px` | `w700` | `#3D4AB8` | `#818CF8` | normal | "Sign in", "Sign up", "Back to sign in" |

---

## 5. 🧩 Component Specifications & Rules

### 5.1 Form Input Fields (`UnderlineTextField` / `PremiumTextField`)

Inputs are modern, enclosed rounded capsules with subtle border and fill:

- **Label**:
  - Font: `Inter`, `10.5px`, `w600`, letterSpacing: `1.2`.
  - Color when focused: `#4F46E5` (`AppColors.primary`).
  - Color when unfocused: `#A0A0B8` (`textLabel`) in light mode; `#7C82A0` in dark mode.
  - Spacing below label: `6px`.
- **Text Box**:
  - Container height: `50px` (or `contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14)`).
  - Background fill: `filled: true`, color `#F8FAFF` (`surfaceLight`) in light mode; `#131A33` (`surfaceDark`) in dark mode.
  - Border radius: `12px` rounded rectangle.
  - Enabled / Unfocused Border: `1.0px` solid `#E5E7F0` (`borderLight`) / `#252E4A` (`borderDark`).
  - Focused Border: `1.5px` solid `#4F46E5` (`AppColors.primary`).
  - Font: `Inter`, `14px`, `#1A1A3A` (Light) / `#F1F3F9` (Dark).
  - Prefix / Suffix Icons:
    - Min width: `44px`, icon size: `18-20px`.
    - Focused icon color: `#4F46E5`.
    - Unfocused icon color: `#C8C8D8` / `#A0A0B8`.
- **Spacing between fields**: `14px - 16px`.

```dart
UnderlineTextField(
  label: 'Email',
  placeholder: 'Enter your email',
  controller: _emailController,
  keyboardType: TextInputType.emailAddress,
)
```

---

### 5.2 Primary Action Button (`PrimaryButton`)

Used for all primary calls-to-action ("Sign up", "Sign in", "Send verification code", "Reset password"):

- **Height**: `52px`, **Width**: `double.infinity`.
- **Border Radius**: `12px`.
- **Background Gradient**:
  - Enabled: `LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)], begin: Alignment.centerLeft, end: Alignment.centerRight)`
  - Disabled: `LinearGradient(colors: [Colors.grey.shade400, Colors.grey.shade300])`
- **Glow Shadow**:
  - Color: `#4F46E5` with `28%` alpha (`Color(0x474F46E5)`).
  - Blur radius: `18px`, offset: `(0, 8)`.
- **Interaction**:
  - Tactile scale down on tap (`PressableScale` to `0.97`).
  - Medium haptic feedback: `HapticFeedback.mediumImpact()`.
- **Loading State**:
  - White `CircularProgressIndicator(strokeWidth: 2.4, size: 22x22)`.
- **Typography**:
  - `Poppins`, `15px`, `w600`, letterSpacing: `0.8`, color `#FFFFFF`.

```dart
PrimaryButton(
  text: 'Sign up',
  isLoading: _isLoading,
  onPressed: _handleSignUp,
)
```

---

### 5.3 Role Selection Grid (`_RoleCard`)

Used in registration, onboarding, and role switching:

- **Layout**: 2-Column `Wrap` (spacing: `10px`, runSpacing: `10px`).
- **Dimensions**: Card width: `(maxWidth - 10) / 2`, height: `95.0px`.
- **Border Radius**: `20px`.
- **States**:
  - **Selected**:
    - Background: `#EEF2FF` (Light) / `#131A33` (Dark).
    - Border: `2.0px` solid `#6366F1` (`AppColors.primaryBright`).
    - Shadow: `BoxShadow(color: Color(0xFF6366F1).withValues(alpha: 0.08), blurRadius: 10, offset: Offset(0, 4))`.
    - Icon & Label Color: `#6366F1`.
  - **Unselected**:
    - Background: `#FFFFFF` (Light) / `#141D38` (Dark).
    - Border: `1.0px` solid `#E2E8F0` (Light) / `#252E4A` (Dark).
    - Shadow: `BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: Offset(0, 2))`.
    - Icon & Label Color: `#94A3B8` (Light) / `#7C82A0` (Dark).
- **Interaction**:
  - Animated micro-bounce scale to `0.94` in `80ms`.
  - Haptic feedback: `HapticFeedback.lightImpact()`.

---

### 5.4 Password Strength Meter

Visual 4-stage indicator directly underneath the password input:

- **Bar Row**: 4 horizontal segment containers (`Expanded`).
  - Segment height: `4px`, margin: `horizontal: 2px`, radius: `2px`.
  - Filled Segment Color: `#3D4AB8` (`AuthDesign.primaryIndigo`).
  - Unfilled Segment Color: `#E6E6F0` (`AuthDesign.underlineUnfocused`).
- **Rating Labels**: `'Weak'` (1 segment), `'Fair'` (2 segments), `'Good'` (3 segments), `'Strong'` (4 segments).
- **Label Typography**: `Poppins`, `10px`, `w500`, color `#A0A0B8`.

---

### 5.5 Social Authentication Row (`SocialIconRow` & `SocialAuthButton`)

Standardized SSO authentication row:

- **Divider**:
  - Central text: `"Sign up with"` or `"Sign in with"`, `Poppins 11px w500`, `#A0A0B8`.
  - Flanked by two `1px` lines of `#E6E6F0` (`underlineUnfocused`).
- **Buttons (Google & GitHub)**:
  - Height: `50px`.
  - Radius: `12px`.
  - Border: `1.5px` solid `#E2E8F0` (Light) / `#252E4A` (Dark).
  - Background: `#FFFFFF` (Light) / `#141D38` (Dark).
  - Shadow: `BoxShadow(color: black.withAlpha(0.04), blurRadius: 6, offset: (0, 3))`.
  - Icon: 20x20 PNG asset + `Inter 13px w600` `#1A1A3A` label.

---

### 5.6 Checkbox & Legal Agreement Row

- **Checkbox**: `24x24` box, `activeColor: #3D4AB8`, `borderRadius: 4px`.
- **Text**: Rich text combining:
  - Body: `"I agree to the processing of "` (`Poppins 11px w500`, `#A0A0B8`).
  - Link: `"Personal data"` (`Poppins 11px w700`, `#3D4AB8`).

---

### 5.7 Compound Top Icon Badge (Forgot Password Pattern)

For recovery, verification, and notification screens:

- **Dimensions**: `48x48px` `SizedBox` with `Stack`.
- **Base Icon**: `Icons.mail_outline` / `Icons.lock_reset`, size `36px`, color `#4F46E5`.
- **Overlapping Badge**: Positioned `right: 0, bottom: 0`, circular badge container, `padding: 1.5px`, background `#FFFFFF`, child icon `Icons.help` / `Icons.verified`, size `15px`, color `#4F46E5`.

---

### 5.8 Toast Feedback System (`AppToast`)

- Floating pill positioned at the top of the viewport.
- Color Tokens:
  - Success: `#10B981` (Green)
  - Warning: `#F59E0B` (Amber)
  - Error: `#EF4444` (Red)
- Synchronized Haptics:
  - Error/Warning: `HapticFeedback.mediumImpact()`
  - Success: `HapticFeedback.heavyImpact()`

---

## 6. 🔄 Cross-Screen Consistency & Migration Audit

To ensure **all screens** match the Forgot Password and Sign Up design language, the following screens must be updated:

| Screen | File Location | Current Inconsistency | Required Fix to Match `design.md` |
| :--- | :--- | :--- | :--- |
| **Login Screen** | `lib/features/auth/screens/login_screen.dart` | Uses `PremiumBackground` with dark scaffold and `GoogleFonts.outfit` instead of the split-hero design. | Wrap with `AuthScreenLayout(title: 'Welcome back')`, replace inputs with `UnderlineTextField`, use `PrimaryButton` and `SocialIconRow`. |
| **OTP Screen** | `lib/features/auth/screens/otp_screen.dart` | Partially updated with `AuthScreenLayout`. Digit boxes use old border style. | Ensure digit boxes match `12px` radius and `#4F46E5` focus ring with `#F8FAFF` fill. |
| **Onboarding Screen** | `lib/features/auth/screens/onboarding_screen.dart` | Uses dark immersive theme without hero band consistency. | Align primary buttons and typography (`Poppins` + `Inter`) with brand tokens. |
| **Setup Wizard** | `lib/features/auth/screens/setup_wizard_screen.dart` | Uses generic card layouts. | Adopt the `28px` card radius, `#E8EAF6` page background, and indigo gradient primary buttons. |
| **Student / Teacher Portals** | `frontend/web/app/` (Web) | Next.js portal currently uses dark canvas by default. | Map Tailwind colors to the exact hex values in Section 2 (`#3D4AB8`, `#4F46E5`, `#6366F1`, `#E8EAF6`, `#FFFFFF`). |

---

## 7. 💻 Quick Implementation Reference

### Flutter Implementation Template for Any Screen

```dart
import 'package:flutter/material.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart' hide PrimaryButton;

class MyUnifiedScreen extends StatelessWidget {
  const MyUnifiedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AuthScreenLayout(
      title: 'Screen Title',
      subtitle: 'Optional helpful description for the user.',
      onBackTap: () => Navigator.of(context).pop(),
      bottomLink: GestureDetector(
        onTap: () {},
        child: Text.rich(
          TextSpan(
            text: 'Need help? ',
            style: AuthDesign.fontPoppins(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AuthDesign.textLabel,
            ),
            children: [
              TextSpan(
                text: 'Contact support',
                style: AuthDesign.fontPoppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AuthDesign.primaryIndigo,
                ),
              ),
            ],
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          UnderlineTextField(
            label: 'Field Label',
            placeholder: 'Enter text here',
          ),
          const SizedBox(height: 22),
          PrimaryButton(
            text: 'Continue',
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}
```

### Tailwind CSS / Next.js Web Token Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: '#3D4AB8',
          primary: '#4F46E5',
          bright: '#6366F1',
          light: '#818CF8',
          dark: '#3730A3',
          soft: '#A5B4FC',
        },
        orb: {
          light: '#9AA4EC',
          mid: '#6670D0',
          dark: '#4D58C0',
        },
        canvas: {
          page: '#E8EAF6',
          card: '#FFFFFF',
          surface: '#F8FAFF',
          selected: '#EEF2FF',
        },
        ink: {
          heading: '#1A1A3A',
          body: '#3D4260',
          label: '#A0A0B8',
          placeholder: '#C8C8D8',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card-top': '28px',
        'input': '12px',
        'role': '20px',
      },
    },
  },
};
```
