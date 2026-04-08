import fs from "fs/promises";
import http from "http";

// ToDoリストのサンプルデータ
const todoList = [
  { id: 1, task: "Buy groceries", completed: false },
  { id: 2, task: "Learn TypeScript", completed: true },
  { id: 3, task: "Build a web server", completed: false },
];

const handleRoot = async (res: http.ServerResponse) => {
  try {
    const data = await fs.readFile("static/hello.html", "utf-8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
};

const handleTodo = async (res: http.ServerResponse) => {
  try {
    // ① HTMLを文字列で読む
    let html = await fs.readFile("./templates/todo.html", "utf-8");

    // ② 書き換える
    html = html.replace("{{todoItems}}", createTodoList(todoList));

    // ③ 返す
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
};

const createTodoList = (
  todos: { id: number; task: string; completed: boolean }[],
) => {
  return todos
    .map(
      (todo) => `
    <li class="todo-item">
      <div class="todo-item-left">
        <input type="checkbox" ${todo.completed ? "checked" : ""} />
        <label>${todo.task}</label>
      </div>
    </li>
  `,
    )
    .join("");
};

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
    await handleTodo(res);
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
