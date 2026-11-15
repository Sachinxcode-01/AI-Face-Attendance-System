import { Craft } from "@/components/craft";
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
import { TokenDemo } from "@/components/token-demo";
import { ValueProps } from "@/components/value-props";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
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
      <SiteFooter />
    </>
  );
}
