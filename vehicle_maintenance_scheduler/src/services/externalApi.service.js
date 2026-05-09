const { Log } = require("../../../logging_middleware");

function getAuthHeaders() {
  const accessToken = process.env.ACCESS_TOKEN;

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };
}

async function fetchFromProtectedApi(path) {
  const baseUrl = process.env.BASE_API_URL;

  if (!baseUrl) {
    await Log("backend", "fatal", "config", "base api url missing");
    const error = new Error("Base API URL is missing");
    error.statusCode = 500;
    throw error;
  }

  if (!process.env.ACCESS_TOKEN) {
    await Log("backend", "fatal", "auth", "access token missing");
    const error = new Error("Access token is missing");
    error.statusCode = 500;
    throw error;
  }

  const url = `${baseUrl}${path}`;

  await Log("backend", "info", "api", `external api request started for ${path}`);

  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders()
  });

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    await Log("backend", "error", "api", `external api failed for ${path}`);

    const error = new Error("Failed to fetch required data from external API");
    error.statusCode = response.status;
    throw error;
  }

  await Log("backend", "info", "api", `external api request completed for ${path}`);

  return data;
}

async function fetchDepots() {
  const data = await fetchFromProtectedApi("/depots");

  if (!data || !Array.isArray(data.depots)) {
    await Log("backend", "error", "service", "invalid depots response format");
    const error = new Error("Invalid depots response format");
    error.statusCode = 502;
    throw error;
  }

  return data.depots;
}

async function fetchVehicles() {
  const data = await fetchFromProtectedApi("/vehicles");

  if (!data || !Array.isArray(data.vehicles)) {
    await Log("backend", "error", "service", "invalid vehicles response format");
    const error = new Error("Invalid vehicles response format");
    error.statusCode = 502;
    throw error;
  }

  return data.vehicles;
}

module.exports = {
  fetchDepots,
  fetchVehicles
};