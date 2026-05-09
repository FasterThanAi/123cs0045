const { Log } = require("../../../logging_middleware");

function normalizeDepot(depot) {
  return {
    id: depot.ID,
    mechanicHours: Number(depot.MechanicHours)
  };
}

function normalizeVehicle(vehicle) {
  return {
    taskId: vehicle.TaskID,
    duration: Number(vehicle.Duration),
    impact: Number(vehicle.Impact)
  };
}

function validateInput(depots, vehicles) {
  if (!Array.isArray(depots)) {
    return { valid: false, message: "depots must be an array" };
  }

  if (!Array.isArray(vehicles)) {
    return { valid: false, message: "vehicles must be an array" };
  }

  return { valid: true };
}

function solveKnapsack(tasks, capacity) {
  const n = tasks.length;

  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const currentTask = tasks[i - 1];

    for (let hours = 0; hours <= capacity; hours++) {
      dp[i][hours] = dp[i - 1][hours];

      if (currentTask.duration <= hours) {
        const takeImpact = currentTask.impact + dp[i - 1][hours - currentTask.duration];

        if (takeImpact > dp[i][hours]) {
          dp[i][hours] = takeImpact;
        }
      }
    }
  }

  const selectedTasks = [];
  let remainingCapacity = capacity;

  for (let i = n; i > 0; i--) {
    if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
      const chosenTask = tasks[i - 1];

      selectedTasks.push(chosenTask);
      remainingCapacity -= chosenTask.duration;
    }
  }

  selectedTasks.reverse();

  const totalDuration = selectedTasks.reduce((sum, task) => sum + task.duration, 0);
  const totalImpact = selectedTasks.reduce((sum, task) => sum + task.impact, 0);

  return {
    selectedTasks,
    totalDuration,
    totalImpact,
    unusedHours: capacity - totalDuration
  };
}

function buildMaintenanceSchedule(depots, vehicles) {
  const validation = validateInput(depots, vehicles);

  if (!validation.valid) {
    const error = new Error(validation.message);
    error.statusCode = 400;
    throw error;
  }

  const normalizedDepots = depots.map(normalizeDepot);
  const normalizedVehicles = vehicles.map(normalizeVehicle);

  const validTasks = normalizedVehicles.filter((vehicle) => {
    return (
      vehicle.taskId &&
      Number.isInteger(vehicle.duration) &&
      Number.isInteger(vehicle.impact) &&
      vehicle.duration > 0 &&
      vehicle.impact >= 0
    );
  });

  const schedules = normalizedDepots.map((depot) => {
    const result = solveKnapsack(validTasks, depot.mechanicHours);

    return {
      depotId: depot.id,
      mechanicHours: depot.mechanicHours,
      usedHours: result.totalDuration,
      unusedHours: result.unusedHours,
      totalImpact: result.totalImpact,
      selectedTaskCount: result.selectedTasks.length,
      selectedTasks: result.selectedTasks.map((task) => ({
        taskId: task.taskId,
        duration: task.duration,
        impact: task.impact
      }))
    };
  });

  const totalImpact = schedules.reduce((sum, depot) => sum + depot.totalImpact, 0);
  const totalUsedHours = schedules.reduce((sum, depot) => sum + depot.usedHours, 0);

  return {
    summary: {
      depotCount: schedules.length,
      availableTaskCount: validTasks.length,
      totalImpact,
      totalUsedHours
    },
    schedules
  };
}

module.exports = {
  buildMaintenanceSchedule,
  solveKnapsack
};