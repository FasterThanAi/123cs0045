require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { getTopPriorityNotifications } = require("./priorityNotifications");
const { Log } = require("../logging_middleware");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 9000;
const BASE_API_URL = process.env.BASE_API_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

async function fetchNotifications() {
  if (!BASE_API_URL) {
    await Log("backend", "fatal", "config", "base api url missing");
    throw new Error("BASE_API_URL is missing");
  }

  if (!ACCESS_TOKEN) {
    await Log("backend", "fatal", "auth", "access token missing");
    throw new Error("ACCESS_TOKEN is missing");
  }

  await Log("backend", "info", "api", "fetch notifications request started");

  const response = await fetch(`${BASE_API_URL}/notifications`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`
    }
  });

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    await Log("backend", "error", "api", `notification api failed with status ${response.status}`);
    throw new Error(
      data && data.message
        ? data.message
        : `Notification API failed with status ${response.status}`
    );
  }

  await Log("backend", "info", "api", "notifications fetched successfully");

  return Array.isArray(data.notifications) ? data.notifications : [];
}

app.get("/", async (req, res) => {
  await Log("backend", "info", "route", "notification service health route accessed");

  res.status(200).json({
    success: true,
    message: "Notification priority service is running"
  });
});

app.get("/api/notifications", async (req, res) => {
  try {
    await Log("backend", "info", "route", "raw notifications route accessed");

    const notifications = await fetchNotifications();

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    await Log("backend", "error", "handler", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get("/api/priority-notifications", async (req, res) => {
  try {
    await Log("backend", "info", "route", "priority notifications route accessed");

    const limit = Number(req.query.limit) || 10;
    const notifications = await fetchNotifications();
    const topNotifications = getTopPriorityNotifications(notifications, limit);

    res.status(200).json({
      success: true,
      count: topNotifications.length,
      notifications: topNotifications
    });
  } catch (error) {
    await Log("backend", "error", "handler", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.use(async (req, res) => {
  await Log("backend", "warn", "route", `route not found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.listen(PORT, async () => {
  await Log("backend", "info", "config", `notification service started on port ${PORT}`);
});