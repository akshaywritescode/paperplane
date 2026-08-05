import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Paperplane — Where API Takes Flight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff7ed 0%, #fff 50%, #fff7ed 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "rgba(234, 88, 12, 0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(234, 88, 12, 0.06)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Logo + wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
            {/* Simple plane icon as fallback since we can't load external images easily */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: "#ea580c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
              }}
            >
              ✈
            </div>
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-1px",
              }}
            >
              Paperplane
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: 32,
              color: "#ea580c",
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Where API Takes Flight
          </p>

          {/* Description */}
          <p
            style={{
              fontSize: 20,
              color: "#64748b",
              marginTop: 20,
              maxWidth: 700,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Compose requests, inspect responses, and organize API workflows in
            a calm workspace built for modern teams.
          </p>

          {/* CTA pill */}
          <div
            style={{
              marginTop: 40,
              background: "#ea580c",
              color: "#fff",
              borderRadius: 999,
              padding: "12px 32px",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            Start testing for free →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
