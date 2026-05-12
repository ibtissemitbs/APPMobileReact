const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const {
  RtcTokenBuilder,
  RtcRole,
} = require("agora-token");

dotenv.config();

const app = express();
app.use(cors());

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERT = process.env.AGORA_APP_CERTIFICATE;
const PORT = process.env.TOKEN_SERVER_PORT || 5050;

if (!APP_ID || !APP_CERT) {
  console.error("Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE in .env");
}

app.get("/rtc-token", (req, res) => {
  const channelName = req.query.channel;
  const uid = req.query.uid ? Number(req.query.uid) : 0;
  const role = RtcRole.PUBLISHER;
  const expireTime = req.query.expire ? Number(req.query.expire) : 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTime;

  if (!channelName) {
    return res.status(400).json({ error: "Missing channel" });
  }

  if (!APP_ID || !APP_CERT) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERT,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  return res.json({ token, channel: channelName, uid });
});

app.listen(PORT, () => {
  console.log(`Agora token server running on http://localhost:${PORT}`);
});
