const { PermissionFlagsBits } = require('discord.js');
const BannedWord = require('../../models/BannedWord'); // Import the Mongoose model

module.exports = {
  name: 'remove-banned-word',
  description: 'Remove the banned word for the current channel.',
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
      // Delete the banned word for the channel
      const deletedEntry = await BannedWord.findOneAndDelete({ channelId });

      if (deletedEntry) {
        await interaction.reply({
          content: `The banned word (**${deletedEntry.word}**) has been removed for this channel.`,
          ephemeral: true, // Response visible only to the user
        });
      } else {
        await interaction.reply({
          content: 'No banned word is set for this channel.',
          ephemeral: true, // Response visible only to the user
        });
      }
    } catch (error) {
      console.error('Failed to remove banned word:', error);
      await interaction.reply({
        content: 'There was an error removing the banned word. Please try again later.',
        ephemeral: true, // Response visible only to the user
      });
    }
  },
};