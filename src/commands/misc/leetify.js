const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { validateApiKey, getPlayerProfile, getMatchDetails } = require('../../utils/leetifyApi');
const SteamProfile = require('../../models/SteamProfile');
const { getPlayerSummary } = require('../../utils/steamApi');

module.exports = {
  name: 'leetify',
  description: 'Query Leetify for CS player stats, recent matches, or match details.',
  options: [
    {
      name: 'stats',
      description: 'Get CS2 stats for a player (identity-aware)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'user',
          description: 'Discord user to look up (optional, uses yourself if omitted)',
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
    {
      name: 'recent',
      description: 'View recent matches for a player (identity-aware)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'count',
          description: 'Number of recent matches to show (1-5, default 1)',
          type: ApplicationCommandOptionType.Integer,
          required: false,
          min_value: 1,
          max_value: 5,
        },
        {
          name: 'user',
          description: 'Discord user to look up (optional, uses yourself if omitted)',
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
    {
      name: 'match',
      description: 'Get match details from Leetify',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'gameid',
          description: 'Match/game ID',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],

  callback: async (client, interaction) => {
    console.log(`[Leetify Command] Invoked by ${interaction.user.username}#${interaction.user.discriminator}`);
    console.log(`[Leetify Command] User ID: ${interaction.user.id}, Guild: ${interaction.guild?.name || 'DM'}`);
    
    await interaction.deferReply({ ephemeral: false });

    const subcommand = interaction.options.getSubcommand();
    console.log(`[Leetify Command] Subcommand: ${subcommand}`);

    try {
      if (subcommand === 'stats') {
        console.log('[Leetify Stats] Processing stats request');
        const targetUser = interaction.options.getUser('user') || interaction.user;
        console.log(`[Leetify Stats] Looking up stats for: ${targetUser.id}`);

        // Look up the user's registered Steam profile
        const steamProfile = await SteamProfile.findOne({ discordId: targetUser.id });
        if (!steamProfile) {
          return interaction.editReply(`❌ \`${targetUser.username}\` has not registered a Steam profile. They can use \`/iam\` to register.`);
        }

        const steamId = steamProfile.steam64Id;
        console.log(`[Leetify Stats] Using Steam64: ${steamId}`);
        const profile = await getPlayerProfile(steamId);
        
        // Get Steam avatar
        let steamAvatar = null;
        try {
          const steamSummary = await getPlayerSummary(steamId);
          steamAvatar = steamSummary.avatar;
        } catch (error) {
          console.warn('[Leetify Stats] Could not fetch Steam avatar:', error.message);
        }
        
        console.log(`[Leetify Stats] Successfully fetched profile: ${profile.name || steamId}`);

        const embed = new EmbedBuilder()
          .setTitle(`${profile.name || 'Player Profile'} (${targetUser.username})`)
          .setColor('#1E90FF')
          .setThumbnail(steamAvatar || targetUser.displayAvatarURL({ size: 256 }))
          .setFooter({ text: 'Leetify CS2 Stats' })
          .setTimestamp();

        // Basic Stats Row
        const winratePercent = (profile.winrate * 100).toFixed(1);
        embed.addFields(
          { name: 'Win Rate', value: `${winratePercent}%`, inline: true },
          { name: 'Total Matches', value: String(profile.total_matches), inline: true },
          { name: '\u200B', value: '\u200B', inline: true }
        );

        // Ranks Section
        const { ranks } = profile;
        const rankInfo = [];
        if (ranks.leetify) rankInfo.push(`**Leetify:** ${ranks.leetify}`);
        if (ranks.premier) rankInfo.push(`**Premier:** ${ranks.premier} RR`);
        if (ranks.faceit) rankInfo.push(`**FaceIt:** Level ${ranks.faceit}`);
        if (ranks.wingman) rankInfo.push(`**Wingman:** ${ranks.wingman}`);
        
        if (rankInfo.length > 0) {
          embed.addFields({ name: '📊 Ratings', value: rankInfo.join('\n'), inline: false });
        }

        // Performance Metrics
        const { rating } = profile;
        const metrics = [];
        if (rating.aim) metrics.push(`Aim: **${rating.aim.toFixed(1)}**`);
        if (rating.positioning) metrics.push(`Positioning: **${rating.positioning.toFixed(1)}**`);
        if (rating.utility) metrics.push(`Utility: **${rating.utility.toFixed(1)}**`);
        if (rating.clutch) metrics.push(`Clutch: **${(rating.clutch * 100).toFixed(2)}**`);
        if (rating.opening) metrics.push(`Opening: **${(rating.opening * 100).toFixed(2)}**`);
        if (rating.ct_leetify) metrics.push(`CT Leetify: **${(rating.ct_leetify * 100).toFixed(2)}**`);
        if (rating.t_leetify) metrics.push(`T Leetify: **${(rating.t_leetify * 100).toFixed(2)}**`);
        
        if (metrics.length > 0) {
          // Split metrics into two rows for better display
          const firstRow = metrics.slice(0, Math.ceil(metrics.length / 2)).join(' | ');
          const secondRow = metrics.slice(Math.ceil(metrics.length / 2)).join(' | ');
          const metricsValue = firstRow + '\n' + secondRow;
          embed.addFields({ name: '⚡ Performance', value: metricsValue, inline: false });
        }

        // Accuracy Stats
        const { stats } = profile;
        const accuracy = [];
        if (stats.accuracy_head) accuracy.push(`Headshot: **${stats.accuracy_head.toFixed(1)}%**`);
        if (stats.accuracy_enemy_spotted) accuracy.push(`Spotted: **${stats.accuracy_enemy_spotted.toFixed(1)}%**`);
        if (stats.spray_accuracy) accuracy.push(`Spray: **${stats.spray_accuracy.toFixed(1)}%**`);
        if (stats.reaction_time_ms) accuracy.push(`Reaction: **${stats.reaction_time_ms.toFixed(0)}ms**`);
        
        if (accuracy.length > 0) {
          // Split accuracy stats into two rows for better display
          const firstRow = accuracy.slice(0, Math.ceil(accuracy.length / 2)).join(' | ');
          const secondRow = accuracy.slice(Math.ceil(accuracy.length / 2)).join(' | ');
          const accuracyValue = firstRow + '\n' + secondRow;
          embed.addFields({ name: '🎯 Accuracy & Mechanics', value: accuracyValue, inline: false });
        }

        // Top Competitive Maps
        if (profile.ranks.competitive && profile.ranks.competitive.length > 0) {
          const topMaps = profile.ranks.competitive
            .filter(m => m.rank > 0)
            .sort((a, b) => b.rank - a.rank)
            .slice(0, 4);
          
          if (topMaps.length > 0) {
            const mapRanks = topMaps.map(m => `${m.map_name.replace('de_', '').toUpperCase()}: **${m.rank}**`).join(' | ');
            embed.addFields({ name: '🗺️ Map Ranks', value: mapRanks, inline: false });
          }
        }

        // Recent Match Summary
        if (profile.recent_matches && profile.recent_matches.length > 0) {
          const recent5 = profile.recent_matches.slice(0, 5);
          const wins = recent5.filter(m => m.outcome === 'win').length;
          const losses = recent5.filter(m => m.outcome === 'loss').length;
          const ties = recent5.filter(m => m.outcome === 'tie').length;
          
          embed.addFields({
            name: '📈 Last 5 Matches',
            value: `${wins}W - ${losses}L - ${ties}T | Avg Rating: ${(recent5.reduce((sum, m) => sum + m.leetify_rating, 0) / 5).toFixed(3)}`,
            inline: false
          });
        }

        await interaction.editReply({ embeds: [embed] });
        console.log('[Leetify Stats] Reply sent successfully');
        return;
      }

      if (subcommand === 'recent') {
        console.log('[Leetify Recent] Processing recent matches request');
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const count = interaction.options.getInteger('count') || 1;
        console.log(`[Leetify Recent] Fetching ${count} recent matches for: ${targetUser.id}`);

        // Look up the user's registered Steam profile
        const steamProfile = await SteamProfile.findOne({ discordId: targetUser.id });
        if (!steamProfile) {
          return interaction.editReply(`❌ \`${targetUser.username}\` has not registered a Steam profile. They can use \`/iam\` to register.`);
        }

        const steamId = steamProfile.steam64Id;
        console.log(`[Leetify Recent] Using Steam64: ${steamId}`);
        const profile = await getPlayerProfile(steamId);
        console.log(`[Leetify Recent] Successfully fetched profile: ${profile.name || steamId}`);

        if (!profile.recent_matches || profile.recent_matches.length === 0) {
          return interaction.editReply(`❌ No recent matches found for \`${targetUser.username}\`.`);
        }

        // Get Steam avatar
        let steamAvatar = null;
        try {
          const steamSummary = await getPlayerSummary(steamId);
          steamAvatar = steamSummary.avatar;
        } catch (error) {
          console.warn('[Leetify Recent] Could not fetch Steam avatar:', error.message);
        }

        const embed = new EmbedBuilder()
          .setTitle(`Recent Matches - ${profile.name || 'Player'} (${targetUser.username})`)
          .setColor('#1E90FF')
          .setThumbnail(steamAvatar || targetUser.displayAvatarURL({ size: 256 }))
          .setFooter({ text: 'Leetify CS2 Stats' })
          .setTimestamp();

        // Fetch match details for each recent match (up to count)
        const recentMatches = profile.recent_matches.slice(0, count);
        const matchLines = [];

        for (let i = 0; i < recentMatches.length; i++) {
          const match = recentMatches[i];
          const resultEmoji = match.outcome === 'win' ? '✅' : match.outcome === 'loss' ? '❌' : '⚪';
          const resultText = match.outcome === 'win' ? 'W' : match.outcome === 'loss' ? 'L' : 'T';
          const mapName = match.map_name ? match.map_name.replace('de_', '').toUpperCase() : 'Unknown';
          const ratingText = match.leetify_rating ? (match.leetify_rating * 100).toFixed(2) : 'N/A';
          const rankText = match.rank ? match.rank : 'N/A';
          
          // Pad values for uniform spacing in monospace
          const mapNamePadded = mapName.padEnd(8);
          const ratingPadded = `Rating: ${ratingText}`.padEnd(14);
          const rankPadded = `Rank: ${rankText}`.padEnd(11);
          
          matchLines.push(`${resultEmoji} \`${resultText} | ${mapNamePadded} | ${ratingPadded} | ${rankPadded}\``);
        }

        // Calculate rank change (most recent vs oldest in selection)
        let rankChangeText = '';
        if (recentMatches.length > 1 && recentMatches[0].rank && recentMatches[recentMatches.length - 1].rank) {
          const rankChange = recentMatches[0].rank - recentMatches[recentMatches.length - 1].rank;
          const rankChangeSymbol = rankChange > 0 ? '📈' : rankChange < 0 ? '📉' : '➡️';
          rankChangeText = ` | Rank Change: ${rankChangeSymbol} ${rankChange > 0 ? '+' : ''}${rankChange}`;
        } else if (recentMatches.length === 1 && recentMatches[0].rank) {
          rankChangeText = ` | Current Rank: ${recentMatches[0].rank}`;
        }

        if (matchLines.length > 0) {
          embed.addFields({ name: `📋 Match History${rankChangeText}`, value: matchLines.join('\n'), inline: false });
        }

        await interaction.editReply({ embeds: [embed] });
        console.log('[Leetify Recent] Reply sent successfully');
        return;
      }

      if (subcommand === 'match') {
        console.log('[Leetify Match] Processing match request');
        const gameId = interaction.options.getString('gameid');
        console.log(`[Leetify Match] Game ID: ${gameId}`);
        const match = await getMatchDetails(gameId);
        console.log(`[Leetify Match] Successfully fetched match data for game: ${gameId}`);

        const embed = new EmbedBuilder()
          .setTitle(`Leetify match: ${gameId}`)
          .setColor('#22AA22')
          .setFooter({ text: 'Leetify CS API' })
          .setTimestamp();

        if (match.map) embed.addFields({ name: 'Map', value: match.map, inline: true });
        if (match.mode) embed.addFields({ name: 'Mode', value: match.mode, inline: true });
        if (match.duration) embed.addFields({ name: 'Duration', value: `${match.duration}s`, inline: true });
        if (match.result) embed.addFields({ name: 'Result', value: match.result, inline: true });

        await interaction.editReply({ embeds: [embed] });
        console.log('[Leetify Match] Reply sent successfully');
        return;
      }

      await interaction.editReply('Unknown subcommand. Use stats, recent, or match.');
      console.warn(`[Leetify Command] Unknown subcommand: ${subcommand}`);
    } catch (error) {
      console.error(`[Leetify Command] Error caught:`, error.message);
      const normalized = String(error.message || error);
      let reply = `❌ Error: ${normalized}`;

      if (normalized.includes('Not found')) {
        reply = '❌ Not found: target data missing.';
      } else if (normalized.includes('Rate limited')) {
        reply = '⏱️ Rate limit exceeded, wait and try again.';
      } else if (normalized.includes('Unauthorized')) {
        reply = '❌ Leetify key invalid (401).';
      }

      console.error(`[Leetify Command] Sending error reply: ${reply}`);
      return interaction.editReply({ content: reply });
    }
  },
};