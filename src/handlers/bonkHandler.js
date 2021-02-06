const {reply, send} = require('../utils/delayedDelete');

/**
 * Send help message to chat
 * @param {*} channel 
 */
const sendHelpMessage = (msg) => {
  const response = [
    '```bonk command: ',
    '!bonk @someone             | bonk someone.',
    '!bonk u @someone           | unbonk someone.',
    '!bonk cooldown             | shows the current bonk cooldown.',
    '!bonk cooldown s           | sets the current bonk cooldown in seconds.',
    '!bonk duration             | shows the current bonk duration.',
    '!bonk duration s           | sets the current bonk duration in seconds.',
    '!bonk set-jail <jail name> | sets the jail channel.',
    '!bonk help                 | Shows this sub list.```',
  ];
  // Return help message
  return reply(msg, response.join('\n'));
}

/**
 * Unbonks a user
 * @param {Client} client 
 * @param {Message} msg 
 * @param {String[]} splitComm String of the rest 
 * @param {*} params Handler parameters
 */
const unbonk = async (client, msg, splitComm, bonked, jailChannel) => {
  // Get id of the unbonked user
  const mentionIds = msg.mentions.users.map(e => e.id);
  if(mentionIds.length !== 1 || splitComm.length !== 1) {
    return sendHelpMessage(msg);
  }
  // Get the target
  let target;
  try{
    target = await msg.member.guild.members.fetch(mentionIds[0]);
  }catch(error) {
    return reply(msg, "Can't unbonk. Can't find user.");
  }
  return unbonkHelper(client, target, bonked, msg, jailChannel);
}

const unbonkHelper = async (client, target, bonked, msg, jailChannel) => {
  // Check if the user is bonked
  if(!bonked[target.id]) {
    return reply(msg, `<@${target.id}> is not bonked`);
  }
  // Check if the bot has permission to move members
  try {
    const botMember = await msg.guild.members.fetch(client.user.id);
    if(!botMember.hasPermission('MOVE_MEMBERS')) {
      return reply(msg, `Instructions unclear, I don't have permission to unbonk.`);  
    }
  } catch(error) {
    console.error(error);
    return reply(msg, `Instructions unclear, bat stuck in error.`);
  }
  // Check if the target is still in a jail
  if((!target.voice.channel) || target.voice.channel !== jailChannel) {
    return reply(msg, `<@${target.id}> is not in a voice channel`);
  }
  // Unbonk user
  try{
    target.voice.setChannel(bonked[target.id]);
    // Delete user from bonked table
    return delete bonked[target.id];
  } catch(error) {
    console.error(error);
    return send(msg, `<@${target.id}> you've been extra horny, I can't unbonk you`);
  }
}

/**
 * 
 * @param {*} client DiscordJS Client
 * @param {*} msg DiscordJS Message Object
 * @param {*} mentionId User ID for target
 * @param {*} params handler parameters
 * @param {*} bonked bonked table
 * @param {*} cooldown cooldown table
 */
const bonk = async (client, msg, mentionId, params, bonked, cooldown, jailChannel) => {
  // Check if the user is on cooldown
  if(cooldown[msg.author.id]) {
    return reply(msg, "You're on cooldown. Can't bonk yet.");
  }
  // Check if you have the permission to move users
  try{
    const botMember = await msg.guild.members.fetch(client.user.id);
    if(!botMember.hasPermission("MOVE_MEMBERS")) {
      return reply(msg, `<@${msg.author.id}> Instructions unclear, I don't have permission to bonk.`);  
    }
  } catch(error) {
    console.error(error);
    return reply(msg, `<@${msg.author.id}> Instructions unclear, bat stuck in error.`);
  }
  // Check if bonking yourself
  if(mentionId == client.user.id) {
    return reply(msg, `The Bonk Patrol cannot self bonk.`);
  }
  // Get the target user
  let target;
  try {
    target = await msg.guild.members.fetch(mentionId);
  } catch(error) {
    send(msg, `<@${target.id}>... You.. You are not like the others... What are you?`);
    console.error(error);
    return;
  }
  // Check if the target is in a voice channel 
  if(!target.voice.channel) {
    return reply(msg, `you fool. <@${target}> is not in a voice channel.`);
  }
  // Check if the target is already bonked
  if(bonked[target] || target.voice.channel === jailChannel) {
    return reply(msg, `stop he's already dead.`);
  }
  // Check if the jail channel is set
  if(!jailChannel) {
    return reply(msg, `Cannot bonk without a jail`);
  }
  // Bonk
  try {
    // Get the current channel
    const oldChannel = target.voice.channel;
    // Bonk target
    await target.voice.setChannel(jailChannel);
    // Send message
    send(msg, `Bonk, <@${mentionId}> go to jail!`, 10000);
    // Set old channel in bonked table
    bonked[target.id] = oldChannel;
    // Set cooldown to true
    cooldown[msg.author.id] = true;
    // Set callbacks
    setTimeout(() => unbonkHelper(client, target, bonked, msg, jailChannel), params.duration);
    setTimeout(() => delete cooldown[msg.author.id], params.cooldown);
  } catch(error) {
    console.error(error);
    return send(msg, `<@${target}>... You.. You are not like the others... What are you?`);
  }
}

