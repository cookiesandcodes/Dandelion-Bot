const { testServer, AGCL } = require('../../../config.json');
const areCommandsDifferent = require('../../utils/areCommandsDifferent');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');

module.exports = async (client) => {
  try {
    const localCommands = getLocalCommands();
    const { NOHK } = require('../../../config.json');
    const serverIds = [testServer, AGCL, NOHK];

    for (const serverId of serverIds) {
      const guild = await client.guilds.fetch(serverId).catch(() => null);
      const guildName = guild ? guild.name : 'Unknown Server';

      const applicationCommands = await getApplicationCommands(client, serverId);

      console.log(`\n📋 Syncing commands in server "${guildName}"...`);

      for (const localCommand of localCommands) {
        const { name, description, options } = localCommand;

        const existingCommand = applicationCommands.cache.find(
          (cmd) => cmd.name === name
        );

        if (existingCommand) {
          // Command exists in Discord
          if (localCommand.deleted) {
            // Mark as deleted locally, remove from Discord
            await applicationCommands.delete(existingCommand.id);
            console.log(`  🗑️ Deleted command "${name}".`);
          } else if (areCommandsDifferent(existingCommand, localCommand)) {
            // Command exists but is outdated, update it
            await applicationCommands.edit(existingCommand.id, {
              description,
              options,
            });
            console.log(`  🔄 Updated command "${name}".`);
          } else {
            // Command exists and is up-to-date, no action needed
            console.log(`  ✅ Command "${name}" is up-to-date.`);
          }
        } else {
          // Command does not exist in Discord
          if (localCommand.deleted) {
            // Already deleted, nothing to do
            console.log(`  ⏭️ Skipped command "${name}" (marked as deleted).`);
          } else {
            // Register new command
            await applicationCommands.create({
              name,
              description,
              options,
            });
            console.log(`  ✨ Registered command "${name}".`);
          }
        }
      }
    }

    console.log(`\n✨ Command sync complete!`);
  } catch (error) {
    console.error(`❌ Command sync error: ${error}`);
  }
};