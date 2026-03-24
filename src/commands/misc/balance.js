const User = require('../../models/User');

module.exports = {
  name: 'balance',
  description: 'View your current balance.',
  callback: async (client, interaction) => {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
      // Fetch the user's balance from the database
      let user = await User.findOne({ userId, guildId });

      // If the user doesn't exist in the database, create a new entry with default balance
      if (!user) {
        user = new User({ userId, guildId });
        await user.save();
      }

      // Respond with the user's current balance
      await interaction.reply({
        content: `You currently have **${user.balance}** balance.`,
        ephemeral: true, // Response visible only to the user
      });
    } catch (error) {
      console.error('Error fetching user balance:', error);
      await interaction.reply({
        content: 'There was an error retrieving your balance. Please try again later.',
        ephemeral: true, // Response visible only to the user
      });
    }
  },
};