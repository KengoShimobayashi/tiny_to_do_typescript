import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Tiny ToDo server!');
});

server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});