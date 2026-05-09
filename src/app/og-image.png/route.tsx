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
            "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0ea5e9 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, opacity: 0.95 }}>
          Wow3D Printing Times
        </div>
        <div style={{ marginTop: 20, fontSize: 64, fontWeight: 800, lineHeight: 1.2 }}>
          3D Printing Technology
          <br />
          Intelligence Media
        </div>
        <div style={{ marginTop: 28, fontSize: 30, opacity: 0.92 }}>
          wow3dprinting.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
