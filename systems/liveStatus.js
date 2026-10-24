const { ActivityType } = require('discord.js');

const DEFAULT_ACTIVITIES = [
  {
    name: 'Zyphor Bot',
    type: ActivityType.Playing
  },
  {
    name: 'a segurança do servidor',
    type: ActivityType.Watching
  },
  {
    name: 'comandos /config',
    type: ActivityType.Listening
  }
];

let currentIndex = 0;

function getNextActivity(activities = DEFAULT_ACTIVITIES) {
  if (!Array.isArray(activities) || activities.length === 0) {
    return null;
  }

  const activity = activities[currentIndex % activities.length];
  currentIndex = (currentIndex + 1) % activities.length;

  return activity;
}

async function updateBotStatus(client, activity) {
  if (!client?.user) {
    return {
      success: false,
      message: 'O bot ainda não está conectado.'
    };
  }

  const selected = activity || getNextActivity();

  if (!selected?.name) {
    return {
      success: false,
      message: 'Nenhuma atividade válida foi informada.'
    };
  }

  try {
    client.user.setPresence({
      status: 'online',
      activities: [
        {
          name: String(selected.name).slice(0, 128),
          type: selected.type ?? ActivityType.Playing
        }
      ]
    });

    return {
      success: true,
      message: 'Status atualizado.'
    };
  } catch (error) {
    console.error('[Zyphor Status] Erro:', error);

    return {
      success: false,
      message: 'Não foi possível atualizar o status.'
    };
  }
}

module.exports = {
  DEFAULT_ACTIVITIES,
  getNextActivity,
  updateBotStatus
};
