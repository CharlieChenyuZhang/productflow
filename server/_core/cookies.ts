import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isLocalRequest(req: Request) {
  const hostname = req.hostname || "";
  if (!hostname) return true; // Treat missing hostname as local (test environment)
  return LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const isLocal = isLocalRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // Use "lax" for same-site auth cookies (standard for OAuth flows).
    // "none" requires Secure and is only needed for cross-site cookies.
    sameSite: "lax",
    // Always true in production (behind HTTPS proxy), false only for local dev
    secure: !isLocal,
  };
}
