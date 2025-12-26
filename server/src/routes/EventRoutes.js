// src/routes/eventRoutes.js
const express = require("express");
const router = express.Router();
const { listEvents, createEvent } = require("../controllers/EventController");

// Public: list events
router.get("/events", listEvents);

// Admin: create event
router.post("/events", createEvent);

module.exports = router;
