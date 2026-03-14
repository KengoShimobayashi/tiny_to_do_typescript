import fs from "fs/promises";
import http from "http";
import { checkSession } from "../../shared/modules/httpSessionManager.ts";
import type { NewUserAccountPageData } from "../../shared/types/NewUserAccountPageData.ts";

const createUserIdInput = (userId: string) => {
  return `<input type="text" name="userId" value="${userId}" readonly />`;
};

const createPasswordInput = (password: string) => {
  return `<input type="text" class="monospace" name="password" value="${password}" readonly />`;
};

const createExpiresInput = (expires: string) => {
  return `<input type="text" name="expires" value="${expires}" readonly />`;
};

const showNewUserAccountPage = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pageData: NewUserAccountPageData,
) => {
  try {
    // HTMLを文字列で読む
    let html = await fs.readFile("./pages/newUserAccount/index.html", "utf-8");

    html = html.replace("{{input-userId}}", createUserIdInput(pageData.userId));
    html = html.replace(
      "{{input-password}}",
      createPasswordInput(pageData.password),
    );
    html = html.replace(
      "{{input-expires}}",
      createExpiresInput(pageData.expires),
    );

    // 返す
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
};

export const handleNewUserAccount = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  const method = req.method;

  switch (method) {
    case "GET":
      const session = checkSession(req, res);
      showNewUserAccountPage(req, res, session.PageDate);
      break;

    default:
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
  }
};
