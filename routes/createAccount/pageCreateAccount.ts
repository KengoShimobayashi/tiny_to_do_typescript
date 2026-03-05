import http from "http";
import fs from "fs/promises";

export const showCreateAccountPage = async (
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

export const handleCreateUserAccount = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  const method = req.method;

  switch (method) {
    case "GET":
      showCreateAccountPage(req, res);
      break;

    default:
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
  }
};
