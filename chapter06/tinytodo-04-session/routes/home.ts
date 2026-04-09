import fs from "fs/promises";
import http from "http";

export const handleRoot = async (res: http.ServerResponse) => {
  try {
    const data = await fs.readFile("./pages/index.html", "utf-8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
};
