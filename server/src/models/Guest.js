const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  nickname: { type: String, default: '' },
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
    required: true 
  },
  expectedGuests: { type: Number, default: 1 },
  inviteCode: { type: String, required: true, unique: true },
  withFamily: { type: Boolean, default: false },
  familyMembers: [{ name: String, gender: String }],
  photos: [String],
  rsvpStatus: { type: String, enum: ['pending', 'attending', 'declined'], default: 'pending' },
  emotionalGuess: { type: String, default: '' },
  weddingMood: { type: String, default: '' },
  guestNote: { type: String, default: '' },
  songRequest: { type: String, default: '' }, 
  vibeCheck: { type: String, default: '' },
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