const defaultDelay = 0; // 5 minutes

const delayedDelete = async (msg1, msg2, delay, delete2) => {
  return setTimeout(async () => {
    try {
        msg1.delete();
      if(delete2) {
        msg2.delete();
      }
    } catch(error) {
      console.error(error);
    }
  }, delay);
}


module.exports = {
  /**
   * Reply and delete message and reply after a delay
   * @param {*} msg 
   * @param {*} res 
   * @param {*} delay 
   * @param {*} deleteMessage whether to delete the original message or just the reply
   */
  reply: async (msg, res, delay=defaultDelay, deleteMessage=false) => {
    try{
      // Send reply
      const reply = await msg.reply(res);
      return delayedDelete(msg, reply, delay, deleteMessage);
    } catch(error) {
      return console.error(error);
    }
  },

    /**
   * Send and delete message and reply after a delay
   * @param {*} msg 
   * @param {*} res 
   * @param {*} delay 
   * @param {*} deleteMessage whether to delete the original message or just the reply
   */
  send:  async (msg, res, delay=defaultDelay, deleteMessage=true) => {
    try{
      // Send reply
      const reply = await msg.channel.send(res);
      return delayedDelete(msg, reply, delay, deleteMessage);
    } catch(error) {
      return console.error(error);
    }
  }
}