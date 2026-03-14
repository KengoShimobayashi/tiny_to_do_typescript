import crypto from "crypto";
import http from "http";

const cookieSessionId = "sessionId";

const startSession = (res: http.ServerResponse): string => {
  const sessionId = generateSessionId();

  const cookie = `${cookieSessionId}=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`;

  res.setHeader("Set-Cookie", cookie);
  return sessionId;
};

const generateSessionId = (): string => {
  return crypto.randomBytes(32).toString("base64url");
};

const parseCookies = (
  cookieHeader: string | undefined,
): Record<string, string> => {
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};

  cookieHeader.split(";").forEach((cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key && value) {
      cookies[key] = value;
    }
  });

  return cookies;
};

export const ensureSession = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  const cookies = req.headers.cookie;

  if (!cookies) {
    return startSession(res);
  }

  const sessionId = parseCookies(cookies)[cookieSessionId];

  if (sessionId) {
    return sessionId;
  }

  return "";
};
