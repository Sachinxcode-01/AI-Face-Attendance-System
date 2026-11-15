"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  Cpu,
  HardDrive,
  MonitorSmartphone,
  Radio,
  ScanFace,
  Server,
  Wifi,
} from "lucide-react";
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

const EDGE_NODES = [
  {
    id: "NODE_01",
    name: "North Turnstile Kiosk",
    type: "ArcFace ONNX v2.4",
    status: "Active · Verifying",
    latency: "192ms",
    verifiedStudent: "Alex Rivera",
    studentId: "STU-88219",
    confidence: "99.8%",
    isLive: true,
  },
  {
    id: "NODE_04",
    name: "Science Quad Gate 2",
    type: "Rotating QR Scanner",
    status: "Active · Standby",
    latency: "218ms",
    verifiedStudent: "Elena Rostova",
    studentId: "STU-44021",
    confidence: "99.9%",
    isLive: true,
  },
  {
    id: "NODE_12",
    name: "Engineering Hallway",
    type: "Edge Micro-Box",
    status: "Local Cache Queue",
    latency: "148ms",
    verifiedStudent: "Marcus Chen",
    studentId: "STU-92104",
    confidence: "99.7%",
    isLive: true,
  },
  {
    id: "NODE_27",
    name: "Main Library Kiosk",
    type: "RTSP Camera Feed",
    status: "Active · Verifying",
    latency: "235ms",
    verifiedStudent: "Sophia Patel",
    studentId: "STU-61298",
    confidence: "99.8%",
    isLive: true,
  },
];

export function EdgeSection() {
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % EDGE_NODES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

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

        {/* Live Edge Telemetry Console (Replaces the empty void) */}
        <Reveal delay={0.1}>
                <div className="relative mt-14 overflow-hidden rounded-[24px] border border-[var(--hairline-strong)] bg-bg0/95 shadow-[0_30px_90px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
                  {/* Top Console Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hairline)] bg-white/[0.02] px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1ed760] opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-[#1ed760] shadow-[0_0_8px_#1ed760]" />
                      </span>
                      <span className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.2em] text-hi">
                        Live Edge Campus Telemetry
                      </span>
                      <span className="hidden sm:inline-block rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-faint">
                        Cluster: METRO-MAIN-42
                      </span>
                    </div>

                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="hidden md:flex items-center gap-1.5 text-mid">
                            <Activity className="h-3.5 w-3.5 text-accent2" />
                            P95 Latency: <strong className="text-hi">212ms</strong>
                          </span>
                          <span className="flex items-center gap-1.5 text-mid">
                            <Wifi className="h-3.5 w-3.5 text-[#1ed760]" />
                            Sync: <strong className="text-[#9fe0b6]">Real-time</strong>
                          </span>
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#9fe0b6]">
                            42 Nodes Online
                          </span>
                        </div>
                    </div>

                    {/* Nodes Visualizer Grid */}
                    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                      {EDGE_NODES.map((node, i) => {
                        const isSelected = i === pulseIndex;
                        return (
                          <div
                            key={node.id}
                            className={`relative rounded-2xl border p-4 transition-all duration-500 ${isSelected
                                ? "border-accent/60 bg-gradient-to-b from-accent/15 via-white/[0.03] to-transparent shadow-[0_0_30px_rgba(143,139,255,0.2)]"
                                : "border-[var(--hairline)] bg-surface/50 hover:border-white/20"
                              }`}
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-faint">
                                {node.id}
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#9fe0b6]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#1ed760]" />
                                {node.latency}
                              </span>
                            </div>

                            <h4 className="mt-2 text-[14px] font-medium text-hi tracking-tight">
                              {node.name}
                            </h4>
                            <p className="font-mono text-[10px] text-low">{node.type}</p>

                            {/* Camera Viewport Simulation / Verification status */}
                            <div className="relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-bg0/80 p-3">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="flex items-center gap-1.5 font-medium text-hi">
                                  <ScanFace className="h-3.5 w-3.5 text-accent" />
                                  {node.verifiedStudent}
                                </span>
                                <span className="font-mono text-[9px] text-faint">
                                  {node.studentId}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                                <span className="inline-flex items-center gap-1 text-[10px] text-[#9fe0b6]">
                                  <CheckCircle2 className="h-3 w-3 text-[#1ed760]" />
                                  Verified
                                </span>
                                <span className="font-mono text-[10px] font-semibold text-accent">
                                  {node.confidence}
                                </span>
                              </div>

                              {/* Animated scanning bar on active node */}
                              {isSelected ? (
                                <div
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent animate-[pulse_1s_infinite]"
                                />
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Real-time Telemetry Status Band */}
                    <div className="flex flex-col gap-3 border-t border-[var(--hairline)] bg-white/[0.01] px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#1ed760]" />
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mid">
                          42 edge nodes · one campus · zero lost records on WAN outage
                        </p>
                      </div>

                      <div className="flex items-center gap-6 font-mono text-[10px] text-faint">
                        <span>ONNX Runtime: <strong className="text-mid">v1.18.1</strong></span>
                        <span className="hidden sm:inline">Local Buffer: <strong className="text-[#9fe0b6]">0 dropped</strong></span>
                        <span>Uptime: <strong className="text-mid">99.98%</strong></span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </section>
            );
}
