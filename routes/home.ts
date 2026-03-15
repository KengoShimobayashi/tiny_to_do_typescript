import http from "http";

const redirectToLogin = (res: http.ServerResponse) => {
  res.writeHead(303, { Location: "/login" });
  res.end();
};

export const handleRoot = (res: http.ServerResponse) => {
  redirectToLogin(res);
};
