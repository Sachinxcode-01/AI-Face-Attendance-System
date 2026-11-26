"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  HardDrive,
  MonitorSmartphone,
  Server,
  Wifi,
} from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SpotlightCard } from "./ui/spotlight-card";

const DEVICES = [
  {
    icon: MonitorSmartphone,
    name: "USB & IP cameras",
    body: "Connect browser webcams for web check-in, or configure RTSP/USB cameras for local OpenCV kiosk nodes.",
    accent: "rgba(143, 139, 255, 0.2)",
  },
  {
    icon: Server,
    name: "GPU / CPU inference",
    body: "FastAPI ONNX Runtime uses CUDA GPU acceleration when installed and falls back automatically to CPU.",
    accent: "rgba(111, 216, 255, 0.2)",
  },
  {
    icon: Cpu,
    name: "Campus LAN deployment",
    body: "Self-host the Express gateway, FastAPI AI service, and MongoDB on campus servers for local network operation.",
    accent: "rgba(30, 215, 96, 0.2)",
  },
  {
    icon: HardDrive,
    name: "Encrypted mobile queue",
    body: "Flutter mobile buffers up to 500 offline QR check-ins in AES-256 Hive storage and syncs on reconnect.",
    accent: "rgba(243, 198, 79, 0.2)",
  },
];

const SAMPLE_NODES = [
  {
    id: "DEMO_01",
    name: "Sample Gate Kiosk (CUDA)",
    type: "ArcFace buffalo_l",
    status: "Simulated · Ready",
    mode: "GPU / ONNX",
    verifiedStudent: "Sample Student A",
    confidence: "0.86 cosine",
  },
  {
    id: "DEMO_02",
    name: "Sample Classroom Podium",
    type: "20s Rotating QR",
    status: "Simulated · Active",
    mode: "HMAC-SHA256",
    verifiedStudent: "Sample Student B",
    confidence: "QR Valid",
  },
  {
    id: "DEMO_03",
    name: "Sample Mobile Client",
    type: "Flutter Offline Queue",
    status: "Simulated · Buffered",
    mode: "Hive AES-256",
    verifiedStudent: "Sample Student C",
    confidence: "Queued Sync",
  },
  {
    id: "DEMO_04",
    name: "Sample RTSP Kiosk Feed",
    type: "OpenCV Core Engine",
    status: "Simulated · Standby",
    mode: "CPU Fallback",
    verifiedStudent: "Sample Student D",
    confidence: "0.79 cosine",
  },
];

export function EdgeSection() {
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % SAMPLE_NODES.length);
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
            <Reveal direction="left">
              <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                <span className="h-px w-6 bg-accent/60" aria-hidden />
                Deployment &amp; Hardware Topology
              </p>
              <h2 className="mt-3 text-balance font-display text-[32px] font-medium leading-[1.04] tracking-[-0.028em] text-hi sm:text-[46px] lg:text-[58px]">
                Run in the cloud, on campus LAN, or hybrid.
              </h2>
              <p className="mt-5 max-w-[560px] text-pretty text-[16px] sm:text-[19px] leading-[30.4px] tracking-[-0.015em] text-mid">
                Offline mobile queuing keeps check-in capture resilient during short Wi-Fi drops, while campus-hosted Docker/local deployments allow full API and face recognition inside your institution&apos;s LAN.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {DEVICES.map((d, idx) => {
                const Icon = d.icon;
                return (
                  <Reveal key={d.name} delay={idx * 0.08} direction="up" distance={16}>
                    <SpotlightCard
                      spotlightColor={d.accent}
                      className="p-5"
                      enableTilt
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-fit"
                      >
                        <Icon className="h-5 w-5 text-accent transition-colors group-hover:text-accent2" />
                      </motion.div>
                      <h3 className="mt-3 text-[15px] font-medium text-hi group-hover:text-white transition-colors">
                        {d.name}
                      </h3>
                      <p className="mt-1 text-[13px] leading-[20px] text-mid">{d.body}</p>
                    </SpotlightCard>
                  </Reveal>
                );
              })}
            </div>
          </div>

          <div className="space-y-3.5">
            <Reveal direction="down" delay={0.1}>
              <div className="flex items-center justify-between pb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
                <span className="flex items-center gap-2 text-spotify">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spotify opacity-80" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-spotify" />
                  </span>
                  Simulated Node Telemetry (Sample Preview)
                </span>
                <span>4 Sample Modes</span>
              </div>
            </Reveal>

              {
                SAMPLE_NODES.map((node, i) => (
                  <Reveal key={node.id} delay={i * 0.08} direction="right" distance={20}>
                    <motion.div
                      animate={{
                        borderColor:
                          pulseIndex === i ? "rgba(143, 139, 255, 0.45)" : "rgba(255, 255, 255, 0.08)",
                        backgroundColor:
                          pulseIndex === i ? "rgba(22, 22, 29, 0.95)" : "rgba(16, 16, 22, 0.6)",
                      }}
                      transition={{ duration: 0.4 }}
                      className={`group relative flex flex-col justify-between gap-4 rounded-[22px] border p-5 sm:p-6 backdrop-blur-md transition-shadow duration-300 ${pulseIndex === i
                          ? "shadow-[0_4px_30px_rgba(143,139,255,0.14)]"
                          : "hover:border-[var(--hairline-strong)]"
                        }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`h-2 w-2 rounded-full transition-all duration-300 ${pulseIndex === i ? "bg-spotify shadow-[0_0_8px_#1ed760]" : "bg-spotify/50"
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
                          <span className="text-faint block text-[9.5px] uppercase tracking-wider">Runtime</span>
                          <span className="text-hi flex items-center gap-1">
                            <Wifi className="h-3 w-3 text-spotify" />
                            {node.mode}
                          </span>
                        </div>
                        <div>
                          <span className="text-faint block text-[9.5px] uppercase tracking-wider">Sample Subject</span>
                          <span className="text-mid truncate block">{node.verifiedStudent}</span>
                        </div>
                        <div>
                          <span className="text-faint block text-[9.5px] uppercase tracking-wider">Result</span>
                          <span className="text-[#9fe0b6] font-semibold">{node.confidence}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Reveal>
                ))
              }
          </div>
        </div>
      </div>
    </section>
  );
}
