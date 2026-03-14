import fs from "fs/promises";
import http from "http";
import { parseFormData } from "../../lib/formParser.ts";
import {
  ensureSession,
  revokeSession,
  startSession,
} from "../../shared/modules/httpSessionManager.ts";
import { authenticate } from "../../shared/modules/userAccountManager.ts";
import type { httpSession } from "../../shared/types/httpSession.ts";
import { ErrAccountExpired } from "../../shared/types/UserAccountErrors.ts";

const showLogin = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  session: httpSession,
) => {
  try {
    if (!session.sessionId) {
      throw new Error("Failed to create session");
    }

    // HTMLを文字列で読む
    let html = await fs.readFile("./pages/login/index.html", "utf-8");

    // 返す
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
};

const saveUserIdToCookie = (
  res: http.ServerResponse,
  account: { id: string; expires: Date },
) => {
  const cookie = `tinyToDoUserId=${account.id};HttpOnly;Secure;Expires=${new Date(Date.now() + 60 * 60 * 1000)};Path=/;`;
  res.setHeader("Set-Cookie", cookie);
};

const login = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  session: httpSession,
) => {
  const formData = await parseFormData(req);
  const userId = formData.userId ?? "";
  const password = formData.password ?? "";

  revokeSession(res, session.sessionId);
  const newSession = startSession(res);

  try {
    console.log(`login attempt : ${userId}`);
    const account = authenticate(userId, password);
    newSession.UserAccount = account;
    saveUserIdToCookie(res, account);

    console.log(`login success : ${userId}`);
    res.writeHead(303, { Location: "/todo" });
    res.end();
    return;
  } catch (err: any) {
    if (err === ErrAccountExpired) {
      console.log(`account expired : ${userId}`);
      newSession.PageDate = {
        errorMessage:
          "アカウントの有効期限が切れています。新しいアカウントを作成してください。",
      };
    } else {
      console.log(`login failed : ${userId}`);
      newSession.PageDate = {
        errorMessage: "ユーザーIDまたはパスワードが正しくありません。",
      };
    }

    res.writeHead(303, { Location: "/login" });
    res.end();
    return;
  }
};

export const handleLogin = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  const method = req.method;
  const session = ensureSession(req, res);

  switch (method) {
    case "GET":
      showLogin(req, res, session);
      break;

    case "POST":
      login(req, res, session);
      break;

    default:
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
  }
};
