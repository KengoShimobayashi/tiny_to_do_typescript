export type HttpSessionManager = {
  sessions: Map<string, httpSession>;
};
import crypto from "crypto";
import http from "http";
import type { httpSession } from "../../shared/types/httpSession.ts";
import {
  ErrInvalidSessionId,
  ErrSessionExpired,
  ErrSessionNotFound,
} from "../types/SessionErrors.ts";

const cookieSessionId = "sessionId";

const sessionValidityTime = 30 * 60 * 1000; // 30 minutes in milliseconds

const sessions: Map<string, httpSession> = new Map();

const makeSessionId = (): string => {
  return crypto.randomBytes(32).toString("base64url");
};

const parseCookies = (
  cookieHeader: string | undefined,
): Record<string, string> => {
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};

  cookieHeader.split(";").forEach((cookie) => {
    const [key, value] = cookie.trim().split("=");
    // まだ存在しない場合のみ設定（最初の値を優先）
    if (key && value && !cookies[key]) {
      cookies[key] = value;
    }
  });

  return cookies;
};

const getSession = (sessionId: string): httpSession => {
  console.log(sessionId, sessions);

  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;

    // セッションの有効期限をチェック
    if (session.Expires > new Date()) {
      return session;
    } else {
      // セッションが期限切れの場合は削除
      sessions.delete(sessionId);
      throw ErrSessionExpired;
    }
  } else {
    throw ErrSessionNotFound;
  }
};

const getValidSession = (req: http.IncomingMessage): httpSession => {
  console.log(`getValidSession`);

  const cookies = req.headers.cookie;

  // cookieがなければ
  if (!cookies) throw ErrSessionNotFound;

  // cookieからsessionIdを取得
  const sessionId = parseCookies(cookies)[cookieSessionId];

  // sessionIdがなければ
  if (!sessionId) throw ErrInvalidSessionId;

  try {
    console.log(`succedd valid session`);
    return getSession(sessionId);
  } catch (err: any) {
    console.log(`failed valid sesion : ${err}`);
    throw ErrSessionNotFound;
  }
};

const extendSession = (session: httpSession) => {
  session.Expires = new Date(Date.now() + session.ValidityTime);
};

const NewHttpSession = (sessionId: string): httpSession => {
  const session = {
    sessionId: sessionId,
    ValidityTime: sessionValidityTime,
    useSecureCookie: true, // セキュアなクッキーを使用するかどうか
    PageDate: undefined,
    Expires: new Date(Date.now() + sessionValidityTime),
  };

  extendSession(session);

  return session;
};

const newSession = (sessionId: string): httpSession => {
  console.log(`start session : ${sessionId}`);
  const session = NewHttpSession(sessionId);
  sessions.set(sessionId, session);
  return session;
};

const setCookie = (res: http.ServerResponse, session: httpSession) => {
  // 既存のSet-Cookieヘッダーを削除してから新しいセッションIDを設定
  res.removeHeader("Set-Cookie");

  // 新しいセッションIDを設定
  const cookie = `${cookieSessionId}=${session.sessionId};HttpOnly;${session.useSecureCookie ? "Secure;" : ""}Expires=${session.Expires.toUTCString()};Path=/;`;

  res.setHeader("Set-Cookie", cookie);
};

/**
 * sessionを確保する。セッションが存在しない場合は新しいセッションを開始する。
 * @param req リクエストオブジェクト
 * @param res レスポンスオブジェクト
 * @returns httpSessionオブジェクト
 */
export const ensureSession = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  try {
    const session = getValidSession(req);
    extendSession(session);
    setCookie(res, session);
    return session;
  } catch (err: any) {
    console.log(`session check failed : ${err}`);
    const { session, cookie } = startSession();
    res.setHeader("Set-Cookie", cookie);
    return session;
  }
};

export const startSession = (): { session: httpSession; cookie: string } => {
  let sessionId: string;
  while (true) {
    sessionId = makeSessionId();
    if (!sessions.has(sessionId)) {
      break;
    }
  }

  const session = newSession(sessionId);
  const cookie = `${cookieSessionId}=${session.sessionId};HttpOnly;Secure;Expires=${session.Expires.toUTCString()};Path=/;`;

  sessions.set(sessionId, session);

  console.log(sessions);

  return { session, cookie };
};

export const checkSession = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
): httpSession => {
  console.log(`check session : ${req.method} ${req.url}`);
  let session = getValidSession(req);

  console.log(`after valid session`);
  if (session) {
    console.log(`session check passed : ${session.sessionId}`);
    extendSession(session);
    setCookie(res, session);
    return session;
  }

  const { session: newSession, cookie } = startSession();
  res.setHeader("Set-Cookie", cookie);

  const refer = req.headers.referer ?? "";
  if (refer === "") {
    newSession.PageDate = {
      errorMessage:
        "セッションの開始に失敗しました。リクエストのリファラーが不明です。",
    };
  }

  console.log(`redirect to login`);
  res.writeHead(303, { Location: "/login" });
  res.end();
  return newSession;
};

export const revokeSession = (sessionId: string): string => {
  sessions.delete(sessionId);
  console.log(`session revoked : ${sessionId}`);
  console.log(sessions);

  // 削除用のCookie文字列を返す（値は空、Max-Ageは0）
  return `${cookieSessionId}=;HttpOnly;Secure;Max-Age=0;Path=/;`;
};
