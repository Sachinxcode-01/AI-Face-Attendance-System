
# Design Reference & System — ByTune Specification

Measured directly from <https://bytune.space/#new> (1536 x 695px computed values).

## Color Palette

Usage | Original CSS value | sRGB hex | CSS Variable
--- | --- | --- | ---
Text High | `rgb(245, 245, 248)` | `#F5F5F8` | `--text-hi`
Text Mid | `rgb(182, 182, 194)` | `#B6B6C2` | `--text-mid`
Text Low | `rgb(138, 138, 151)` | `#8A8A97` | `--text-low`
Text Faint | `rgb(96, 96, 108)` | `#60606C` | `--text-faint`
Surface 0 (Deep Canvas) | `rgb(5, 5, 7)` | `#050507` | `--bg-0`
Surface 1 (Base Layer) | `rgb(10, 10, 14)` | `#0A0A0E` | `--bg-1`
Surface (Card Background) | `rgb(16, 16, 22)` | `#101016` | `--surface`
Panel (Elevated Layer) | `rgb(22, 22, 29)` | `#16161D` | `--panel`
Elevated Surface | `rgb(30, 30, 39)` | `#1E1E27` | `--elev`
Accent (Primary Glow/Violet) | `rgb(143, 139, 255)` | `#8F8BFF` | `--accent`, `--glow`
Accent Soft | `rgba(143, 139, 255, 0.16)` | `#8F8BFF29` | `--accent-soft`
Accent 2 (Cyan Spark) | `rgb(111, 216, 255)` | `#6FD8FF` | `--accent-2`
Accent 2 Soft | `rgba(111, 216, 255, 0.14)` | `#6FD8FF24` | `--accent-2-soft`
Hairline Border | `rgba(255, 255, 255, 0.08)` | `#FFFFFF14` | `--hairline`
Hairline Strong | `rgba(255, 255, 255, 0.16)` | `#FFFFFF29` | `--hairline-strong`
Glass | `rgba(255, 255, 255, 0.04)` | `#FFFFFF0A` | `--glass`
Glass Strong | `rgba(255, 255, 255, 0.07)` | `#FFFFFF12` | `--glass-strong`
Live / Spotify Green | `rgb(30, 215, 96)` | `#1ED760` | `--brand-spotify`
Amber / Warning | `rgb(243, 198, 79)` | `#F3C64F` | `--brand-amber`

## Typography

Role | Family | Weight | Size / Line Height | Tracking
--- | --- | --- | --- | ---
Hero Heading | `Inter`, sans-serif | 500 | 92px / 92px | `-3.22px` (`-0.035em`)
Section Heading | `Inter`, sans-serif | 500 | 58px / 60.32px | `-1.624px` (`-0.028em`)
Subheading | `Inter`, sans-serif | 500 | 19px / 30.4px | `-0.285px` (`-0.015em`)
Body Text | `Inter`, sans-serif | 400 | 14.5px / 23.925px | normal
Small Text | `Inter`, sans-serif | 400 | 13.5px / 21.6px | normal
Button (Default) | `Inter`, sans-serif | 400–600 | 14px–16px / 22.4px–25.6px | normal
Chip Text | `Inter`, sans-serif | 500 | 12.5px / 20px | normal


## Corner Radii & Elevation

- **Card Radius**: `1.375rem` (`22px` - observed 88 occurrences on cards and major panels)
- **Pill Radius**: `999px` (observed 160 occurrences on chips, buttons, navbars, and badges)
- **Inner Radius**: `0.625rem` (`10px` / `16px`)
- **Card Shadow & Inset**: `rgba(255, 255, 255, 0.12) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.9) 0px 44px 90px -34px`
- **Surface Inset**: `rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset`

## Component Recipes

### 1. ByTune Floating Glass Card (`.card-bytune`)

```css
backdrop-filter: blur(18px) saturate(1.5);
-webkit-backdrop-filter: blur(18px) saturate(1.5);
background-color: rgba(12, 12, 17, 0.55);
background-image: linear-gradient(165deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.02));
border: 0.8px solid rgba(255, 255, 255, 0.1);
border-radius: 22px;
box-shadow: rgba(255, 255, 255, 0.12) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.9) 0px 44px 90px -34px;
```

### 2. Radial Accent Glow (`.card-glow-bg`)

```css
background-image: radial-gradient(58% 58% at 50% 62%, rgba(143, 139, 255, 0.2), rgba(0, 0, 0, 0) 72%);
```

### 3. Chip Button Default (`.chip-bytune`)

```css
background-color: rgba(255, 255, 255, 0.03);
border: 0.8px solid rgba(255, 255, 255, 0.08);
border-radius: 999px;
color: rgb(182, 182, 194);
font-size: 12.5px;
font-weight: 500;
line-height: 20px;
padding: 0 14px;
```

### 4. Chip Button Active (`.chip-bytune-active`)

```css
background-color: rgb(255, 255, 255);
border: 0.8px solid rgb(255, 255, 255);
color: rgb(10, 10, 12);
border-radius: 999px;
font-size: 12.5px;
font-weight: 500;
padding: 0 14px;
```

### 5. Gradient Pill Action (`.btn-pill-accent`)

```css
background-image: linear-gradient(90deg, rgb(143, 139, 255), rgb(111, 216, 255));
color: rgb(10, 10, 12);
border-radius: 999px;
font-size: 14px;
font-weight: 600;
padding: 0 20px;
box-shadow: 0 4px 18px rgba(143, 139, 255, 0.25);
```

## Motion & Keyframes

- **Durations**: `0.25s`, `0.35s`, `0.45s`, `0.55s`, `7.5s`
- **Easings**: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out), `cubic-bezier(0.42, 0, 0.58, 1)` (ease-in-out)
- **Keyframes**:
  - `Hero_cueIn`: staggered line rise
  - `Hero_cueFade`: opacity transition
  - `Hero_cueSweep`: sheen sweep (`skewX(-12deg)`)
  - `Hero_cueDip`: subtle scroll bounce
  - `Hero_cueOut`: scroll cue dismiss
  - `Hero_float`: 7.5s smooth vertical float (`translateY(-14px)`)
  - `DesktopSection_pipFloat`: floating pip badge with gentle rotate
  - `LiveCount_eq`: live equalizer bars scaleY modulation
  - `Nav_sheetIn`: mobile drawer sheet entrance
