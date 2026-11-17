"use client";

import { CloudOff, Fingerprint, Flame, QrCode, Radar, Sparkles, type LucideIcon } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const CELL =
  "relative flex flex-col overflow-hidden rounded-[22px] border border-[var(--hairline)] bg-[var(--surface)] p-6 sm:p-7 transition-all duration-300 hover:border-[var(--hairline-strong)] hover:bg-[#16161d]";

const TIERS = ["Bronze", "Silver", "Gold", "Inferno"];

const OFFLINE_POINTS = ["Local queue", "Auto-reconcile", "No lost records"];

function CellLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
      <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.8} />
      {children}
    </p>
  );
}

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]">
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          title="Everything attendance needs. Nothing it doesn't."
          description="Five systems working as one: identity, session integrity, security escalation, habit and uptime."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-6">
          {/* Feature 1: Biometrics Vector */}
          <Reveal className="lg:col-span-3">
            <div id="biometrics-card" className={`${CELL} h-full`}>
              <CellLabel icon={Fingerprint}>512-dim biometrics</CellLabel>
              <h3 className="mt-4 font-display text-[22px] font-medium tracking-tight text-hi">
                ArcFace, embedded at the edge
              </h3>
              <p className="mt-2 max-w-md text-[14.5px] leading-[23.9px] text-mid">
                Every enrollment becomes a 512-dimension vector. Recognition compares embeddings,
                never photographs, and returns a confidence score in milliseconds.
              </p>
              <div
                aria-hidden
                className="mt-6 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1"
              >
                {Array.from({ length: 64 }, (_, index) => (
                  <span
                    key={index}
                    className="aspect-square rounded-[3px] bg-accent"
                    style={{ opacity: 0.12 + (((index * 37) % 11) / 11) * 0.8 }}
                  />
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-faint border-t border-white/[0.06] pt-3">
                <span>Vector · 512</span>
                <span className="text-[#9fe0b6] font-medium">Cosine 0.94</span>
              </div>
            </div>
          </Reveal>

          {/* Feature 2: Anti-Proxy QR */}
          <Reveal className="lg:col-span-3">
            <div className={`${CELL} h-full`}>
              <CellLabel icon={QrCode}>Anti-proxy session</CellLabel>
              <h3 className="mt-4 font-display text-[22px] font-medium tracking-tight text-hi">
                Rotating tokens, zero screenshots
              </h3>
              <p className="mt-2 max-w-md text-[14.5px] leading-[23.9px] text-mid">
                QR codes rotate on a 30-second window, signed with HMAC-SHA256 and bound to the
                teacher&apos;s live session, paired with biometric face verification to reject proxy submissions.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 font-mono text-sm tracking-wider text-hi">
                  8A·3F·D1
                </span>
                <span className="font-mono text-xs text-faint">rotates in 18s</span>
              </div>
              <div className="mt-5 flex items-center justify-between font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-faint border-t border-white/[0.06] pt-3">
                <span>HMAC · SHA256</span>
                <span className="text-accent font-medium">30s drift window</span>
              </div>
            </div>
          </Reveal>

          {/* Feature 3: Sentinel */}
          <Reveal className="lg:col-span-2">
            <div className={`${CELL} h-full`}>
              <CellLabel icon={Radar}>Sentinel guard</CellLabel>
              <h3 className="mt-4 font-display text-[20px] font-medium tracking-tight text-hi">
                Intruder escalation
              </h3>
              <p className="mt-2 text-[14px] leading-[23px] text-mid">
                Repeated unrecognized faces at campus perimeters trigger real-time alerts to the
                security desk with timestamp, frame, and gate ID.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-spotify animate-ping" />
                <span className="font-mono text-xs text-mid">Gate B perimeter alert</span>
              </div>
            </div>
          </Reveal>

          {/* Feature 4: Streaks */}
          <Reveal className="lg:col-span-2">
            <div className={`${CELL} h-full`}>
              <CellLabel icon={Flame}>Student streaks</CellLabel>
              <h3 className="mt-4 font-display text-[20px] font-medium tracking-tight text-hi">
                Habit over coercion
              </h3>
              <p className="mt-2 text-[14px] leading-[23px] text-mid">
                Attendance gamified with streak tiers, badges, and leaderboard visibility.
                Students protect their streaks instead of dodging roll call.
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {TIERS.map((tier, idx) => (
                  <span
                    key={tier}
                    className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${idx === 3
                      ? "bg-accent/20 text-accent border border-accent/40 font-medium"
                      : "bg-white/[0.04] text-mid border border-white/5"
                      }`}
                  >
                    {tier}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Feature 5: Nexa AI & Offline Edge */}
          <Reveal className="lg:col-span-2">
            <div className={`${CELL} h-full`}>
              <CellLabel icon={CloudOff}>Edge resilience</CellLabel>
              <h3 className="mt-4 font-display text-[20px] font-medium tracking-tight text-hi">
                Offline-first queue
              </h3>
              <p className="mt-2 text-[14px] leading-[23px] text-mid">
                If campus Wi-Fi drops, gate verification continues uninterrupted. Check-ins
                queue locally on the edge node and auto-reconcile on reconnect.
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {OFFLINE_POINTS.map((point) => (
                  <span
                    key={point}
                    className="chip-bytune h-6 text-[10.5px] px-2.5"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
