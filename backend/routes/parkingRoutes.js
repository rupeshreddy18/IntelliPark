const express = require("express");
const router = express.Router();
const {
  getSlots,
  getSlot,
  createSlot,
  updateSlot,
  deleteSlot,
} = require("../controllers/parkingController");
const protect = require("../middleware/auth");
const admin = require("../middleware/admin");
const { validate, validateObjectId } = require("../middleware/validate");

/**
 * Parking Routes
 *
 * GET    /api/parking      — List all slots (any user)
 * GET    /api/parking/:id  — Get single slot (any user)
 * POST   /api/parking      — Create slot (admin)
 * PUT    /api/parking/:id  — Update slot (admin)
 * DELETE /api/parking/:id  — Delete slot (admin)
 */

router.get("/", getSlots);
router.get("/:id", validateObjectId("id"), getSlot);
router.post("/", protect, admin, validate(["slotNumber", "zone"]), createSlot);
router.put("/:id", protect, admin, validateObjectId("id"), updateSlot);
router.delete("/:id", protect, admin, validateObjectId("id"), deleteSlot);

module.exports = router;
