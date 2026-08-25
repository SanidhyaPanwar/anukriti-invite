const Settings = require('../models/Settings');

exports.toggleKeepAlive = async (req, res) => {
  try {
    const { isEnabled } = req.body;
    
    // Upsert means: update if it exists, create if it doesn't
    const settings = await Settings.findOneAndUpdate(
      {}, 
      { isKeepAliveEnabled: isEnabled }, 
      { new: true, upsert: true }
    );
    
    res.status(200).json({ 
      message: `Keep-alive is now ${isEnabled ? 'ON' : 'OFF'}`, 
      settings 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyLogin = (req, res) => {
  res.status(200).json({ success: true, message: 'Password verified successfully' });
};