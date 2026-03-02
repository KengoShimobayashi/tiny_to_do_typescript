import fs from "fs/promises";
import http from "http";

// ToDoリストのサンプルデータ
const todoList = [
  { task: "Buy groceries", completed: false },
  { task: "Learn TypeScript", completed: true },
  { task: "Build a web server", completed: false },
];

const createTodoList = (todos: { task: string; completed: boolean }[]) => {
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

export const handleTodo = async (res: http.ServerResponse) => {
  try {
    // ① HTMLを文字列で読む
    let html = await fs.readFile("./pages/todo/index.html", "utf-8");

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

export const handleAdd = async (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => {
  try {
    const formData = await parseFormData(req);

    todoList.push({
      task: formData.todo ?? "Untitled Task",
      completed: false,
    });

    redirectToTodo(res);
  } catch (error) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Bad Request");
  }
};