/**
 * Handles cooldown commands
 * @param {*} msg 
 * @param {*} params 
 * @param {*} args 
 */
const handleCooldown = async (msg, params, args) => {
  // If no arguments are supplied, show current cooldown
  if(args.length === 0) {
    return reply(msg, `The current cooldown on bonking is ${~~(params.cooldown / 1000)} seconds.`);
  }
  // Parse the new value
  const newValue = Number(args[0]);
  if(isNaN(newValue)) {
    return reply(msg, `The value ${args[0]} is not a number.`);
  }
  if(params.maxCooldown < newValue || newValue < params.minCooldown) {
    return reply(msg, `Cooldown has to be between ${params.minCooldown} and ${params.maxCooldown}`);
  }
  params.cooldown = newValue * 1000;
  return reply(msg, `Cooldown is now ${newValue} seconds`);
}

/**
 * Handles durion commands
 * @param {*} msg 
 * @param {*} params 
 * @param {*} args 
 */
const handleDuration = async (msg, params, args) => {
  // If no arguments are supplied, show current duration
  if(args.length === 0) {
    return reply(msg, `The current duration for bonking is ${~~(params.duration / 1000)} seconds.`);
  }
  // Parse the new value
  const newValue = Number(args[0]);
  if(isNaN(newValue)) {
    return reply(msg, `The value ${args[0]} is not a number.`);
  }
  if(params.maxDuration < newValue || newValue < params.minDuration) {
    return reply(msg, `Duration has to be between ${params.minDuration} and ${params.maxDuration}`);
  }
  params.duration = newValue * 1000;
  return reply(msg, `Duration is now ${newValue} seconds`);
}


/**
 * Search for jail channel
 * @param {*} guild 
 * @param {*} name 
 */
const setJail = (msg, jailName) => {
  const jailChannel = msg.member.guild.channels.cache.reduce((a,b) => b.name.toLowerCase() === jailName? b:a, null);
  if(jailChannel) {
    reply(msg, `Set jail channel to ${jailChannel.name}`);
  } else {
    reply(msg, `Could not find channel ${jailName}`);
  }
  return jailChannel;
}


/**
 * Returns a handler function
 * @param {Handler parameters} params 
 */
module.exports = (params) => {
  // Create bonked object
  const bonked = {};
  const cooldown = {};
  let jailChannel;
  // Return handler
  return async (client, msg, splitComm) => {
    // Making sure only users in a voice channel can use the bot
    if(msg.member.voice.channel && msg.member.voice.channel.type.toLowerCase() !== 'voice') {
      return reply(msg, `You need to be in a voice channel to use the bonk commands.`);
    }
    // Make sure only users with permission to move users can use the bonk handler
    if(!msg.member.hasPermission('MOVE_MEMBERS')) {
      return reply(msg, 'You need to have permission to move members to use the bonk comands.');
    }
    if(splitComm.length === 0) {
      // Post help message
      return sendHelpMessage(msg);
    }
    // Check the sub command
    switch(splitComm[0]) {
      case 'help':
        return sendHelpMessage(msg);
      case 'u':
        return unbonk(client, msg, splitComm.slice(1), bonked, jailChannel);
      case 'cooldown':
        return handleCooldown(msg, params, splitComm.slice(1));
      case 'duration':
        return handleDuration(msg, params, splitComm.slice(1));
      case 'set-jail':
        jailChannel = setJail(msg, splitComm.slice(1).join(' ')) || jailChannel;
        return;
    }
    // Bonk
    if(splitComm.length == 1) {
      const mentionIds = msg.mentions.users.map(e => e.id);
      if(mentionIds.length === 1) {
        return bonk(client, msg, mentionIds[0], params, bonked, cooldown, jailChannel);
      }
    }
    // Something wrong, send help message
    sendHelpMessage(msg);
  }
}