const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

// --- AGORA TOKEN GENERATION ENDPOINT ---
const AGORA_APP_ID = '2b15b3bb08ee4fc4813bfa201099fbd0';
const AGORA_APP_CERTIFICATE = '79fb74b0aac74109b0243f862a34ded8'; // TODO: Replace with your actual App Certificate from Agora dashboard

// GET /video/token?channel=channelName
router.get('/token', (req, res) => {
  const channelName = req.query.channel;
  if (!channelName) {
    return res.status(400).json({ error: 'channel is required' });
  }
  const uid = 0; // 0 means let Agora assign UID
  const role = RtcRole.PUBLISHER;
  const expireTime = 3600; // 1 hour
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );
    console.log("Agora Token",token)
    res.json({ token });
  } catch (err) {
    console.error('Agora token generation error:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;
