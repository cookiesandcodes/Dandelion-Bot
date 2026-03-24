const { ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/User');

const shopItems = [
  { name: 'Sword', price: 100 },
  { name: 'Shield', price: 150 },
  { name: 'Potion', price: 50 },
];

module.exports = {
  name: 'shop',
  description: 'View and purchase items from the shop.',
  options: [
    {
      name: 'item',
      description: 'The item you want to purchase.',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: shopItems.map((item) => ({ name: item.name, value: item.name })),
    },
  ],
  callback: async (client, interaction) => {
    const itemName = interaction.options.getString('item');
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    try {
      let user = await User.findOne({ userId, guildId });

      // Create a new user entry if it doesn't exist
      if (!user) {
        user = new User({ userId, guildId });
        await user.save();
      }

      if (!itemName) {
        // Display shop items
        const shopList = shopItems
          .map((item) => `**${item.name}** - ${item.price} balance`)
          .join('\n');
        await interaction.reply({
          content: `Welcome to the shop! Here are the available items:\n\n${shopList}`,
          ephemeral: true,
        });
        return;
      }

      // Handle item purchase
      const item = shopItems.find((i) => i.name === itemName);
      if (!item) {
        await interaction.reply({
          content: 'That item does not exist in the shop.',
          ephemeral: true,
        });
        return;
      }

      if (user.balance < item.price) {
        await interaction.reply({
          content: `You do not have enough balance to purchase **${item.name}**. You need ${item.price - user.balance} more balance.`,
          ephemeral: true,
        });
        return;
      }

      // Deduct balance and confirm purchase
      user.balance -= item.price;
      await user.save();

      await interaction.reply({
        content: `You have successfully purchased **${item.name}** for ${item.price} balance!`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error handling shop command:', error);
      await interaction.reply({
        content: 'There was an error processing your request. Please try again later.',
        ephemeral: true,
      });
    }
  },
};