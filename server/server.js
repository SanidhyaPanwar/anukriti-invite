// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  })
);

// Connect to MongoDB
const uri = process.env.MONGODB_URI;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Models
const guestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  inviteCode: { type: String, unique: true, index: true, required: true },
  withFamily: { type: Boolean, default: false },
  familyMembers: [{ type: String }],
  photos: [{ type: String }],
  phone: String,
  email: String,
  rsvpStatus: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
  side: { type: String, enum: ["bride", "groom"], default: "groom" },
  attendees: { type: Number, default: 0 },
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true }, // e.g. "12 Feb 2026"
  time: { type: String, required: true }, // e.g. "7:00 PM"
  venue: { type: String, required: true },
  description: { type: String },
});

const Guest = mongoose.model("Guest", guestSchema);
const Event = mongoose.model("Event", eventSchema);

// Simple health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Wedding invite API is running" });
});

// ROUTES

// Admin: create a single guest (you can also build a bulk import later)
app.post("/api/guests", async (req, res) => {
  try {
    const {
      fullName,
      withFamily,
      familyMembers,
      photos,
      phone,
      email,
      side,
    } = req.body;

    if (!fullName) {
      return res.status(400).json({ message: "fullName is required" });
    }

    // simple unique code generator
    const inviteCode = Math.random().toString(36).substring(2, 10);

    const guest = new Guest({
      fullName,
      inviteCode,
      withFamily: !!withFamily,
      familyMembers: familyMembers || [],
      photos: photos || [],
      phone,
      email,
      side: side || "groom",
    });

    await guest.save();
    res.status(201).json(guest);
  } catch (err) {
    console.error("Error creating guest:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Public: get invite details by inviteCode (used by React InvitePage)
app.get("/api/invite/:inviteCode", async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const guest = await Guest.findOne({ inviteCode }).lean();

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    res.json(guest);
  } catch (err) {
    console.error("Error fetching invite:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Public: update RSVP for an invite (used by RsvpForm)
app.patch("/api/invite/:inviteCode/rsvp", async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const { rsvpStatus, attendees } = req.body;

    if (!["accepted", "declined", "pending"].includes(rsvpStatus)) {
      return res.status(400).json({ message: "Invalid rsvpStatus" });
    }

    const guest = await Guest.findOne({ inviteCode });

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    guest.rsvpStatus = rsvpStatus;
    guest.attendees = rsvpStatus === "accepted" ? (attendees || 1) : 0;

    await guest.save();

    res.json({
      message: "RSVP updated",
      rsvpStatus: guest.rsvpStatus,
      attendees: guest.attendees,
    });
  } catch (err) {
    console.error("Error updating RSVP:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Public: list all events/programmes (used by ProgrammesTab)
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).lean();
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin: create an event (you can call this with Postman to seed data)
app.post("/api/events", async (req, res) => {
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
});

// Start server
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
