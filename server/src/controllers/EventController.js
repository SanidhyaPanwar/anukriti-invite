const Event = require('../models/Event');

// Admin: Create Event
exports.createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Admin: Update Event
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Guest: Get Timeline based on their invite type
exports.getTimeline = async (req, res) => {
    try {
      const { inviteType } = req.query;
      
      let filter = {};
      if (inviteType === 'wedding') {
        filter.eventType = 'main-wedding';
      }
  
      const events = await Event.find(filter);
      
      // Auto-sort chronologically by combining date and time into a native JS Date object
      events.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA - dateB;
      });
  
      res.status(200).json(events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.deleteEvent = async (req, res) => {
    try {
      await Event.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };