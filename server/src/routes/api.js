const express = require('express');
const router = express.Router();
const guestController = require('../controllers/GuestController');
const eventController = require('../controllers/EventController');
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/auth');

// === GUEST ROUTES (Public) ===
router.get('/guest/:code', guestController.getGuestByCode);
router.get('/events', eventController.getTimeline);
router.post('/guest/:inviteCode/rsvp', guestController.createGuestRsvp);

// === ADMIN ROUTES (Protected) ===
router.post('/admin/guest', adminAuth, guestController.createGuest);
router.post('/admin/event', adminAuth, eventController.createEvent);
router.put('/admin/event/:id', adminAuth, eventController.updateEvent);
router.post('/admin/toggle-keepalive', adminAuth, adminController.toggleKeepAlive);
router.get('/admin/guests', adminAuth, guestController.getAllGuests);
router.put('/admin/guest/:id', adminAuth, guestController.updateGuest);

module.exports = router;