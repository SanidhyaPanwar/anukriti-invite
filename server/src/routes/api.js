const express = require('express');
const router = express.Router();
const guestController = require('../controllers/GuestController');
const eventController = require('../controllers/EventController');
const adminController = require('../controllers/adminController');
const expenseController = require('../controllers/expenseController');
const adminAuth = require('../middleware/auth');
const upload = require('../middleware/upload');

// === GUEST ROUTES (Public) ===
router.get('/guest/:code', guestController.getGuestByCode);
router.get('/events', eventController.getTimeline);
router.post('/guest/:inviteCode/rsvp', guestController.createGuestRsvp);
router.post('/guest/:inviteCode/reset-rsvp', guestController.resetGuestRsvp);

// === ADMIN ROUTES (Protected) ===
router.post('/admin/guest', adminAuth, guestController.createGuest);
router.post('/admin/event', adminAuth, eventController.createEvent);
router.put('/admin/event/:id', adminAuth, eventController.updateEvent);
router.post('/admin/toggle-keepalive', adminAuth, adminController.toggleKeepAlive);
router.get('/admin/guests', adminAuth, guestController.getAllGuests);
router.put('/admin/guest/:id', adminAuth, guestController.updateGuest);
router.post('/admin/verify', adminAuth, adminController.verifyLogin);

// === DELETE ROUTES (Protected) ===
router.delete('/admin/guest/:id', adminAuth, guestController.deleteGuest);
router.delete('/admin/event/:id', adminAuth, eventController.deleteEvent);

// === FINANCE / EXPENSE ROUTES (Protected by PIN / Admin Auth) ===
// const upload = require('../middleware/upload'); // Your Cloudinary multer config

router.post('/admin/finance/verify-pin', expenseController.verifyFinancePin);
router.get('/admin/finance/expenses', adminAuth, expenseController.getExpenses);
router.post('/admin/finance/expense', adminAuth, expenseController.createExpense);
router.delete('/admin/finance/expense/:expenseId', adminAuth, expenseController.deleteExpense);
router.put('/admin/finance/expense/:expenseId', adminAuth, expenseController.updateExpense);
router.post(
    '/admin/finance/expense/:expenseId/installment',
    adminAuth,
    upload.single('receipt'),
    expenseController.manageInstallment
  );
// Route for adding installment with file upload support
// router.post('/admin/finance/expense/:expenseId/installment', adminAuth, upload.single('receipt'), expenseController.manageInstallment);

module.exports = router;