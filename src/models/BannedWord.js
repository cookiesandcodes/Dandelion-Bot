const { Schema, model } = require('mongoose');

const bannedWordSchema = new Schema({
  channelId: {
    type: String,
    required: true,
    unique: true, // Ensures one banned word per channel
  },
  word: {
    type: String,
    required: true,
  },
});

module.exports = model('BannedWord', bannedWordSchema);