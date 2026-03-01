import fs from "fs";
import http from "http";
import path from "path";

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (url === "/" && method === "GET") {
    const filePath = path.join("static", "hello.html");
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  }
});

server.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
