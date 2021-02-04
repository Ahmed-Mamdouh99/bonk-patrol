
const bonk = async (msg, client) => {
  try{
    const botMember = await msg.guild.members.fetch(client.user.id);
    if(!botMember.hasPermission("MOVE_MEMBERS")) {
      msg.channel.send(`<@${msg.author.id}> Instructions unclear, I don't have permission to bonk.`);  
      return;
    }
  } catch(error) {
    msg.channel.send(`<@${msg.author.id}> Instructions unclear, bat stuck in error.`);
    console.error(error);
    return;
  }
  
  const mentionIds = msg.mentions.users.map(e => e.id);
  if(mentionIds.length == 0) {
    return;
  }
  const mentionId = mentionIds[0];
  if(mentionId == client.user.id) {
    msg.channel.send(`<@${msg.author.id}> The Bonk Patrol cannot self bonk.`);
    return;
  }
  let target;
  try {
    target = await msg.guild.members.fetch(mentionId);
  } catch(error) {
    msg.channel.send(`<@${target}>... You.. You are not like the others... What are you?`);
    console.error(error);
    return;
  }
  if(!target.voice.channel) {
    msg.channel.send(`<@${msg.author.id}>, you fool. <@${target}> is not in a voice channel.`);
    return;
  }
  let bonkChannel = null;
  try{
    bonkChannel = msg.guild.channels.cache.reduce((a,b) => b.name === 'jail'?b:a, null);
  } catch(error) {
    msg.channel.send(`<@${msg.author.id}>... You.. Where did you hide the jail?`);
    console.error(error);
    return;
  }
  if(!bonkChannel) {
    msg.channel.send(`<@${msg.author.id}> I need a jail channel to bonk.`);
    return; 
  }
  if(bonkChannel.type !== 'voice') {
    msg.channel.send(`<@${msg.author.id}>, you fool. jail is not a voice channe.`);
    return;
  }
  const oldChannel = target.voice.channel;
  if(oldChannel === bonkChannel) {
    msg.channel.send(`<@${msg.author.id}>, stop it he's already dead.`);
    return;
  }
  try{
    await target.voice.setChannel(bonkChannel);
    msg.channel.send(`Bonk, <@${mentionId}> go to jail!`);
    setTimeout(() => unbonk(target, oldChannel, bonkChannel, msg.channel), 5000);
  } catch(error) {
    msg.channel.send(`<@${target}>... You.. You are not like the others... What are you?`);
    console.error(error);
    return;
  } 
}

const unbonk = async (target, oldChannel, bonkChannel, msgChannel) => {
  try{
    const botMember = await msg.guild.members.fetch(client.user.id);
    if(!botMember.hasPermission("MOVE_MEMBERS")) {
      msg.channel.send(`<@${msg.author.id}> Instructions unclear, I don't have permission to unbonk.`);  
      return;
    }
  } catch(error) {
    msg.channel.send(`<@${msg.author.id}> Instructions unclear, bat stuck in error.`);
    console.error(error);
    return;
  }
  if(target.voice.channel !== bonkChannel) {
    return;
  }
  try {
    target.voice.setChannel(oldChannel);
  } catch(error) {
    msgChannel.send(`<@${target.id}> you've been extra horny, I can't unbonk you`);
    console.error(error);
    return;
  }
}

module.exports = (client) => (msg) => {
  if(msg.content.startsWith('!')) {
    const splitComm = msg.content.split(' ');
    if(splitComm.length > 0) {
      const comm = splitComm[0].substring(1);
      switch(comm) {
        case 'bonk':
          bonk(msg, client);
          break;
      }
    }
  }
}