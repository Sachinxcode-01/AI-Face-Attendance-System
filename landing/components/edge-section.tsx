import { Cpu, HardDrive, MonitorSmartphone, Server } from "lucide-react";
import { Reveal } from "./ui/reveal";

const DEVICES = [
  {
    icon: MonitorSmartphone,
    name: "IP camera",
    body: "Existing campus cameras join as edge nodes with a browser tab and a mount.",
  },
  {
    icon: Server,
    name: "GPU node",
    body: "Optional parallel verification for gates that move a thousand students an hour.",
  },
  {
    icon: Cpu,
    name: "Edge box",
    body: "A fanless box at the gate keeps verifying through every uplink outage.",
  },
  {
    icon: HardDrive,
    name: "Local queue",
    body: "Check-ins persist on-device and reconcile the second the line comes back.",
  },
];

export function EdgeSection() {
  return (
    <section
      id="edge"
      className="relative scroll-mt-24 overflow-hidden border-t border-[var(--hairline)] bg-bg1 py-24 sm:py-28"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-10rem] top-10 h-[22rem] w-[22rem] rounded-full bg-accent2/[0.07] blur-[130px]" />
        <div className="absolute bottom-[-10rem] left-[-8rem] h-[20rem] w-[20rem] rounded-full bg-accent/[0.08] blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <Reveal>
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent2">
              <span className="h-px w-6 bg-accent2/60" aria-hidden />
              Edge infrastructure
            </p>
            <h2 className="mt-4 text-balance font-display text-[2.2rem] font-medium leading-[1.08] tracking-[-0.03em] text-hi sm:text-[3.25rem] lg:text-[4rem]">
              Built for the campus, not squeezed onto it.
            </h2>
            <p className="mt-5 max-w-[563.2px] text-pretty text-[16px] leading-[25.6px] text-mid">
              SmartFace runs where the gate is — on the camera, the box, the browser. No server
              room, no proprietary readers, no weekend install. If it can mount a camera, it can
              verify a face.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["IP camera", "USB webcam", "Tablet kiosk", "GPU node"].map((chip) => (
                <span
                  key={chip}
                  className="badge-pill border border-[var(--hairline)] bg-[var(--glass)] font-mono text-[11px] uppercase tracking-[0.12em] backdrop-blur-md"
                >
                  {chip}
                </span>
              ))}
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2">
            {DEVICES.map((device, index) => {
              const Icon = device.icon;
              return (
                <Reveal key={device.name} delay={index * 0.06}>
                  <div className="glass-card group h-full !p-5 transition-transform duration-300 hover:-translate-y-1">
                    <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-accent2">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.7} />
                    </span>
                    <h3 className="mt-4 font-display text-[15px] font-medium tracking-tight text-hi">
                      {device.name}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-low">{device.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Imagery band — placeholder capture, replace pre-launch */}
        <Reveal delay={0.1}>
          <div className="relative mt-14 overflow-hidden rounded-[22px] border border-[var(--hairline)] bg-bg0">
            <div className="relative aspect-[16/5]">
              <div aria-hidden className="absolute inset-0 bg-grid opacity-25" />
              <div
                aria-hidden
                className="absolute left-1/3 top-1/2 h-36 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-3xl"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 px-6">
                {Array.from({ length: 32 }, (_, i) => (
                  <span
                    key={i}
                    className="hidden flex-1 rounded-sm bg-gradient-to-t from-accent/25 to-accent2/50 sm:block"
                    style={{
                      height: `${14 + ((i * 47) % 46)}px`,
                      opacity: 0.35 + ((i * 17) % 10) / 18,
                      animation: `LiveCount_eq ${1.4 + (i % 5) * 0.2}s var(--ease-in-out) ${i * 0.07}s infinite`,
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-center">
                <p className="rounded-full border border-[var(--hairline)] bg-bg0/70 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-faint backdrop-blur-md">
                  42 edge nodes · one campus · zero lost records
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
