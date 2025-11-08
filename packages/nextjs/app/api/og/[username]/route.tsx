import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#0052FF",
          backgroundImage: "linear-gradient(135deg, #0052FF 0%, #00D4FF 100%)",
          height: "100%",
          width: "100%",
          display: "flex",
          color: "white",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          flexWrap: "nowrap",
          fontFamily: "system-ui, sans-serif",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "32px",
            padding: "60px 80px",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: "bold",
              marginBottom: "20px",
              display: "flex",
            }}
          >
            🚀 RescueDAO Mini App
          </div>
          <div
            style={{
              fontSize: 48,
              marginBottom: "16px",
              display: "flex",
            }}
          >
            Shared by: @{username}
          </div>
          <div
            style={{
              fontSize: 32,
              opacity: 0.9,
              display: "flex",
            }}
          >
            Experience Privacy Onchain with CoFHE
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
