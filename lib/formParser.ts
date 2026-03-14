import http from "http";

export const parseFormData = (
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
