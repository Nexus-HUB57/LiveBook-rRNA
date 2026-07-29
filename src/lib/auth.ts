/**
 * CHIMERA Auth — API key validation & route protection
 *
 * When CHIMERA_API_KEYS is set (comma-separated), incoming requests to
 * protected routes must carry a valid key.  When the env var is absent
 * the system runs in OPEN mode (all requests pass).
 */

// ── Protected route prefixes ──────────────────────────────────────────────

const PROTECTED_ROUTES: string[] = [
  "/api/fable/",
  "/api/vaults/",
  "/api/withdraw/",
  "/api/hd-wallet/",
  "/api/generate-wallet/",
  "/api/mnemonic/",
  "/api/consolidate/",
  "/api/webhook/",
];

// ── Parsed key cache (re-parsed on every call for env hot-reload) ──────────

function loadKeys(): string[] | null {
  const raw = process.env.CHIMERA_API_KEYS;
  if (!raw || raw.trim() === "") return null; // open mode
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

/**
 * Returns the list of protected route prefixes.
 */
export function getProtectedRoutes(): string[] {
  return PROTECTED_ROUTES;
}

/**
 * Returns `true` when the given pathname falls under a protected prefix.
 */
export function isRouteProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Validate an API key.
 *
 * - If CHIMERA_API_KEYS is **not** set → always returns `true` (open mode).
 * - If CHIMERA_API_KEYS **is** set → checks the supplied key against the list.
 */
export function validateApiKey(key: string): boolean {
  const allowed = loadKeys();
  if (allowed === null) return true; // open mode
  return allowed.includes(key);
}

/**
 * Extract the API key from request headers.
 * Checks `Authorization: Bearer <key>` first, then `x-api-key`.
 */
export function extractApiKey(
  headers: Headers
): string | null {
  // 1. Authorization: Bearer <key>
  const auth = headers.get("authorization");
  if (auth) {
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }

  // 2. x-api-key
  const xKey = headers.get("x-api-key");
  if (xKey) return xKey.trim();

  return null;
}