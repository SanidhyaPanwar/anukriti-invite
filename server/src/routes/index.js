// src/routes/index.js
const express = require("express");
const guestRoutes = require("./GuestRoutes");
const eventRoutes = require("./EventRoutes");
const adminRoutes = require('./AdminRoutes');

const router = express.Router();

router.use("/api", guestRoutes);
router.use("/api", eventRoutes);
router.use("/api/admin", adminRoutes);

module.exports = router;
