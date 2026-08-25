const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
    required: true 
  },
  inviteCode: { type: String, required: true, unique: true },
  withFamily: { type: Boolean, default: false },
  familyMembers: [{ name: String, gender: String }],
  photos: [String],
  rsvpStatus: { type: String, enum: ['pending', 'attending', 'declined'], default: 'pending' },
  emotionalGuess: { type: String, default: '' },
  weddingMood: { type: String, default: '' },
  guestNote: { type: String, default: '' },
  phone: String,
  email: String,
  side: { 
    type: String, 
    enum: ['bride', 'groom'], 
    default: 'bride' 
  },
  inviteType: { 
    type: String, 
    enum: ['wedding', 'complete'], 
    default: 'wedding' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Guest', guestSchema);