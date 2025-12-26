// src/controllers/guestController.js
const Guest = require("../models/Guest")

// Util to generate a simple random invite code
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10);
}

// POST /api/guests  (admin: create one guest)
async function createGuest(req, res) {
  try {
    const {
      fullName,
      gender,
      withFamily,
      familyMembers: rawFamilyMembers,
      photos,
      phone,
      email,
      side,
    } = req.body;

    if (!fullName) {
      return res.status(400).json({ message: "fullName is required" });
    }

    const inviteCode = Math.random().toString(36).substring(2, 10);

    // FIX: Handle both string array AND object array for familyMembers
    let familyMembers = [];
    if (rawFamilyMembers) {
      if (Array.isArray(rawFamilyMembers)) {
        familyMembers = rawFamilyMembers.map(fm => {
          if (typeof fm === 'string') {
            return { name: fm, gender: 'male' };
          } else if (typeof fm === 'object' && fm.name) {
            return { name: fm.name, gender: fm.gender || 'male' };
          }
          return null;
        }).filter(Boolean);
      }
    }

    const guest = new Guest({
      fullName,
      gender: gender || 'male',
      inviteCode,
      withFamily: !!withFamily,
      familyMembers,  // Fixed array of objects
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
}

// GET /api/invite/:inviteCode
async function getInviteByCode(req, res) {
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
}

// PATCH /api/invite/:inviteCode  (update guest details)
async function updateGuest(req, res) {
  try {
    const { inviteCode } = req.params;
    const { gender, phone, email } = req.body;

    const guest = await Guest.findOne({ inviteCode });

    if (!guest) {
      return res.status(404).json({ message: "Guest not found" });
    }

    if (gender) guest.gender = gender;
    if (phone) guest.phone = phone;
    if (email) guest.email = email;

    await guest.save();

    res.json({
      message: "Guest updated",
      guest: guest
    });
  } catch (err) {
    console.error("Error updating guest:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

// DELETE /api/invite/:inviteCode
async function deleteGuest(req, res) {
  try {
    const { inviteCode } = req.params;
    const guest = await Guest.findOneAndDelete({ inviteCode });
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    res.json({ message: "Guest deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


module.exports = {
    createGuest,
    getInviteByCode,
    updateGuest,
    deleteGuest
  };