// src/controllers/eventController.js
const Event = require("../models/Event");

// GET /api/events
async function listEvents(req, res) {
  try {
    const events = await Event.find().sort({ date: 1 }).lean();
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

// POST /api/events  (admin: create one event)
async function createEvent(req, res) {
  try {
    const { title, date, time, venue, description } = req.body;

    if (!title || !date || !time || !venue) {
      return res
        .status(400)
        .json({ message: "title, date, time, and venue are required" });
    }

    const event = new Event({
      title,
      date,
      time,
      venue,
      description,
    });

    await event.save();

    res.status(201).json(event);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

module.exports = {
  listEvents,
  createEvent,
};
