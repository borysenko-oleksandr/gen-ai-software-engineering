const store = require('../store');

function getAccountTransactions(accountId) {
  return store.getAll().filter(
    (t) => t.fromAccount === accountId || t.toAccount === accountId
  );
}

function calcBalance(accountId, transactions) {
  return transactions.reduce((balance, t) => {
    if (t.toAccount === accountId) balance += t.amount;
    if (t.fromAccount === accountId) balance -= t.amount;
    return balance;
  }, 0);
}

function getBalance(accountId) {
  const txs = getAccountTransactions(accountId);
  if (txs.length === 0) return null;

  return {
    accountId,
    balance: Math.round(calcBalance(accountId, txs) * 100) / 100,
  };
}

function getSummary(accountId) {
  const txs = getAccountTransactions(accountId);
  if (txs.length === 0) return null;

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let mostRecentDate = null;

  for (const t of txs) {
    if (t.toAccount === accountId) totalDeposits += t.amount;
    if (t.fromAccount === accountId) totalWithdrawals += t.amount;

    const d = new Date(t.timestamp);
    if (!mostRecentDate || d > mostRecentDate) mostRecentDate = d;
  }

  return {
    accountId,
    totalDeposits: Math.round(totalDeposits * 100) / 100,
    totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
    transactionCount: txs.length,
    mostRecentTransaction: mostRecentDate ? mostRecentDate.toISOString() : null,
  };
}

module.exports = { getBalance, getSummary };
