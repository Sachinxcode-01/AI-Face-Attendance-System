import Link from "next/link";
import { ArrowLeft, LayoutDashboard, ScanFace } from "lucide-react";

export const metadata = {
  title: "404 - Portal Screen Not Found",
  description: "The requested portal screen or resource does not exist.",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6 py-20 text-center font-sans">
      <div className="relative z-10 mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
          <ScanFace className="h-7 w-7 text-indigo-400" />
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[11px] font-semibold tracking-wider text-rose-400">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          HTTP 404 · PORTAL UNRESOLVED
        </div>

        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Portal Screen Not Found
        </h1>

        <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
          This portal route has been moved or requires elevated campus authorization.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-[14px] font-semibold text-white shadow-lg transition hover:bg-indigo-500 sm:w-auto"
          >
            <LayoutDashboard className="h-4 w-4" />
            Portal Gateway
          </Link>

          <Link
            href="/auth/login"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-[14px] font-medium text-slate-300 transition hover:bg-white/10 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
