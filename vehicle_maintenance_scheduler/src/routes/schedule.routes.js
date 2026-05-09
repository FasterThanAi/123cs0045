const express = require("express");

const {
  getOptimizedSchedule,
  getRawDepots,
  getRawVehicles
} = require("../controllers/schedule.controller");

const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/schedule", asyncHandler(getOptimizedSchedule));
router.get("/depots", asyncHandler(getRawDepots));
router.get("/vehicles", asyncHandler(getRawVehicles));

module.exports = router;