const express = require("express");
const usersRouter = require("./routes/users");

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/users", usersRouter);
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => {
    console.log(`sample app listening on http://localhost:${port}`);
  });
}

module.exports = { createApp };
