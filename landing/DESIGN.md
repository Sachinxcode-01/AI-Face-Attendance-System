# Design Reference & Tokens

Measured from https://bytune.space/#new (1536 x 695px via Sitepeel).

## Color Palette

Usage | Original CSS value | sRGB hex | CSS Variable
--- | --- | --- | ---
Text | `rgb(245, 245, 248)` | `#F5F5F8` | `--text-hi`
Text | `rgb(182, 182, 194)` | `#B6B6C2` | `--text-mid`
Text | `rgb(138, 138, 151)` | `#8A8A97` | `--text-low`
Text | `rgb(96, 96, 108)` | `#60606C` | `--text-faint`
Surface | `rgb(5, 5, 7)` | `#050507` | `--bg-0`
Surface | `rgb(10, 10, 14)` | `#0A0A0E` | `--bg-1`
Surface | `rgb(16, 16, 22)` | `#101016` | `--surface`
Surface | `rgb(22, 22, 29)` | `#16161D` | `--panel`
Surface | `rgb(30, 30, 39)` | `#1E1E27` | `--elev`
Accent | `rgb(143, 139, 255)` | `#8F8BFF` | `--accent`, `--glow`
Accent Soft | `rgba(143, 139, 255, 0.16)` | `#8F8BFF29` | `--accent-soft`
Accent 2 | `rgb(111, 216, 255)` | `#6FD8FF` | `--accent-2`
Accent 2 Soft | `rgba(111, 216, 255, 0.14)` | `#6FD8FF24` | `--accent-2-soft`
Border / Hairline | `rgba(255, 255, 255, 0.08)` | `#FFFFFF14` | `--hairline`
Border Strong | `rgba(255, 255, 255, 0.16)` | `#FFFFFF29` | `--hairline-strong`
Glass | `rgba(255, 255, 255, 0.04)` | `#FFFFFF0A` | `--glass`
Glass Strong | `rgba(255, 255, 255, 0.07)` | `#FFFFFF12` | `--glass-strong`

## Typography & Hierarchy

Role | Family | Weight | Size / Line Height
--- | --- | --- | ---
Hero Heading | `Chivo`, sans-serif | 500/700 | 92px / 92px (`tracking: -3.22px`)
Section Heading | `Chivo`, sans-serif | 500/700 | 64px / 69px (`tracking: -1.92px`)
Subheading | `Inter`, sans-serif | 500 | 19px / 30px (`tracking: -0.285px`)
Body | `Inter`, sans-serif | 400 | 14.5px–16px / 23px–25.6px
Small / Meta | `ui-monospace`, monospace | 400 | 11.5px / 18.4px

## Radii & Elevation

- Radii: `4px` (`--radius-s`), `6px` (`--radius-m`), `8px` (`--radius-l`), `999px` (pills)
- Card Shadow: `0 1.5rem 3.75rem -1.5rem rgba(0,0,0,0.7)` (`--shadow-card`)
- Inset Card Highlight: `rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset`
- Motion Timing: `0.55s` (`--dur`), `cubic-bezier(0.22, 1, 0.36, 1)` (`--ease-out`), `cubic-bezier(0.42, 0, 0.58, 1)` (`--ease-in-out`)
