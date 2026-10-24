const { readData, writeData } = require('../utils/storage');

const DAILY_REWARD = 100;
const WORK_MIN = 20;
const WORK_MAX = 80;
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000;
const WORK_COOLDOWN = 60 * 60 * 1000;

function ensureEconomy(data) {
  if (!data.economy) data.economy = {};
  return data.economy;
}

function getAccount(guildId, userId) {
  const data = readData();
  const economy = ensureEconomy(data);

  if (!economy[guildId]) economy[guildId] = {};
  if (!economy[guildId][userId]) {
    economy[guildId][userId] = {
      balance: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0
    };
  }

  return economy[guildId][userId];
}

function getBalance(guildId, userId) {
  const account = getAccount(guildId, userId);

  return {
    wallet: account.balance,
    bank: account.bank,
    total: account.balance + account.bank
  };
}

function claimDaily(guildId, userId) {
  const data = readData();
  const economy = ensureEconomy(data);

  if (!economy[guildId]) economy[guildId] = {};
  if (!economy[guildId][userId]) {
    economy[guildId][userId] = {
      balance: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0
    };
  }

  const account = economy[guildId][userId];
  const now = Date.now();
  const remaining = DAILY_COOLDOWN - (now - account.lastDaily);

  if (remaining > 0) {
    return {
      success: false,
      remaining,
      message: 'Você já resgatou sua recompensa diária.'
    };
  }

  account.balance += DAILY_REWARD;
  account.lastDaily = now;

  writeData(data);

  return {
    success: true,
    amount: DAILY_REWARD,
    balance: account.balance
  };
}

function work(guildId, userId) {
  const data = readData();
  const economy = ensureEconomy(data);

  if (!economy[guildId]) economy[guildId] = {};
  if (!economy[guildId][userId]) {
    economy[guildId][userId] = {
      balance: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0
    };
  }

  const account = economy[guildId][userId];
  const now = Date.now();
  const remaining = WORK_COOLDOWN - (now - account.lastWork);

  if (remaining > 0) {
    return {
      success: false,
      remaining,
      message: 'Você precisa esperar antes de trabalhar novamente.'
    };
  }

  const amount =
    Math.floor(Math.random() * (WORK_MAX - WORK_MIN + 1)) + WORK_MIN;

  account.balance += amount;
  account.lastWork = now;

  writeData(data);

  return {
    success: true,
    amount,
    balance: account.balance
  };
}

function deposit(guildId, userId, amount) {
  const value = Math.floor(Number(amount));

  if (!Number.isSafeInteger(value) || value <= 0) {
    return { success: false, message: 'Informe um valor positivo válido.' };
  }

  const data = readData();
  const economy = ensureEconomy(data);

  if (!economy[guildId]) economy[guildId] = {};
  if (!economy[guildId][userId]) {
    economy[guildId][userId] = {
      balance: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0
    };
  }

  const account = economy[guildId][userId];

  if (account.balance < value) {
    return { success: false, message: 'Saldo insuficiente na carteira.' };
  }

  account.balance -= value;
  account.bank += value;

  writeData(data);

  return {
    success: true,
    balance: account.balance,
    bank: account.bank
  };
}

function withdraw(guildId, userId, amount) {
  const value = Math.floor(Number(amount));

  if (!Number.isSafeInteger(value) || value <= 0) {
    return { success: false, message: 'Informe um valor positivo válido.' };
  }

  const data = readData();
  const economy = ensureEconomy(data);

  if (!economy[guildId]?.[userId]) {
    return { success: false, message: 'Você ainda não possui uma conta.' };
  }

  const account = economy[guildId][userId];

  if (account.bank < value) {
    return { success: false, message: 'Saldo insuficiente no banco.' };
  }

  account.bank -= value;
  account.balance += value;

  writeData(data);

  return {
    success: true,
    balance: account.balance,
    bank: account.bank
  };
}

module.exports = {
  getAccount,
  getBalance,
  claimDaily,
  work,
  deposit,
  withdraw
};
