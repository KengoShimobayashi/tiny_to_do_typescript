import type { UserAccount } from "./UserAccount.ts";

export type httpSession = {
  // セッションID
  sessionId: string;

  // セッションの有効期限
  Expires: Date;

  // セッションの有効時間（ミリ秒）
  ValidityTime: number;

  // セッションに保存するデータ
  PageDate: any;

  // セッションに保存するユーザーアカウント
  UserAccount?: UserAccount;

  // セキュアなCookieを使用するかどうか
  useSecureCookie: boolean;
};
