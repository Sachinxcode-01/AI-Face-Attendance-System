import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Footer Component Preview",
  robots: { index: false, follow: false },
};

export default function FooterPreviewPage() {
  return (
    <main className="min-h-screen bg-[#050507] text-[#f5f5f8] flex flex-col justify-end">
      <SiteFooter />
    </main>
  );
}
