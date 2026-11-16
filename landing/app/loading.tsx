import { ScanFace } from "lucide-react";

export default function Loading() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg0 px-6 font-sans">
      <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative grid h-14 w-14 place-items-center rounded-md border border-white/10 bg-surface shadow-sm">
            <ScanFace className="h-7 w-7 text-accent animate-pulse" strokeWidth={1.8} />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#1ed760] ring-2 ring-bg0" />
          </div>

          <div className="mt-6 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-ping" />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mid">
              Initializing SmartFace Node...
            </p>
          </div>

            <div className="mt-4 h-1 w-48 overflow-hidden rounded-sm bg-white/10">
              <div
                className="h-full w-24 rounded-sm bg-accent animate-[pulse_1.5s_infinite]"
                style={{
                  animation: "LoadingBar_slide 1.5s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
        );
}
