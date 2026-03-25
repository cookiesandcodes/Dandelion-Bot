const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const SteamProfile = require('../../models/SteamProfile');
const { getPlayerSummary } = require('../../utils/steamApi');

module.exports = {
  name: 'whois',
  description: 'View a user\'s linked Steam profile.',
  options: [
    {
      name: 'user',
      description: 'The Discord user to look up',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    console.log(`[Whois Command] Invoked by ${interaction.user.username}#${interaction.user.discriminator}`);
    console.log(`[Whois Command] Looking up user: ${interaction.options.getUser('user').id}`);

    try {
      const targetUser = interaction.options.getUser('user');

      // Look up the Steam profile
      const steamProfile = await SteamProfile.findOne({ discordId: targetUser.id });

      if (!steamProfile) {
        await interaction.reply({
          content: `❌ \`${targetUser.username}\` has not registered a Steam profile. They can use \`/iam\` to register.`,
          ephemeral: true,
        });
        return;
      }

      console.log(`[Whois Command] Found profile for ${targetUser.id}: ${steamProfile.steam64Id}`);

      // Fetch Steam avatar
      let steamAvatar = null;
      try {
        const steamSummary = await getPlayerSummary(steamProfile.steam64Id);
        steamAvatar = steamSummary.avatar;
      } catch (error) {
        console.warn('[Whois Command] Could not fetch Steam avatar:', error.message);
      }

      const registeredDate = new Date(steamProfile.registeredAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const embed = new EmbedBuilder()
        .setTitle(`${targetUser.username}'s Steam Profile`)
        .setColor('#1E90FF')
        .setThumbnail(steamAvatar || targetUser.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: 'Discord User', value: `<@${targetUser.id}>`, inline: false },
          { name: 'Steam64 ID', value: `\`${steamProfile.steam64Id}\``, inline: true },
          { name: 'Registered', value: registeredDate, inline: true },
          { name: 'Steam Profile Link', value: `[View on Steam](https://steamcommunity.com/profiles/${steamProfile.steam64Id})`, inline: false }
        )
        .setFooter({ text: 'Use /leetify stats @user to see their CS2 stats!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: false,
      });
    } catch (error) {
      console.error('[Whois Command] Error:', error);
      await interaction.reply({
        content: '❌ An error occurred while looking up the user profile.',
        ephemeral: true,
      });
    }
  },
};
