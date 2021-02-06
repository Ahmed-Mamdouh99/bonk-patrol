const {reply} = require('../utils/delayedDelete');

/**
 * Send help message to chat
 * @param {*} channel 
 */
const sendHelpMessage = (msg) => {
  const response = [
    '```clear command: ',
    '!clear N                   | Clears N messages.',
    '!bonk help                 | Shows this sub list.```',
  ];
  // Return help message
  return reply(msg, response.join('\n'));
}

/**
 * Returns a handler function
 * @param {Handler parameters} params 
 */
module.exports = (params) => {
  // Return handler
  return async (client, msg, splitComm) => {
    // Make sure the user has permission to manage messages
    if(!msg.member.hasPermission('MANAGE_MESSAGES') || !msg.member.hasPermission('READ_MESSAGE_HISTORY')) {
      return reply(msg, 'You Manage Messages permission to use the clean commands.');
    }
    // Check if you have the permission to delete messages and see history
    try{
      const botMember = await msg.guild.members.fetch(client.user.id);
      if(!botMember.hasPermission('MANAGE_MESSAGES')) {
        return reply(msg, "I don't have permission to manage messages.");
      }
      if(!botMember.hasPermission('READ_MESSAGE_HISTORY')) {
        return reply(msg, "I don't have permission to read message history.");
      }
    } catch(error) {
      console.error(error);
      return reply(msg, `Something went wrong checking permissions.`);
    }
    if(splitComm.length !== 1) {
      // Post help message
      return sendHelpMessage(msg);
    }
    const numToDelete = splitComm[0];
    if(numToDelete === 'help') {
      return sendHelpMessage(msg);
    }
    if(isNaN(numToDelete)) {
      return reply(msg, `${notToDelete} is not a number.`);
    }
    if(params.maxClear < numToDelete || numToDelete < params.minClear) {
      return reply(msg, `can only delete between ${params.minClear} - ${params.maxClear} messages.`);
    }
    // Clear messages
    let deleted;
    try {
      deleted = await msg.channel.bulkDelete(Number(numToDelete)+1);
    } catch(error) {
      console.error(error);
      return reply('Something went wrong. Could not delete all messages');
    }
    // Send reply
    return msg.reply(`Cleared ${deleted.array().length-1} messages!`);
  }
}