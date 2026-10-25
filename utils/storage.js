
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data.json');

const DEFAULT_GUILD_CONFIG = {
  prefix: '!',

  welcome: {
    enabled: false,
    channelId: null,
    message: 'Bem-vindo(a), {user}, ao servidor {server}!'
  },

  goodbye: {
    enabled: false,
    channelId: null,
    message: 'Até logo, {user}! Obrigado por participar de {server}.'
  },

  logs: {
    securityChannelId: null,
    moderationChannelId: null,
    messageChannelId: null,
    memberChannelId: null
  },

  moderation: {
    enabled: true,
    dmNotifications: true,
    warnThreshold: 3,
    timeoutMinutes: 10
  },

  security: {
    enabled: true,

    antiSpam: {
      enabled: false,
      action: 'delete_warn',
      maxMessages: 5,
      intervalSeconds: 5
    },

    antiRaid: {
      enabled: false,
      action: 'alert',
      maxJoins: 8,
      intervalSeconds: 10
    },

    antiBots: {
      enabled: false,
      action: 'alert',
      allowlistRoleIds: []
    },

    antiLinks: {
      enabled: false,
      action: 'delete_warn',
      allowInvites: false,
      allowedDomains: []
    },

    antiGif: {
      enabled: false,
      action: 'delete',
      exemptChannelIds: [],
      exemptRoleIds: []
    },

    antiImages: {
      enabled: false,
      action: 'delete',
      exemptChannelIds: [],
      exemptRoleIds: []
    },

    antiVideos: {
      enabled: false,
      action: 'delete',
      exemptChannelIds: [],
      exemptRoleIds: []
    },

    antiAttachments: {
      enabled: false,
      action: 'delete',
      exemptChannelIds: [],
      exemptRoleIds: []
    },

    antiWords: {
      enabled: false,
      action: 'delete_warn',
      words: []
    },

    antiGrief: {
      enabled: false,
      action: 'alert',
      threshold: 3,
      intervalSeconds: 10
    },

    antiNuke: {
      enabled: false,
      action: 'alert',
      threshold: 3,
      intervalSeconds: 10
    }
  },

  permissions: {
    configRoleIds: [],
    moderationRoleIds: [],
    securityRoleIds: [],
    supportRoleIds: [],
    roles: {}
  },

  tickets: {
    enabled: false,
    channelId: null,
    categoryId: null,
    supportRoleIds: [],
    maxOpenPerUser: 2,
    privateThreads: false
  },

  ai: {
    enabled: false,
    channelIds: [],
    ticketEnabled: false
  },

  autorole: {
    enabled: false,
    roleIds: []
  }
};

function readData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.writeFileSync(
        DATA_PATH,
        JSON.stringify({ guilds: {} }, null, 2),
        'utf8'
      );
    }

    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed.guilds || typeof parsed.guilds !== 'object') {
      parsed.guilds = {};
    }

    return parsed;
  } catch (error) {
    console.error('[Zyphor Storage] Erro ao ler data.json:', error);
    return { guilds: {} };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    return true;
  } catch (error) {
    console.error('[Zyphor Storage] Erro ao salvar data.json:', error);
    return false;
  }
}

function mergeDefaults(defaults, saved) {
  if (
    !defaults ||
    typeof defaults !== 'object' ||
    Array.isArray(defaults)
  ) {
    return saved === undefined ? defaults : saved;
  }

  const result = { ...defaults };

  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    return result;
  }

  for (const key of Object.keys(saved)) {
    if (
      defaults[key] &&
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = mergeDefaults(defaults[key], saved[key]);
    } else {
      result[key] = saved[key];
    }
  }

  return result;
}

function getGuildConfig(guildId) {
  const data = readData();

  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {};
  }

  const config = mergeDefaults(
    DEFAULT_GUILD_CONFIG,
    data.guilds[guildId]
  );

  data.guilds[guildId] = config;
  writeData(data);

  return config;
}

function updateGuildConfig(guildId, updates) {
  const data = readData();

  const current = mergeDefaults(
    DEFAULT_GUILD_CONFIG,
    data.guilds[guildId] || {}
  );

  const updated = mergeDefaults(current, updates);

  data.guilds[guildId] = updated;

  if (!writeData(data)) {
    throw new Error('Não foi possível salvar a configuração.');
  }

  return updated;
}

module.exports = {
  DEFAULT_GUILD_CONFIG,
  readData,
  writeData,
  getGuildConfig,
  updateGuildConfig
};
