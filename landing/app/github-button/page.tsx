import { GitHubButton } from "@/components/github-button";

export const metadata = {
  title: "GitHub Button Component Preview",
  robots: { index: false, follow: false },
};

export default function GitHubButtonPage() {
  return (
    <main className="min-h-screen bg-[#050507] text-[#f5f5f8] flex flex-col items-center justify-center p-8">
      <div className="rounded-xl border border-white/10 bg-panel/50 p-12 flex flex-col items-center gap-6">
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-faint">
          ByTune / SmartFace GitHub Pill Component
        </p>
        <GitHubButton />
      </div>
    </main>
  );
}
