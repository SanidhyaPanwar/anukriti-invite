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
  phone: String,
  email: String,
  side: { 
    type: String, 
    enum: ['bride', 'groom'], 
    default: 'groom' 
  },
  inviteType: { 
    type: String, 
    enum: ['wedding', 'complete'], 
    default: 'wedding' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Guest', guestSchema);
