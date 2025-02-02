require('dotenv').config();
const { Client, IntentsBitField, ActivityType } = require('discord.js');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', (c) =>{
  client.user.setActivity({
    name: 'Connexion',
    type: ActivityType.Streaming,
    url: 'https://www.youtube.com/watch?v=uWABHIwl4Gk',
  })
  });

(async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI, {keepAlive:true});
    console.log('Connected to DB.');
    eventHandler(client);
    client.login(process.env.TOKEN);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
})();
