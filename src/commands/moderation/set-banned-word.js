const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const BannedWord = require('../../models/BannedWord'); // Import the Mongoose model

module.exports = {
  name: 'set-banned-word',
  description: 'Set a banned word for your channel.',
  options: [
    {
      name: 'word',
      description: 'The word to ban in this channel.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.ManageMessages],
  botPermissions: [PermissionFlagsBits.ManageMessages],
  callback: async (client, interaction) => {
    const word = interaction.options.getString('word');
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
      // Upsert the banned word for the channel
      await BannedWord.findOneAndUpdate(
        { channelId },
        { word },
        { upsert: true, new: true }
      );

      // Send an ephemeral confirmation message
      await interaction.reply({
        content: `The banned word for this channel is now **${word}**.`,
        ephemeral: true, // Response visible only to the user
      });

      // Send a plain message to the server
      await interaction.channel.send(`A new banned word has been set for this channel.`);
    } catch (error) {
      console.error('Failed to set banned word:', error);
      await interaction.reply({
        content: 'There was an error setting the banned word. Please try again later.',
        ephemeral: true, // Response visible only to the user
      });
    }
  },
};

