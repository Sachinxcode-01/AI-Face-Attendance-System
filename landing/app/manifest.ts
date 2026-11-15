import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmartFace — Touchless Biometric Attendance",
    short_name: "SmartFace",
    description:
      "Enterprise biometric attendance verification and campus security platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#050507",
    theme_color: "#050507",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
