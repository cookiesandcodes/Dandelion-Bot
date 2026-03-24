// filepath: c:\Users\EdwardSantos\Documents\discordbot project\Dandelion-Bot\src\models\UserTimeout.js
const mongoose = require('mongoose');

const userTimeoutSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  timeoutCount: { type: Number, default: 0 },
  lastReset: { type: Date, default: new Date() },
});

module.exports = mongoose.model('UserTimeout', userTimeoutSchema);