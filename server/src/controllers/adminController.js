// src/controllers/adminController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Guest = require('../models/Guest');
const Event = require('../models/Event');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';

// Simple admin user (hardcoded for wedding - change password!)
const ADMIN_CREDENTIALS = {
  email: 'admin@panwarwedding.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
};

function generateInviteCode() {
    return Math.random().toString(36).substring(2, 10);
  }
  
async function loginAdmin(req, res) {
  const { email, password } = req.body;
  
  if (email !== ADMIN_CREDENTIALS.email) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, message: 'Login successful' });
}

// GET /api/admin/guests
async function getGuests(req, res) {
  try {
    const guests = await Guest.find().sort({ createdAt: -1 }).lean();
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createGuest(req, res) {
  try {
    console.log('Admin creating guest:', req.body); // DEBUG
    
    const { fullName, gender, withFamily, inviteType, side } = req.body;
    
    const inviteCode = generateInviteCode();

    const guest = new Guest({
      fullName: fullName.trim(),
      gender,
      inviteCode,
      withFamily: !!withFamily,
      inviteType: inviteType || 'wedding',
      side: side || 'groom'
    });

    await guest.save();
    console.log('Guest created:', guest.inviteCode); // DEBUG
    res.status(201).json(guest);
  } catch (err) {
    console.error('Admin create guest error:', err.message);
    res.status(400).json({ error: err.message });
  }
}

// DELETE /api/admin/guests/:id
async function deleteGuest(req, res) {
  try {
    await Guest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Guest deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Events CRUD (same pattern)
async function getEvents(req, res) {
  const events = await Event.find().sort({ date: 1 }).lean();
  res.json(events);
}

async function createEvent(req, res) {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function deleteEvent(req, res) {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/guests/search?q=ganesh
async function searchGuests(req, res) {
    try {
      const { q } = req.query;
      if (!q) return res.json([]);
      
      const guests = await Guest.find({
        fullName: { $regex: q, $options: 'i' }  // Case-insensitive partial match
      }).limit(10).lean();
      
      res.json(guests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

module.exports = {
  loginAdmin,
  getGuests, createGuest, deleteGuest,
  getEvents, createEvent, deleteEvent,
  searchGuests
};
