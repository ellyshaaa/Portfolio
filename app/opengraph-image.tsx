import { ImageResponse } from "next/og";

export const alt = "Ellysha Fatima — AI Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAF7F2",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: "#1E9E6A" }} />
          <div style={{ fontSize: 24, color: "#5C5347" }}>Open to AI engineering roles</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, color: "#171410", lineHeight: 1.1, letterSpacing: -2 }}>
            I build AI systems
          </div>
          <div style={{ display: "flex", fontSize: 76, color: "#171410", lineHeight: 1.1, letterSpacing: -2 }}>
            <span>that people&nbsp;</span>
            <span style={{ background: "#E4572E33", padding: "0 10px" }}>actually use</span>
            <span>.</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 30, color: "#171410" }}>Ellysha Fatima</div>
          <div style={{ display: "flex", gap: 16 }}>
            {["Storybook Studio", "Governance Sandbox", "Solar Tracker"].map((t, i) => (
              <div
                key={t}
                style={{
                  fontSize: 21,
                  color: ["#E4572E", "#2563EB", "#B45309"][i],
                  border: `1px solid ${["#E4572E", "#2563EB", "#B45309"][i]}44`,
                  borderRadius: 999,
                  padding: "8px 20px",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}