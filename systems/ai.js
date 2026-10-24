const OpenAI = require('openai');
const { getGuildConfig } = require('../utils/storage');

let openai = null;

function getOpenAI() {
  if (openai) return openai;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  openai = new OpenAI({ apiKey });
  return openai;
}

async function askAI({
  guildId,
  userId,
  channelId,
  question
}) {
  if (!guildId || !userId || !channelId || !question) {
    return {
      success: false,
      message: 'Faltam informações para enviar a pergunta.'
    };
  }

  const config = getGuildConfig(guildId);

  if (!config.ai?.enabled) {
    return {
      success: false,
      message: 'A IA está desativada neste servidor.'
    };
  }

  const allowedChannels = config.ai.channelIds || [];

  if (
    allowedChannels.length > 0 &&
    !allowedChannels.includes(channelId)
  ) {
    return {
      success: false,
      message: 'A IA não está habilitada neste canal.'
    };
  }

  const client = getOpenAI();

  if (!client) {
    return {
      success: false,
      message: 'A chave da API de IA não está configurada no ambiente do bot.'
    };
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      instructions:
        'Você é o assistente de IA do Zyphor Bot. ' +
        'Responda em português brasileiro por padrão. ' +
        'Seja útil, respeitoso e objetivo. ' +
        'Não afirme que executou ações no Discord sem confirmação real.',
      input: String(question).slice(0, 6000),
      max_output_tokens: 700
    });

    const answer = response.output_text?.trim();

    if (!answer) {
      return {
        success: false,
        message: 'A IA não retornou uma resposta. Tente novamente.'
      };
    }

    return {
      success: true,
      answer: answer.slice(0, 4000)
    };
  } catch (error) {
    console.error('[Zyphor AI] Erro na API:', error.message);

    return {
      success: false,
      message: 'Não foi possível obter uma resposta da IA agora.'
    };
  }
}

module.exports = {
  askAI
};
