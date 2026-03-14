import fs from "fs/promises";
import http from "http";
import { ensureSession } from "../../shared/modules/httpSessionManager.ts";
import type { httpSession } from "../../shared/types/httpSession.ts";

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

    default:
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
  }
};
