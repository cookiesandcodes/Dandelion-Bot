const { Schema, model } = require('mongoose');

const steamProfileSchema = new Schema({
  discordId: {
    type: String,
    required: true,
    unique: true,
  },
  steam64Id: {
    type: String,
    required: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model('SteamProfile', steamProfileSchema);
