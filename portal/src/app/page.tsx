"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/landing-page/site-header";
import { Hero } from "@/components/landing-page/hero";
import { TrustArchitecture } from "@/components/landing-page/trust-architecture";
import { ProductTour } from "@/components/landing-page/product-tour";
import { RoiCalculator } from "@/components/landing-page/roi-calculator";
import { Statement } from "@/components/landing-page/statement";
import { ValueProps } from "@/components/landing-page/value-props";
import { HowItWorks } from "@/components/landing-page/how-it-works";
import { Features } from "@/components/landing-page/features";
import { SecuritySection } from "@/components/landing-page/security-section";
import { SocialProof } from "@/components/landing-page/social-proof";
import { Showcase } from "@/components/landing-page/showcase";
import { Release } from "@/components/landing-page/release";
import { TokenDemo } from "@/components/landing-page/token-demo";
import { Craft } from "@/components/landing-page/craft";
import { EdgeSection } from "@/components/landing-page/edge-section";
import { Pricing } from "@/components/landing-page/pricing";
import { RoleGateway } from "@/components/landing-page/role-gateway";
import { Faq } from "@/components/landing-page/faq";
import { SiteFooter } from "@/components/landing-page/site-footer";
import { StickyMobileCta } from "@/components/landing-page/sticky-mobile-cta";
import { DemoModal } from "@/components/landing-page/demo-modal";
import { PilotModal } from "@/components/landing-page/pilot-modal";

export default function PortalHomePage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [pilotOpen, setPilotOpen] = useState(false);

  const openDemo = () => setDemoOpen(true);
  const closeDemo = () => setDemoOpen(false);

  const openPilot = () => setPilotOpen(true);
  const closePilot = () => setPilotOpen(false);

  return (
    <div className="min-h-screen bg-[#050507] text-[#B6B6C2] selection:bg-[#8F8BFF]/30 selection:text-white font-sans">
      <SiteHeader onOpenDemo={openDemo} onOpenPilot={openPilot} />
      
      <main id="main">
        {/* Phase 2: High Conversion ByTune Hero with Live Verification Scanner */}
        <Hero onOpenDemo={openDemo} onOpenPilot={openPilot} />

        {/* Phase 10: Trust & Credibility Stats & Architecture */}
        <TrustArchitecture />

        {/* Phase 9: Guided Interactive Product Tour across Roles */}
        <ProductTour />

        {/* Phase 5: Interactive ROI & Efficiency Calculator */}
        <RoiCalculator onOpenDemo={openDemo} onOpenPilot={openPilot} />

        <Statement />
        <ValueProps />
        <HowItWorks />
        <Features />

        {/* Phase 7: Biometric Data Governance & Zero-Photo Security */}
        <SecuritySection onOpenDemo={openDemo} onOpenPilot={openPilot} />

        {/* Phase 6: Social Proof & Multi-Stakeholder Case Studies */}
        <SocialProof />

        <Showcase />
        <Release />
        <TokenDemo />
        <Craft />
        <EdgeSection />

        {/* Phase 8: Transparent Institutional Pricing */}
        <Pricing onOpenDemo={openDemo} onOpenPilot={openPilot} />

        {/* Unified Stakeholder Role Gateway */}
        <RoleGateway />
        
        <Faq />
      </main>

      <SiteFooter onOpenDemo={openDemo} onOpenPilot={openPilot} />
      <StickyMobileCta onOpenDemo={openDemo} onOpenPilot={openPilot} />

      {/* Interactive Modals */}
      <DemoModal isOpen={demoOpen} onClose={closeDemo} />
      <PilotModal isOpen={pilotOpen} onClose={closePilot} />
    </div>
  );
}
