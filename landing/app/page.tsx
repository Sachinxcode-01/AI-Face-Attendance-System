"use client";

import { useState } from "react";
import { Craft } from "@/components/craft";
import { DemoModal } from "@/components/demo-modal";
import { EdgeSection } from "@/components/edge-section";
import { Faq } from "@/components/faq";
import { Features } from "@/components/features";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Release } from "@/components/release";
import { RoleGateway } from "@/components/role-gateway";
import { Showcase } from "@/components/showcase";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Statement } from "@/components/statement";
import { StickyMobileCta } from "@/components/sticky-mobile-cta";
import { TokenDemo } from "@/components/token-demo";
import { ValueProps } from "@/components/value-props";

export default function HomePage() {
  const [demoOpen, setDemoOpen] = useState(false);

  const openDemo = () => setDemoOpen(true);
  const closeDemo = () => setDemoOpen(false);

  return (
    <>
      <SiteHeader onOpenDemo={openDemo} />
      <main id="main">
        <Hero onOpenDemo={openDemo} />
        <Statement />
        <ValueProps />
        <HowItWorks />
        <Features />
        <Showcase />
        <Release />
        <TokenDemo />
        <Craft />
        <EdgeSection />
        <RoleGateway />
        <Faq />
      </main>
      <SiteFooter onOpenDemo={openDemo} />
      <StickyMobileCta onOpenDemo={openDemo} />
      <DemoModal isOpen={demoOpen} onClose={closeDemo} />
    </>
  );
}
