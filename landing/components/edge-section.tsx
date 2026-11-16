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
      className="relative scroll-mt-24 overflow-hidden border-t border-[var(--hairline)] bg-bg1 py-28 sm:py-36 lg:py-[168px]"
    >
      <div className="relative mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              <span className="h-px w-6 bg-accent/60" aria-hidden />
              Decentralized Edge Fleet
            </p>
            <h2 className="mt-3 text-balance font-display text-[32px] font-medium leading-[1.04] tracking-[-0.028em] text-hi sm:text-[46px] lg:text-[58px]">
              Every device is a gate. Every gate keeps running.
            </h2>
            <p className="mt-5 max-w-[560px] text-pretty text-[16px] sm:text-[19px] leading-[30.4px] tracking-[-0.015em] text-mid">
              No single point of failure. If the campus backbone goes dark, turnstiles and cameras
              verify against their local SQLite replica, queuing encrypted punches to sync on reconnect.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {DEVICES.map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.name}
                    className="group rounded-[18px] border border-[var(--hairline)] bg-surface p-5 transition hover:border-[var(--hairline-strong)] hover:bg-[#16161d]"
                  >
                    <Icon className="h-5 w-5 text-accent group-hover:text-accent2 transition-colors" />
                    <h3 className="mt-3 text-[15px] font-medium text-hi">{d.name}</h3>
                    <p className="mt-1 text-[13px] leading-[20px] text-mid">{d.body}</p>
                  </div>
              );
              })}
            </div>
        </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
                  <span className="flex items-center gap-2 text-spotify">
                    <span className="h-2 w-2 rounded-full bg-spotify animate-ping" />
                    Live Fleet Telemetry
                  </span>
                  <span>4 Nodes Reporting</span>
                </div>

                          {EDGE_NODES.map((node, i) => (
                            <Reveal key={node.id} delay={i * 0.06}>
                              <div
                                className={`group relative flex flex-col justify-between gap-4 rounded-[22px] border p-5 sm:p-6 transition-all duration-300 ${pulseIndex === i
                                    ? "border-accent/40 bg-[#16161d] shadow-[0_4px_24px_rgba(143,139,255,0.08)]"
                                    : "border-[var(--hairline)] bg-surface hover:border-[var(--hairline-strong)]"
                                  }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className={`h-2 w-2 rounded-full ${pulseIndex === i ? "bg-spotify animate-pulse" : "bg-spotify/60"
                                        }`}
                                    />
                                    <span className="font-mono text-[11px] font-semibold text-hi">
                                      {node.id}
                                    </span>
                                      <span className="text-[14px] font-medium text-hi">
                                        {node.name}
                                      </span>
                                  </div>
                                  <span className="chip-bytune h-6 text-[10.5px] px-3 font-mono">
                                    {node.type}
                                  </span>
                                </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-3 sm:grid-cols-4 font-mono text-[11px]">
                        <div>
                          <span className="text-faint block text-[9.5px] uppercase tracking-wider">Status</span>
                          <span className="text-spotify font-medium">{node.status}</span>
                        </div>
                        <div>
                          <span className="text-faint block text-[9.5px] uppercase tracking-wider">Latency</span>
                          <span className="text-hi">{node.latency}</span>
                        </div>
                        <div>
                          <span className="text-faint block text-[9.5px] uppercase tracking-wider">Last Subject</span>
                          <span className="text-mid truncate block">{node.verifiedStudent}</span>
                        </div>
                        <div>
                          <span className="text-faint block text-[9.5px] uppercase tracking-wider">Confidence</span>
                          <span className="text-[#9fe0b6] font-medium">{node.confidence}</span>
                        </div>
                      </div>
                    </div>
              </Reveal>
            ))}
            </div>
        </div >
      </div >
    </section >
  );
}
