const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const BannedWord = require('../../models/BannedWord'); // Import the Mongoose model

module.exports = {
  name: 'get-banned-word',
  description: 'Get the banned word for the current channel.',
  permissionsRequired: [PermissionFlagsBits.ManageMessages],
  botPermissions: [PermissionFlagsBits.ManageMessages],
  callback: async (client, interaction) => {
    const channelId = interaction.channelId;

    // Check if the user has the ManageMessages permission
    const member = interaction.member;
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: 'You do not have the required permissions to use this command.',
        ephemeral: true, // Response visible only to the user
      });
      return;
    }

    try {
      // Fetch the banned word for the channel from the database
      const bannedWordEntry = await BannedWord.findOne({ channelId });

      if (bannedWordEntry) {
        await interaction.reply({
          content: `The banned word for this channel is **${bannedWordEntry.word}**.`,
          ephemeral: true, // Response visible only to the user
        });
      } else {
        await interaction.reply({
          content: 'No banned word is set for this channel.',
          ephemeral: true, // Response visible only to the user
        });
      }
    } catch (error) {
      console.error('Failed to fetch banned word:', error);
      await interaction.reply({
        content: 'There was an error fetching the banned word. Please try again later.',
        ephemeral: true, // Response visible only to the user
      });
    }
  },
};