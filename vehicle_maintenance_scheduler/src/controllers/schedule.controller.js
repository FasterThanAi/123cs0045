const { Log } = require("../../../logging_middleware");
const {
  fetchDepots,
  fetchVehicles
} = require("../services/externalApi.service");

const {
  buildMaintenanceSchedule
} = require("../services/scheduler.service");

async function getRawDepots(req, res) {
  await Log("backend", "info", "controller", "fetch raw depots controller started");

  const depots = await fetchDepots();

  await Log("backend", "info", "controller", "raw depots fetched successfully");

  res.status(200).json({
    success: true,
    count: depots.length,
    depots
  });
}

async function getRawVehicles(req, res) {
  await Log("backend", "info", "controller", "fetch raw vehicles controller started");

  const vehicles = await fetchVehicles();

  await Log("backend", "info", "controller", "raw vehicles fetched successfully");

  res.status(200).json({
    success: true,
    count: vehicles.length,
    vehicles
  });
}

async function getOptimizedSchedule(req, res) {
  await Log("backend", "info", "controller", "schedule generation started");

  const depots = await fetchDepots();
  const vehicles = await fetchVehicles();

  await Log("backend", "info", "service", "depot and vehicle data received");

  const result = buildMaintenanceSchedule(depots, vehicles);

  await Log("backend", "info", "controller", "schedule generation completed");

  res.status(200).json({
    success: true,
    message: "Optimized maintenance schedule generated successfully",
    ...result
  });
}

module.exports = {
  getOptimizedSchedule,
  getRawDepots,
  getRawVehicles
};