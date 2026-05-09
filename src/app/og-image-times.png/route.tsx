import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background:
            "linear-gradient(135deg, #111827 0%, #1f2937 45%, #0f766e 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, opacity: 0.95 }}>
          3D Printing Times
        </div>
        <div style={{ marginTop: 20, fontSize: 62, fontWeight: 800, lineHeight: 1.2 }}>
          AI, 3D Printing
          <br />
          and Robotics Intelligence
        </div>
        <div style={{ marginTop: 28, fontSize: 30, opacity: 0.92 }}>
          wow3dprinting.co.kr
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
