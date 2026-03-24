const BannedWord = require('../../models/BannedWord'); // Import the Mongoose model
const UserTimeout = require('../../models/UserTimeout'); // Import a new model to track user timeouts

/**
 * Handles the messageCreate event to check for banned words and apply timeouts.
 *
 * @param {Client} client - The Discord client instance.
 * @param {Message} message - The message object.
 */
module.exports = async (client, message) => {
  // Ignore bot messages and messages outside of guilds
  if (message.author.bot || !message.inGuild()) return;

  try {
    // Fetch the banned word for the channel from the database
    const bannedWordEntry = await BannedWord.findOne({ channelId: message.channel.id });

    // Check if a banned word exists and if the message contains it
    if (bannedWordEntry && message.content.includes(bannedWordEntry.word)) {
      try {
        // Fetch or initialize the user's timeout data
        const userTimeout = await UserTimeout.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          { $setOnInsert: { timeoutCount: 0, lastReset: new Date() } },
          { upsert: true, new: true }
        );

        // Check if the last reset was before the start of the current month and reset the timeout count
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (userTimeout.lastReset < startOfMonth) {
          userTimeout.timeoutCount = 0;
          userTimeout.lastReset = now;
          await userTimeout.save();
        }

        // Calculate the timeout duration (1 minute per count, max 24 minutes)
        const timeoutDuration = Math.min((userTimeout.timeoutCount + 1) * 60 * 1000, 24 * 60 * 1000);

        // Apply the timeout to the user
        await message.member.timeout(timeoutDuration, 'Used a banned word');
        await message.reply(`You used the banned word **${bannedWordEntry.word}** and have been timed out for ${timeoutDuration / 60000} minutes.`);

        // Increment the user's timeout count
        userTimeout.timeoutCount += 1;
        await userTimeout.save();
      } catch (error) {
        console.error(`Failed to timeout member: ${error}`);
      }
    }
  } catch (error) {
    console.error(`Failed to fetch banned word: ${error}`);
  }
};