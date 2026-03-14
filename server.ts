import fs from "fs/promises";
import http from "http";
import { handleCreateUserAccount } from "./routes/createAccount/pageCreateAccount.ts";
import { handleRoot } from "./routes/home.ts";
import { handleLogin } from "./routes/login/pageLogin.ts";
import { handleAdd, handleTodo } from "./routes/todo/todo.ts";
import { handleNewUserAccount } from "./routes/newUserAccount/pageNewUserAccount.ts";

const getContentType = (filePath: string): string => {
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".js")) return "application/javascript";
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg"))
    return "image/jpeg";
  if (filePath.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
};

const handleStatic = async (res: http.ServerResponse, filePath: string) => {
  try {
    const data = await fs.readFile(filePath);
    const contentType = getContentType(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
};

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  if (url === "/" && method === "GET") {
    await handleRoot(res);
  } else if (url === "/todo" && method === "GET") {
    await handleTodo(req, res);
  } else if (url === "/add" && method === "POST") {
    await handleAdd(req, res);
  } else if (url === "/login") {
    await handleLogin(req, res);
  } else if (url === "/create-user-account") {
    await handleCreateUserAccount(req, res);
  } else if (url === "/new-user-account") {
    await handleNewUserAccount(req, res);
  } else if (url && method === "GET") {
    const filePath = url.substring(1);
    await handleStatic(res, filePath);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
