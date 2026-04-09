import fs from "fs/promises";
import http from "http";
import { ensureSession } from "../../externals/session/session.ts";

// ToDoリストのサンプルデータ
const todoList = new Map<string, { task: string; completed: boolean }[]>();
// [
//   { task: "Buy groceries", completed: false },
//   { task: "Learn TypeScript", completed: true },
//   { task: "Build a web server", completed: false },
// ];

const createTodoListDom = (todos: { task: string; completed: boolean }[]) => {
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

const createTodoList = (sessionId: string) => {
  const todoList = getTodoList(sessionId);
  return createTodoListDom(todoList);
};

const getTodoList = (sessionId: string) => {
  return todoList.get(sessionId) || [];
};

const redirectToTodo = (res: http.ServerResponse) => {
  res.writeHead(303, { Location: "/todo" });
  res.end();
};

const parseFormData = (
  req: http.IncomingMessage,
): Promise<Record<string, string>> => {
  return new Promise((resolve, reject) => {
    let body = "";

    // データを受信するたびに呼ばれる
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    // すべてのデータを受信し終わったら呼ばれる
    req.on("end", () => {
      try {
        // application/x-www-form-urlencoded形式をパース
        const params = new URLSearchParams(body);
        const formData: Record<string, string> = {};

        params.forEach((value, key) => {
          formData[key] = value;
        });

        resolve(formData);
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
};

export const handleTodo = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  try {
    const sessionId = ensureSession(req, res);

    if (!sessionId) {
      throw new Error("Failed to create session");
    }

    // ① HTMLを文字列で読む
    let html = await fs.readFile("./pages/todo/index.html", "utf-8");

    // ② 書き換える
    html = html.replace("{{todoItems}}", createTodoList(sessionId));

    // ③ 返す
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
};

export const handleAdd = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  try {
    const sessionId = ensureSession(req, res);

    if (!sessionId) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
      return;
    }

    const formData = await parseFormData(req);
    const todos = getTodoList(sessionId);

    todos.push({
      task: formData.todo ?? "Untitled Task",
      completed: false,
    });

    todoList.set(sessionId, todos);

    redirectToTodo(res);
  } catch (error) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Bad Request");
  }
};
