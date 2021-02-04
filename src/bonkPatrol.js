require('dotenv').config();
const Discord = require('discord.js');
const readyHandler = require('./handlers/readyHandler');
const messageHandler = require('./handlers/messageHandler');

const client = new Discord.Client();

// Define handlers
client.on('ready', readyHandler(client));
client.on('message', messageHandler(client));

// Log in
client.login(process.env.TOKEN);
// TODO: Document this for the love of god.