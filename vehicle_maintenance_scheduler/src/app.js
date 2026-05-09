const express = require("express");
const cors = require("cors");

const scheduleRoutes = require("./routes/schedule.routes");
const { Log } = require("../../logging_middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  await Log("backend", "info", "middleware", `${req.method} ${req.originalUrl} request received`);
  next();
});

app.get("/", async (req, res) => {
  await Log("backend", "info", "route", "health route accessed");

  res.status(200).json({
    success: true,
    message: "Vehicle maintenance scheduler service is running"
  });
});

app.use("/api", scheduleRoutes);

app.use(async (req, res) => {
  await Log("backend", "warn", "route", `route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use(async (err, req, res, next) => {
  await Log("backend", "fatal", "handler", err.message || "unexpected server error");

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

module.exports = app;