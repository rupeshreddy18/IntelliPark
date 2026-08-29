const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateMe,
} = require("../controllers/authController");
const protect = require("../middleware/auth");
const { validate } = require("../middleware/validate");

/**
 * Auth Routes
 *
 * POST /api/users/register — Register new user (public)
 * POST /api/users/login    — Login (public)
 * POST /api/users/logout   — Logout (public)
 * GET  /api/users/me       — Get current user (protected)
 * PUT  /api/users/me       — Update profile (protected)
 */

router.post("/register", validate(["name", "email", "password"]), register);
router.post("/login", validate(["email", "password"]), login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

module.exports = router;
