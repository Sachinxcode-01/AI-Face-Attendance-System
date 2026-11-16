import Link from "next/link";
import { ArrowLeft, LayoutDashboard, ScanFace } from "lucide-react";

export const metadata = {
  title: "404 - Portal Screen Not Found",
  description: "The requested portal screen or resource does not exist.",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg0 px-6 py-20 text-center font-sans">
      <div className="relative z-10 mx-auto w-full max-w-lg rounded-[22px] card-bytune p-8 shadow-2xl sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-[#050507] shadow-xl shadow-accent/25">
          <ScanFace className="h-7 w-7" strokeWidth={2.2} />
        </div>

        <div className="mt-5 inline-flex items-center gap-2 chip-bytune border-red-500/25 bg-red-500/10 text-red-400 font-mono text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          HTTP 404 · PORTAL UNRESOLVED
        </div>

        <h1 className="mt-4 font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-hi">
          Portal Screen Not Found
        </h1>

        <p className="mt-3 text-[14px] leading-relaxed text-mid">
          This portal route has been moved or requires elevated campus authorization.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="btn-pill-accent h-11 w-full sm:w-auto px-6 text-xs font-semibold"
          >
            <LayoutDashboard className="h-4 w-4" />
            Portal Gateway
          </Link>

          <Link
            href="/auth/login"
            className="btn-pill-glass h-11 w-full sm:w-auto px-6 text-xs font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
