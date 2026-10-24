const deletedMessages = new Map();

const MAX_MESSAGES = 500;
const MESSAGE_TTL = 60 * 60 * 1000;

function rememberMessage(message) {
  if (!message?.guild || !message.id || !message.author) return false;
  if (message.author.bot) return false;

  const content = {
    id: message.id,
    guildId: message.guild.id,
    channelId: message.channelId,
    authorId: message.author.id,
    authorTag: message.author.tag || message.author.username,
    content: message.content || '',
    attachments: [...message.attachments.values()].map(file => ({
      name: file.name,
      url: file.url,
      contentType: file.contentType || null
    })),
    createdAt: message.createdAt?.toISOString() || new Date().toISOString(),
    deletedAt: new Date().toISOString()
  };

  deletedMessages.set(message.id, content);

  while (deletedMessages.size > MAX_MESSAGES) {
    const oldestId = deletedMessages.keys().next().value;
    deletedMessages.delete(oldestId);
  }

  return true;
}

function getDeletedMessage(messageId) {
  const message = deletedMessages.get(messageId);

  if (!message) return null;

  const age = Date.now() - new Date(message.deletedAt).getTime();

  if (age > MESSAGE_TTL) {
    deletedMessages.delete(messageId);
    return null;
  }

  return message;
}

function getRecentDeletedMessages(guildId, limit = 10) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));

  return [...deletedMessages.values()]
    .filter(message => message.guildId === guildId)
    .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt))
    .slice(0, safeLimit);
}

function clearDeletedMessages(guildId) {
  for (const [messageId, message] of deletedMessages) {
    if (message.guildId === guildId) {
      deletedMessages.delete(messageId);
    }
  }
}

module.exports = {
  rememberMessage,
  getDeletedMessage,
  getRecentDeletedMessages,
  clearDeletedMessages
};
