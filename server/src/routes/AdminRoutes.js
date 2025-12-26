// src/routes/adminRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const {
  loginAdmin, getGuests, createGuest, deleteGuest,
  getEvents, createEvent, deleteEvent, searchGuests
} = require('../controllers/adminController');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-prod';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Public login
router.post('/login', loginAdmin);

// Protected routes
router.get('/guests', authenticateToken, getGuests);
router.post('/guests', authenticateToken, createGuest);
router.delete('/guests/:id', authenticateToken, deleteGuest);

router.get('/events', authenticateToken, getEvents);
router.post('/events', authenticateToken, createEvent);
router.delete('/events/:id', authenticateToken, deleteEvent);
router.get('/guests/search', authenticateToken, searchGuests);  

module.exports = router;
