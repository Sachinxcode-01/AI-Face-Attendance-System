# 🔒 SmartFace Security & Biometric Data Governance — ByTune Design System Specification

Measured directly from [ByTune Space](https://bytune.space/#new) (1536 x 695px computed values) and aligned with the SmartFace `design.md` token architecture.

---

## 1. 🎨 Visual Hierarchy & Color Palette

All security and compliance interfaces adhere to the strict ByTune dark-surface chromatic ladder:

| Usage Token | CSS Variable | Hex / RGBA | Role in Security UI |
| :--- | :--- | :--- | :--- |
| **Deep Canvas** | `--bg-0` | `#050507` | Base background behind ambient glows |
| **Base Surface** | `--bg-1` | `#0A0A0E` | Intermediate scaffold layer |
| **Card Surface** | `--surface` | `#101016` | Security pillar cards, modal cards |
| **Elevated Panel** | `--panel` | `#16161D` | Interactive audit blocks, code snippets |
| **High Elevation** | `--elev` | `#1E1E27` | Floating tooltip indicators, active badges |
| **Text High** | `--text-hi` | `#F5F5F8` | Primary headings, verified status values |
| **Text Mid** | `--text-mid` | `#B6B6C2` | Body descriptions, security policy copy |
| **Text Low** | `--text-low` | `#8A8A97` | Secondary technical attributes |
| **Text Faint** | `--text-faint` | `#85858F` | Monospace tags, timestamps, hash prefixes |
| **Accent Glow** | `--accent` | `#8F8BFF` | 512-dim vector highlights, primary buttons |
| **Cyan Spark** | `--accent-2` | `#6FD8FF` | Active vector nodes, cryptographic locks |
| **Spotify Live** | `--brand-spotify` | `#1ED760` | Verified check-ins, compliant badges, live pulses |
| **Amber Warning** | `--brand-amber` | `#F3C64F` | Spoof attack rejection, tamper alerts |
| **Hairline Border** | `--hairline` | `rgba(255, 255, 255, 0.08)` | 1px border dividers |
| **Hairline Strong**| `--hairline-strong`| `rgba(255, 255, 255, 0.16)` | Active card outlines, interactive borders |

---

## 2. ✍️ Typography & Text Design Framework

### 2.1 The ByTune Kinetic Text Stack
- **Display Headings**: `Inter` (Font weight 500, tight tracking `-0.028em` to `-0.035em`).  
- **Kinetic Stagger Line Rise**:
  ```tsx
  <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
    <span data-hero-line style={{ transform: "translateY(112%)" }} className="block will-change-transform text-hi">
      Security & Biometric Data Governance
    </span>
  </span>
  ```
- **Monospace Eyebrow Chips**: `font-mono text-[10.5px] uppercase tracking-[0.2em] text-accent`.
- **Stat Values**: `font-display text-4xl sm:text-5xl font-semibold tracking-tight text-hi`.
- **Cryptographic Hashes & Technical Code**: `font-mono text-[12px] leading-relaxed text-mid bg-black/40 px-2 py-1 rounded-md border border-white/[0.06]`.

---

## 3. 🧩 Component Recipes (ByTune Spec)

### 3.1 ByTune Floating Glass Card (`.card-bytune`)
```css
backdrop-filter: blur(18px) saturate(1.5);
-webkit-backdrop-filter: blur(18px) saturate(1.5);
background-color: rgba(12, 12, 17, 0.65);
background-image: linear-gradient(165deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.015));
border: 0.8px solid rgba(255, 255, 255, 0.1);
border-radius: 22px;
box-shadow: rgba(255, 255, 255, 0.12) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.9) 0px 44px 90px -34px;
```

### 3.2 Live Equalizer Bar Animation (`LiveCount_eq`)
Used for live cryptographic heartbeat and active edge nodes:
```css
@keyframes LiveCount_eq {
  0%, 100% { transform: scaleY(0.25); }
  50% { transform: scaleY(1); }
}
```

### 3.3 Interactive Vector Matrix (ArcFace 512-dim Representation)
A 64-node visual matrix representing mathematical float32 normalized vectors with sequential light sweep:
```tsx
<div className="grid grid-cols-16 gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-black/40">
  {/* 64 animated vector nodes with cyan/violet radial modulation */}
</div>
```

---

## 4. 🛡️ Statutory Copy Frameworks

1. **Zero-Photo Storage Guarantee**:
   > *"Raw facial frames are converted into a 512-dimension mathematical vector in volatile memory (~180ms) and immediately discarded. No photograph is ever written to disk or database."*

2. **Irreversible Vector Mathematics**:
   > *"A 512-dim embedding is a one-way mathematical projection. It is mathematically impossible to reconstruct a human face from a cosine vector."*

3. **Anti-Spoofing & Liveness**:
   > *"Passive 3D liveness detection evaluates surface specular reflection, screen pixel moiré, and depth contours to neutralize printed photos, 4K screen replays, and silicone masks."*

4. **Regulatory Alignment**:
   > *"Full statutory alignment with India's Digital Personal Data Protection (DPDP) Act 2023, US Family Educational Rights and Privacy Act (FERPA), and ISO/IEC 27001 security standards."*
