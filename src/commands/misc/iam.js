const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const SteamProfile = require('../../models/SteamProfile');
const { parseSteamInput, resolveVanityUrl, getPlayerSummary } = require('../../utils/steamApi');

module.exports = {
  name: 'iam',
  description: 'Register your Steam profile. Accepts Steam64 ID, vanity URL, or profile link.',
  options: [
    {
      name: 'steam64',
      description: 'Your Steam64 ID (17 digits starting with 76561)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'vanity',
      description: 'Your Steam vanity URL (e.g., spectercs)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'profile',
      description: 'Your Steam profile URL (steamcommunity.com/id/... or /profiles/...)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  callback: async (client, interaction) => {
    console.log(`[IAM Command] Invoked by ${interaction.user.username}#${interaction.user.discriminator}`);
    console.log(`[IAM Command] User ID: ${interaction.user.id}`);

    try {
      // Check how many options are provided
      const steam64Option = interaction.options.getString('steam64');
      const vanityOption = interaction.options.getString('vanity');
      const profileOption = interaction.options.getString('profile');

      const providedOptions = [steam64Option, vanityOption, profileOption].filter(opt => opt !== null);

      if (providedOptions.length === 0) {
        await interaction.reply({
          content: '❌ Please provide exactly one of: `steam64`, `vanity`, or `profile`',
          ephemeral: true,
        });
        return;
      }

      if (providedOptions.length > 1) {
        await interaction.reply({
          content: '❌ Please provide exactly one option. Choose steam64, vanity, OR profile.',
          ephemeral: true,
        });
        return;
      }

      // Determine which option was provided and get the input
      const userInput = steam64Option || vanityOption || profileOption;
      console.log(`[IAM Command] Input: ${userInput}`);

      // Parse the input
      const parsed = parseSteamInput(userInput);
      console.log(`[IAM Command] Parsed as ${parsed.type}: ${parsed.value}`);

      let resolvedSteam64 = parsed.value;

      // If it's a vanity, resolve it to steam64
      if (parsed.type === 'vanity') {
        try {
          resolvedSteam64 = await resolveVanityUrl(parsed.value);
        } catch (error) {
          console.error('[IAM Command] Vanity resolution error:', error.message);
          await interaction.reply({
            content: `❌ ${error.message}`,
            ephemeral: true,
          });
          return;
        }
      }

      // Get player summary to validate the profile is public
      let playerSummary;
      try {
        playerSummary = await getPlayerSummary(resolvedSteam64);
      } catch (error) {
        console.error('[IAM Command] Player summary error:', error.message);
        await interaction.reply({
          content: `❌ ${error.message}`,
          ephemeral: true,
        });
        return;
      }

      // Upsert the SteamProfile
      const steamProfile = await SteamProfile.findOneAndUpdate(
        { discordId: interaction.user.id },
        {
          discordId: interaction.user.id,
          steam64Id: resolvedSteam64,
          registeredAt: new Date(),
        },
        { upsert: true, new: true }
      );

      console.log(`[IAM Command] Registered ${interaction.user.id} with Steam64: ${resolvedSteam64}`);

      // Build confirmation embed
      const embed = new EmbedBuilder()
        .setTitle('✅ Steam Profile Registered')
        .setColor('#2ECC71')
        .setThumbnail(playerSummary.avatar)
        .addFields(
          { name: 'Discord User', value: `<@${interaction.user.id}>`, inline: false },
          { name: 'Steam Display Name', value: playerSummary.displayName, inline: true },
          { name: 'Steam64 ID', value: `\`${playerSummary.steam64}\``, inline: true },
          { name: 'Steam Profile', value: `[View on Steam](https://steamcommunity.com/profiles/${playerSummary.steam64})`, inline: false }
        )
        .setFooter({ text: 'You can now use /leetify stats and other identity-aware commands!' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: false,
      });
    } catch (error) {
      console.error('[IAM Command] Unexpected error:', error);
      await interaction.reply({
        content: '❌ An unexpected error occurred. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
