import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#ea580c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 100,
          color: "#fff",
        }}
      >
        ✈
      </div>
    ),
    { ...size },
  );
}
