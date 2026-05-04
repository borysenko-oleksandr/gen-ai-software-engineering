const store = require('../store');

function createTransaction(data) {
  return store.createTransaction(data);
}

function getTransactions({ accountId, type, from, to } = {}) {
  let results = store.getAll();

  if (accountId) {
    results = results.filter(
      (t) => t.fromAccount === accountId || t.toAccount === accountId
    );
  }

  if (type) {
    results = results.filter((t) => t.type === type);
  }

  if (from) {
    const fromDate = new Date(from);
    if (isNaN(fromDate)) throw new Error('Invalid date format for "from"');
    results = results.filter((t) => new Date(t.timestamp) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    if (isNaN(toDate)) throw new Error('Invalid date format for "to"');
    toDate.setHours(23, 59, 59, 999);
    results = results.filter((t) => new Date(t.timestamp) <= toDate);
  }

  return results;
}

function getTransactionById(id) {
  return store.getById(id);
}

module.exports = { createTransaction, getTransactions, getTransactionById };
