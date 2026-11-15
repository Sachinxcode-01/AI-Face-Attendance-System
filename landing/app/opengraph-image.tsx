import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SmartFace — Touchless biometric attendance for modern campuses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050507",
          padding: "64px 72px",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-180px",
            left: "50%",
            width: "900px",
            height: "500px",
            transform: "translateX(-50%)",
            background: "radial-gradient(closest-side, rgba(143,139,255,0.28), transparent)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              border: "2px solid #8f8bff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
              color: "#8f8bff",
              background: "rgba(143,139,255,0.08)",
            }}
          >
            ◉
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "30px", fontWeight: 600, color: "#f5f5f8", letterSpacing: "-0.5px" }}>
              SmartFace
            </span>
            <span style={{ fontSize: "15px", color: "#8a8a97", letterSpacing: "3px", textTransform: "uppercase" }}>
              Biometric Attendance
            </span>
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-2px",
              color: "#f5f5f8",
            }}
          >
            Every face. Every gate.
            <br />
            <span style={{ background: "linear-gradient(100deg,#8f8bff,#6fd8ff)", WebkitBackgroundClip: "text", color: "transparent" }}>
              One campus.
            </span>
          </div>
          <div style={{ fontSize: "22px", color: "#b6b6c2", marginTop: "22px" }}>
            Touchless biometric attendance · &lt;300ms verification · 99.8% accuracy
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px", fontSize: "16px" }}>
          {["ArcFace v2.4", "Anti-proxy QR", "Edge-first"].map((chip) => (
            <span
              key={chip}
              style={{
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "999px",
                padding: "10px 18px",
                color: "#b6b6c2",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    },
  );
}
