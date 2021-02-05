const MAX_COOLDOWN = 60;
const MIN_COOLDOWN = 5;
const MAX_DURATION = 60;
const MIN_DURATION = 5;

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
  return msg.reply(response.join('\n'));
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
  if(mentionIds !== 1 || splitComm.length !== 2) {
    console.log(1);
    return sendHelpMessage(msg);
  }
  // Get the target
  let target;
  try{
    target = await msg.member.guild.members.fetch(mentionIds[0]);
  }catch(error) {
    return msg.reply("Can't unbonk. Can't find user.");
  }
  return unbonkHelper(client, target, bonked, msg, jailChannel);
}

const unbonkHelper = async (client, target, bonked, msg, jailChannel) => {
    // Check if the user is bonked
    if(!bonked[target.id]) {
      return msg.reply(`<@${target.id}> is not bonked`);
    }
    // Check if the bot has permission to move members
    try {
      const botMember = await msg.guild.members.fetch(client.user.id);
      if(!botMember.hasPermission('MOVE_MEMBERS')) {
        return msg.reply(`Instructions unclear, I don't have permission to unbonk.`);  
      }
    } catch(error) {
      console.error(error);
      return msg.reply(`Instructions unclear, bat stuck in error.`);
    }
    // Check if the target is still in a jail
    if((!target.voice.channel) || target.voice.channel !== jailChannel) {
      return msg.reply(`<@${target.id}> is not in a voice channel`);
    }
    // Unbonk user
    try{
      target.voice.setChannel(bonked[target.id]);
      // Delete user from bonked table
      return delete bonked[target.id];
    } catch(error) {
      console.error(error);
      return msg.channel.send(`<@${target.id}> you've been extra horny, I can't unbonk you`);
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
    return msg.reply("You're on cooldown. Can't bonk yet.");
  }
  // Check if you have the permission to move users
  try{
    const botMember = await msg.guild.members.fetch(client.user.id);
    if(!botMember.hasPermission("MOVE_MEMBERS")) {
      return msg.channel.send(`<@${msg.author.id}> Instructions unclear, I don't have permission to bonk.`);  
    }
  } catch(error) {
    console.error(error);
    return msg.channel.send(`<@${msg.author.id}> Instructions unclear, bat stuck in error.`);
  }
  // Check if bonking yourself
  if(mentionId == client.user.id) {
    return msg.reply(`The Bonk Patrol cannot self bonk.`);
  }
  // Get the target user
  let target;
  try {
    target = await msg.guild.members.fetch(mentionId);
  } catch(error) {
    msg.channel.send(`<@${target.id}>... You.. You are not like the others... What are you?`);
    console.error(error);
    return;
  }
  // Check if the target is in a voice channel 
  if(!target.voice.channel) {
    return msg.reply(`you fool. <@${target}> is not in a voice channel.`);
  }
  // Check if the target is already bonked
  if(bonked[target] || target.voice.channel === jailChannel) {
    return msg.reply(`stop he's already dead.`);
  }
  // Check if the jail channel is set
  if(!jailChannel) {
    return msg.reply(`Cannot bonk without a jail`);
  }
  // Bonk
  try {
    // Get the current channel
    const oldChannel = target.voice.channel;
    // Bonk target
    await target.voice.setChannel(jailChannel);
    // Send message
    msg.channel.send(`Bonk, <@${mentionId}> go to jail!`);
    // Set old channel in bonked table
    bonked[target.id] = oldChannel;
    // Set cooldown to true
    cooldown[msg.author.id] = true;
    // Set callbacks
    setTimeout(() => unbonkHelper(client, target, bonked, msg, jailChannel), params.duration);
    setTimeout(() => delete cooldown[msg.author.id], params.cooldown);
  } catch(error) {
    console.error(error);
    return msg.channel.send(`<@${target}>... You.. You are not like the others... What are you?`);
  }
}

const handleCooldown = async (msg, params, args) => {
  // If no arguments are supplied, show current cooldown
  if(args.length === 0) {
    return msg.reply(`The current cooldown on bonking is ${~~(params.cooldown / 1000)}seconds.`);
  }
  // Parse the new value
  const newValue = Number(args[0]);
  if(isNaN(newValue)) {
    return msg.reply(`The value ${args[0]} is not a number.`);
  }
  if(MAX_COOLDOWN < newValue || MIN_COOLDOWN < newValue) {
    return msg.reply(`Cooldown has to be between ${MIN_COOLDOWN} and ${MAX_COOLDOWN}`);
  }
  params[cooldown] = newValue * 1000;
}

const handleDuration = async (msg, params, args) => {
  // If no arguments are supplied, show current duration
  if(args.length === 0) {
    return msg.reply(`The current duration for bonking is ${~~(params.duration / 1000)}seconds.`);
  }
  // Parse the new value
  const newValue = Number(args[0]);
  if(isNaN(newValue)) {
    return msg.reply(`The value ${args[0]} is not a number.`);
  }
  if(MAX_DURATION < newValue || MIN_DURATION < newValue) {
    return msg.reply(`Duration has to be between ${MIN_DURATION} and ${MAX_DURATION}`);
  }
  params[duration] = newValue * 1000;
}


/**
 * Search for jail channel
 * @param {*} guild 
 * @param {*} name 
 */
const setJail = (msg, jailName) => {
  const jailChannel = msg.member.guild.channels.cache.reduce((a,b) => b.name.toLowerCase() === jailName? b:a, null);
  if(jailChannel) {
    msg.reply(`Set Jail channel to ${jailChannel.name}`);
  } else {
    msg.reply(`Could not find channel ${jailName}`);
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
    if(splitComm.length === 0) {
      // Post help message
      console.log(2);
      return sendHelpMessage(msg);
    }
    // Check the sub command
    switch(splitComm[0]) {
      case 'help':
        console.log(3);
        return sendHelpMessage(msg);
      case 'u':
        return unbonk(client, msg, splitComm.slice(1), bonked, jailChannel);
      case 'cooldown':
        return handleCooldown(client, msg, splitComm.slice(1), params);
      case 'duration':
        return handleDuration(client, msg, splitComm.slice(1), params);
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