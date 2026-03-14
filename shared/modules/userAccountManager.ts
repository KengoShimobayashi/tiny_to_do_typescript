import type { UserAccount } from "../types/UserAccount.ts";
import {
  ErrInvalidUserIdFormat,
  ErrUserAlreadyExists,
} from "../types/UserAccountErrors.ts";

// ユーザーアカウントの有効期限は1時間
const UserAccountLimitInMillSec = 60 * 60 * 1000;

const userAccounts = new Map<string, UserAccount>();

const regexAccountId = new RegExp(`^[A-Za-z0-9_.+@-]{1,32}$`);

const createUserAccount = (
  userId: string,
  password: string,
  expires: Date,
): UserAccount => {
  // パスワードをハッシュ化する（ここでは単純な例としてbase64エンコードを使用）
  const hashedPassword = Buffer.from(password).toString("base64");

  return {
    id: userId,
    hashedPassword: hashedPassword,
    expires: expires,
    todoList: [],
  };
};

export const newUserAccount = ({
  userId,
  password,
}: {
  userId: string;
  password: string;
}): UserAccount => {
  // 無効なuserIdなら
  if (!regexAccountId.test(userId)) throw ErrInvalidUserIdFormat;

  // すでに存在するuserIdなら
  if (userAccounts.has(userId)) throw ErrUserAlreadyExists;

  // 有効期限を作成（現時刻から1時間後）
  const expires = new Date(Date.now() + UserAccountLimitInMillSec);

  // ユーザーアカウントを作成
  const userAccount = createUserAccount(userId, password, expires);

  // ユーザーアカウントを保存
  userAccounts.set(userId, userAccount);
  console.log(`user account created : ${userId}`);

  return userAccount;
};
