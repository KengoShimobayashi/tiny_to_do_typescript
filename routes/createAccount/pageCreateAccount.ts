import fs from "fs/promises";
import http from "http";
import { parseFormData } from "../../lib/formParser.ts";
import { generatePassword } from "../../lib/passwordGenerator.ts";
import { checkSession } from "../../shared/modules/httpSessionManager.ts";
import { newUserAccount } from "../../shared/modules/userAccountManager.ts";
import type { NewUserAccountPageData } from "../../shared/types/NewUserAccountPageData.ts";
import type { UserAccount } from "../../shared/types/UserAccount.ts";
import {
  ErrInvalidUserIdFormat,
  ErrUserAlreadyExists,
} from "../../shared/types/UserAccountErrors.ts";

const cookieNameUserId = "tinyToDoUserId";

const showCreateAccountPage = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  try {
    // HTMLを文字列で読む
    let html = await fs.readFile("./pages/createAccount/index.html", "utf-8");

    // 返す
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
};

const createNewAccoutPageData = (
  userAccount: UserAccount,
): NewUserAccountPageData => {
  return {
    userId: userAccount.id,
    password: userAccount.hashedPassword,
    expires: userAccount.expires.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
};

const saveUserIdToCookie = (
  res: http.ServerResponse,
  userAccount: UserAccount,
) => {
  const cookie = `${cookieNameUserId}=${userAccount.id};HttpOnly;Secure;Expires=${userAccount.expires};Path=/;`;
  res.setHeader("Set-Cookie", cookie);
};

const createNewUserAccount = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  const session = checkSession(req, res);
  const formData = await parseFormData(req);
  const userId = formData.userId ?? "";

  try {
    const userAccount = newUserAccount({
      userId: userId,
      password: generatePassword(),
    });

    // ユーザーアカウントの作成に成功した場合
    session.PageDate = createNewAccoutPageData(userAccount);
    saveUserIdToCookie(res, userAccount);
    res.writeHead(303, { Location: "/new-user-account" });
    res.end();
  } catch (err: any) {
    // ユーザーアカウントの作成に失敗した場合（無効なuserIdやすでに存在するuserIdなど）
    console.error(
      `Failed to create user account : userId=${userId}, error=${err}`,
    );

    if (err === ErrUserAlreadyExists) {
      session.PageDate = {
        errorMessage:
          "ユーザーIDはすでに存在しています。別のユーザーIDを使用してください。",
      };
    } else if (err === ErrInvalidUserIdFormat) {
      session.PageDate = {
        errorMessage: "ユーザIDの形式が違います。",
      };
    } else {
      session.PageDate = {
        errorMessage: err.message,
      };
    }
    res.writeHead(303, { Location: "/create-user-account" });
    res.end();
  }
};

export const handleCreateUserAccount = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  const method = req.method;

  switch (method) {
    case "GET":
      showCreateAccountPage(req, res);
      break;

    // POSTリクエスト:ユーザ作成処理
    case "POST":
      createNewUserAccount(req, res);
      return;

    default:
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
  }
};
