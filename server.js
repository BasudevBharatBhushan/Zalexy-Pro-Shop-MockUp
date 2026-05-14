const { createServer } = require("http");
const next = require("next");

const app = next({
  dev: false,
  hostname: "0.0.0.0",
  port: process.env.PORT || 10000,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(process.env.PORT || 10000, "0.0.0.0", () => {
      console.log("Server ready");
    });
});