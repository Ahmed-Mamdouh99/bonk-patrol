require('dotenv').config();

const Discord = require('discord.js');
// Import handlers
const bonkHandler = require('./handlers/bonkHandler');
const clearHandler = require('./handlers/clearHandler');
const {reply} = require('./utils/delayedDelete');


// Create default parameters for bot
const defaultParams = {
  bonk: {
    cooldown:     10000,  // Bonking cool down per user
    duration:     5000,   // Bonking duration
    maxCooldown: 600,
    minCooldown: 5,
    maxDuration: 600,
    minDuration: 5,
  },
  clear: {
    maxClear: 100,    // Maximum number of messages to clear
    minClear:  1       // Min number of messages to clear
  }
}

// Create client
const client = new Discord.Client();

// Guild handlers
const guildHandlers = {};

/**
 * Returns the handlers for a guild object
 * @param {Guild} guild 
 */
const getHandlers = async (guild) => {
  // Check if handlers exist for the guild
  if(!guildHandlers[guild.id]){
    // Add handlers
    guildHandlers[guild.id] = {
      bonk: bonkHandler(defaultParams.bonk),
      clear: clearHandler(defaultParams.clear),
    };
  }
  return guildHandlers[guild.id];
}

// Run when leaving a guild
client.on('guildCreate', getHandlers);

// Run when joining a guild
client.on('guildDelete', async (guild) => {
  if(guildHandlers[guild.id]) {
    delete guildHandlers[guild.id];
  }
});

// Define handlers
client.on('message', async (msg) => {
  // Check if prefix is given
  if(msg.content.startsWith('!')) {
    // Get guild from author
    let handlers;
    try{
      handlers = await getHandlers(msg.member.guild);
    } catch(error) {
      console.error(error);
      return;
    }
    // Split command
    const splitComm = msg.content.split(' ');
    // Check if the command is empty
    if(splitComm.length === 0) {
      return;
    }
    // Get the parent command
    const comm = splitComm[0].substring(1);
    // Execute command
    switch(comm) {
      // Bonk command
      case 'bonk':
        return handlers.bonk(client, msg, splitComm.slice(1));
      // Clear command
      case 'clear':
        return handlers.clear(client, msg, splitComm.slice(1));
      case 'help':
        return sendHelpMessage(msg);
    }
  }
});

/**
 * Send help message to chat
 * @param {*} channel 
 */
const sendHelpMessage = (msg) => {
  const response = [
    '```clear command: ',
    '!bonk help                  | Displays bonk comamnds help.',
    '!clear help                 | Displays clear comamnds help.',
    '!help                       | Displays this list.```',
  ];
  // Return help message
  return reply(msg, response.join('\n'));
}

// Log in
client.login(process.env.TOKEN);
