// src/routes/guestRoutes.js
const express = require("express");
const router = express.Router();
const {
  createGuest,
  getInviteByCode,
  updateGuest,
  deleteGuest
} = require("../controllers/GuestController");

// Admin: create guest
router.post("/guests", createGuest);

// Public: get invite details by inviteCode
router.get("/invite/:inviteCode", getInviteByCode);

router.patch("/invite/:inviteCode", updateGuest);

router.delete("/invite/:inviteCode", deleteGuest);

module.exports = router;
