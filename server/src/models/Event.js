// src/models/Event.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true }, 
  time: { type: String, required: true }, 
  venue: { type: String, required: true },
  description: { type: String },
  locationLink: { type: String, default: 'https://maps.app.goo.gl/KTAxqoj5FYqdvEu69' },
  eventType: { type: String, enum: ['pre-wedding', 'main-wedding'], default: 'pre-wedding' },
  themeColor: { type: String, default: '#8c5ab9' }, // NEW: Hex color code
  dressCode: { type: String },                          // e.g. " Traditional / Pastels"
  colorPalette: [{ type: String }],                     // e.g. ["#8b5cf6", "#D4AF37", "#FAF8F5"]
  guidelines: { type: String },                         // e.g. "Valet parking available at the main gate."
  venuePhotos: [{ type: String }]                       // Array of image URLs for venue mood board / preview
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);