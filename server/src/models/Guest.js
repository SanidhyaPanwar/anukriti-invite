// src/models/Guest.js
const mongoose = require("mongoose");
const guestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  inviteCode: { type: String, unique: true, index: true, required: true },
  withFamily: { type: Boolean, default: false },
  familyMembers: [{ 
    name: { type: String, required: true },      // ← CHANGED
    gender: { type: String, enum: ['male', 'female'] }  // ← NEW
  }],
  photos: [{ type: String }],
  phone: String,
  email: String,
  side: { type: String, enum: ["bride", "groom"], default: "groom" },
});

const Guest = mongoose.model("Guest", guestSchema);

module.exports = Guest;
