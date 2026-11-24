"use client";

import { useState } from "react";
import { Craft } from "@/components/craft";
import { DemoModal } from "@/components/demo-modal";
import { EdgeSection } from "@/components/edge-section";
import { Faq } from "@/components/faq";
import { Features } from "@/components/features";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { PilotModal } from "@/components/pilot-modal";
import { Pricing } from "@/components/pricing";
import { ProductTour } from "@/components/product-tour";
import { Release } from "@/components/release";
import { RoleGateway } from "@/components/role-gateway";
import { RoiCalculator } from "@/components/roi-calculator";
import { SecuritySection } from "@/components/security-section";
import { Showcase } from "@/components/showcase";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SocialProof } from "@/components/social-proof";
import { Statement } from "@/components/statement";
import { StickyMobileCta } from "@/components/sticky-mobile-cta";
import { TokenDemo } from "@/components/token-demo";
import { TrustArchitecture } from "@/components/trust-architecture";
import { ValueProps } from "@/components/value-props";

export default function HomePage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [pilotOpen, setPilotOpen] = useState(false);

  const openDemo = () => setDemoOpen(true);
  const closeDemo = () => setDemoOpen(false);

  const openPilot = () => setPilotOpen(true);
  const closePilot = () => setPilotOpen(false);

  return (
    <>
      <SiteHeader onOpenDemo={openDemo} onOpenPilot={openPilot} />
      <main id="main">
        {/* Phase 2: High Conversion Hero */}
        <Hero onOpenDemo={openDemo} onOpenPilot={openPilot} />

        {/* Phase 10: Trust & Credibility Stats & Architecture */}
        <TrustArchitecture />

        {/* Phase 9: Guided Interactive Product Tour */}
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

        <RoleGateway />
        <Faq />
      </main>

      <SiteFooter onOpenDemo={openDemo} onOpenPilot={openPilot} />
      <StickyMobileCta onOpenDemo={openDemo} onOpenPilot={openPilot} />

      {/* Phase 3 & 4 Lead Capture Modals */}
      <DemoModal isOpen={demoOpen} onClose={closeDemo} />
      <PilotModal isOpen={pilotOpen} onClose={closePilot} />
    </>
  );
}
