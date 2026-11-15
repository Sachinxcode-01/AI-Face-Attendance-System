import { ScanFace } from "lucide-react";

export default function Loading() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg0 px-6 font-sans">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute inset-0 bg-grid mask-radial opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-accent/30 to-accent/5 shadow-2xl">
          <ScanFace className="h-8 w-8 text-accent animate-pulse" strokeWidth={1.8} />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#1ed760] shadow-[0_0_8px_#1ed760] ring-2 ring-bg0" />
        </div>

        <div className="mt-6 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-ping" />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mid">
            Initializing SmartFace Node...
          </p>
        </div>

        <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-24 rounded-full bg-gradient-to-r from-accent to-[#6a66e8] animate-[pulse_1.5s_infinite]"
            style={{
              animation: "LoadingBar_slide 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
