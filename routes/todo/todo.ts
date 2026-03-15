import fs from "fs/promises";
import http from "http";
import { ensureSession } from "../../externals/session/_session.ts";
import { parseFormData } from "../../lib/formParser.ts";
import { checkSession } from "../../shared/modules/httpSessionManager.ts";
import type { httpSession } from "../../shared/types/httpSession.ts";

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

const isAuthenticated = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  session: httpSession,
) => {
  if (session.UserAccount) {
    return true;
  }

  console.log(`not authenticated ${session.sessionId}`);

  session.PageDate = {
    ErrorMessage: "未ログインです。",
  };

  res.writeHead(303, { Location: "/login" });
  res.end();
  return false;
};

export const handleTodo = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  try {
    console.log(`handle todo : ${req.method} ${req.url}`);
    const session = checkSession(req, res);

    console.log(`session check passed : ${session.sessionId}`);
    if (!isAuthenticated(req, res, session)) {
      console.log(`authentication failed : ${session.sessionId}`);
      res.end();
      return;
    }

    console.log(`show todo page : ${session.sessionId}`);

    // ① HTMLを文字列で読む
    let html = await fs.readFile("./pages/todo/index.html", "utf-8");

    // ② 書き換える
    html = html.replace("{{todoItems}}", createTodoList(session.sessionId));
    html = html.replace("{{userId}}", session.UserAccount?.id || "");
    html = html.replace(
      "{{expires}}",
      session.UserAccount?.expires.toString() || "",
    );

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
