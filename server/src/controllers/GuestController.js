const Guest = require('../models/Guest');

// Admin: Create a new guest
exports.createGuest = async (req, res) => {
  try {
    // Generate inviteCode if not explicitly provided in req.body
    const inviteCode = req.body.inviteCode || Math.random().toString(36).substring(2, 10);

    const newGuest = new Guest({
      ...req.body,
      inviteCode,
    });

    await newGuest.save();
    res.status(201).json({ success: true, guest: newGuest });
  } catch (error) {
    console.error("Create Guest Error:", error);
    res.status(400).json({ error: error.message });
  }
};

// Guest: Get guest details by their unique code
exports.getGuestByCode = async (req, res) => {
  try {
    const guest = await Guest.findOne({ inviteCode: req.params.code });
    if (!guest) return res.status(404).json({ message: 'Invite not found' });
    
    res.status(200).json(guest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get all guests for the list/search
exports.getAllGuests = async (req, res) => {
    try {
      const guests = await Guest.find().sort({ createdAt: -1 });
      res.status(200).json(guests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Admin: Update existing guest
  exports.updateGuest = async (req, res) => {
    try {
      const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.status(200).json(guest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  exports.createGuestRsvp = async (req, res) => {
    try {
        const { attending, emotional_guess, wedding_mood, song_request, vibe_check, note } = req.body;
        
        const guest = await Guest.findOne({ inviteCode: req.params.inviteCode });
        if (!guest) {
          return res.status(404).json({ error: 'Guest not found' });
        }
    
        guest.rsvpStatus = attending ? 'attending' : 'declined';
        
        if (attending) {
          guest.emotionalGuess = emotional_guess || '';
          guest.weddingMood = wedding_mood || '';
          guest.songRequest = song_request || '';
          guest.vibeCheck = vibe_check || '';
          guest.guestNote = note || '';
        } else {
          guest.emotionalGuess = '';
          guest.weddingMood = '';
          guest.songRequest = '';
          guest.danceStamina = '';
          guest.guestNote = note || '';
        }
    
        await guest.save();
        res.json({ success: true, message: 'RSVP updated successfully!', guest });
        
      } catch (error) {
        console.error("RSVP Error:", error);
        res.status(500).json({ error: 'Server error processing RSVP' });
      }
  };

  exports.deleteGuest = async (req, res) => {
    try {
      await Guest.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Guest deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.resetGuestRsvp = async (req, res) => {
    try {
        const guest = await Guest.findOne({ inviteCode: req.params.inviteCode });
        if (!guest) return res.status(404).json({ error: 'Guest not found' });

        // Reset everything to defaults
        guest.rsvpStatus = 'pending';
        guest.emotionalGuess = '';
        guest.weddingMood = '';
        guest.songRequest = '';
        guest.vibeCheck = ''; 
        guest.guestNote = '';

        await guest.save();
        res.json({ success: true, message: 'RSVP reset successfully!' });
        
    } catch (error) {
        console.error("Reset RSVP Error:", error);
        res.status(500).json({ error: 'Server error resetting RSVP' });
    }
};