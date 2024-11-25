const { Client, Interaction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
module.exports = {
/**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */


    name: 'roll',
    description: 'Kicks a member from this server.',
    options: [
      {
        name: 'defined-range',
        description: 'Define range.',
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
    ],

name: 'roll',
    description: 'rolls a random number within the defined range.',
  
    callback: async (client, interaction) => {
    const maxrange= interaction.options.get('defined-range').value;
    var num = Math.floor(Math.random() * maxrange)
      await interaction.deferReply();
      interaction.editReply(
        `You rolled **${num}**.`
      );
    },
  };
  