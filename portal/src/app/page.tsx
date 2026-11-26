import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ScanFace } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PortalHero } from "@/components/landing/PortalHero";

const HowItWorksSection = dynamic(() =>
  import("@/components/landing/HowItWorksSection").then((m) => m.HowItWorksSection),
);
const SmartAttendanceSection = dynamic(() =>
  import("@/components/landing/SmartAttendanceSection").then((m) => m.SmartAttendanceSection),
);
const InteractiveTokenCraft = dynamic(() =>
  import("@/components/landing/InteractiveTokenCraft").then((m) => m.InteractiveTokenCraft),
);
const RoleGatewaySection = dynamic(() =>
  import("@/components/landing/RoleGatewaySection").then((m) => m.RoleGatewaySection),
);
const ArchitectureFaqSection = dynamic(() =>
  import("@/components/landing/ArchitectureFaqSection").then((m) => m.ArchitectureFaqSection),
);

export default function PortalHomePage() {
  return (
    <div className="min-h-screen bg-[#050507] text-[#B6B6C2] flex flex-col justify-between selection:bg-[#8F8BFF]/30 selection:text-white font-sans">
      {/* Top Floating ByTune Capsule Navbar */}
      <SiteHeader />

      {/* Main Portal Content */}
      <main id="main" className="flex-1">
        <PortalHero />
        <HowItWorksSection />
        <SmartAttendanceSection />
        <InteractiveTokenCraft />
        <RoleGatewaySection />
        <ArchitectureFaqSection />
      </main>

      {/* Portal Footer */}
      <footer className="border-t border-[var(--hairline)] bg-[#050507] py-12 px-6 sm:px-12 text-xs text-faint">
        <div className="mx-auto max-w-[var(--wide)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[#050507]">
              <ScanFace className="h-4 w-4" strokeWidth={2.4} />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-hi">SmartFace Attendance Portal</p>
              <p className="text-[11px] font-mono text-faint">
                ArcFace buffalo_l 512-D ONNX · RBAC & Encrypted Offline Sync
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px]">
            <Link href="/student" className="text-mid hover:text-hi transition-colors">Student</Link>
            <Link href="/teacher" className="text-mid hover:text-hi transition-colors">Teacher</Link>
            <Link href="/admin" className="text-mid hover:text-hi transition-colors">Admin</Link>
            <Link href="/parent" className="text-mid hover:text-hi transition-colors">Parent</Link>
            <Link href="/admin/super-admin" className="text-mid hover:text-hi transition-colors">Super Admin</Link>
            <span className="h-3 w-px bg-white/10" aria-hidden />
            <Link href="/auth/login" className="text-accent hover:text-accent2 transition-colors">Sign In</Link>
            <Link href="/auth/register" className="text-accent hover:text-accent2 transition-colors">Sign Up</Link>
          </div>

          <p className="font-mono text-[11px] text-faint">
            © {new Date().getFullYear()} SmartFace Suite.
          </p>
        </div>
      </footer>
    </div>
  );
}
