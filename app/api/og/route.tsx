import { ImageResponse } from "next/og";

/**
 * Dynamic Open Graph card. Renders "vault" plus an optional `?title=` segment.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title")?.toLowerCase();

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "40px",
            fontSize: "24px",
            letterSpacing: "-0.47px",
            backgroundColor: "black",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "24px",
              gap: 12,
            }}
          >
            <div style={{ color: "rgba(255, 255, 255, 0.92)" }}>vault</div>
            {title && (
              <div style={{ color: "rgba(255, 255, 255, 0.39)" }}>/</div>
            )}
            {title && (
              <div style={{ color: "rgba(255, 255, 255, 0.39)" }}>{title}</div>
            )}
          </div>
        </div>
      ),
      { width: 1200, height: 600 },
    );
  } catch {
    return new Response("Failed to generate the image", { status: 500 });
  }
}
