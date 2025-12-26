// src/models/Event.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true }, // e.g. "10 March 2026"
  time: { type: String, required: true }, // e.g. "7:00 PM"
  venue: { type: String, required: true },
  description: { type: String },
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
