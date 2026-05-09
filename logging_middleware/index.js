const allowedStacks = new Set(["backend", "frontend"]);

const allowedLevels = new Set(["debug", "info", "warn", "error", "fatal"]);

const backendPackages = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
  "auth",
  "config",
  "middleware",
  "utils"
]);

const frontendPackages = new Set([
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils"
]);

function validateLogInput(stack, level, packageName, message) {
  if (!allowedStacks.has(stack)) {
    return { valid: false, reason: "invalid stack" };
  }

  if (!allowedLevels.has(level)) {
    return { valid: false, reason: "invalid level" };
  }

  if (stack === "backend" && !backendPackages.has(packageName)) {
    return { valid: false, reason: "invalid backend package" };
  }

  if (stack === "frontend" && !frontendPackages.has(packageName)) {
    return { valid: false, reason: "invalid frontend package" };
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    return { valid: false, reason: "invalid message" };
  }

  return { valid: true };
}

async function Log(stack, level, packageName, message) {
  const validation = validateLogInput(stack, level, packageName, message);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.reason
    };
  }

  const logApiUrl = process.env.LOG_API_URL;
  const accessToken = process.env.ACCESS_TOKEN;

  if (!logApiUrl || !accessToken) {
    return {
      success: false,
      error: "missing log api url or access token"
    };
  }

  try {
    const response = await fetch(logApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        stack,
        level,
        package: packageName,
        message
      })
    });

    let data = null;

    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: "log request failed"
    };
  }
}

module.exports = {
  Log
};