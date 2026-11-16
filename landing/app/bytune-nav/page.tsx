import { ByTuneNav } from "@/components/bytune-nav";

export const metadata = {
  title: "ByTune Nav Component Preview",
  robots: { index: false, follow: false },
};

export default function ByTuneNavPage() {
  return (
    <main className="min-h-screen bg-[#050507] text-[#f5f5f8] flex flex-col items-center pt-8">
      <ByTuneNav />
    </main>
  );
}
