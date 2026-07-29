import { NextRequest, NextResponse } from "next/server";
import { isRouteProtected, validateApiKey, extractApiKey } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Generate tracing headers ─────────────────────────────────────────
  const requestId = crypto.randomUUID();
  const correlationId = request.headers.get("x-correlation-id");

  // Clone the response so we can set headers later
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  if (correlationId) {
    response.headers.set("x-correlation-id", correlationId);
  }

  // ── Auth check (only for protected routes) ────────────────────────────
  if (isRouteProtected(pathname)) {
    const apiKey = extractApiKey(request.headers);

    if (!apiKey || !validateApiKey(apiKey)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Valid API key required. Provide it via Authorization: Bearer <key> or x-api-key header.",
        },
        {
          status: 401,
          headers: {
            "x-request-id": requestId,
            ...(correlationId ? { "x-correlation-id": correlationId } : {}),
          },
        }
      );
    }
  }

  return response;
}

// ── Matcher: run on all /api/* routes ────────────────────────────────────
export const config = {
  matcher: "/api/:path*",
};
