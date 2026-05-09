require("dotenv").config();

const app = require("./app");
const { Log } = require("../../logging_middleware");

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await Log("backend", "info", "config", `server started on port ${PORT}`);
});