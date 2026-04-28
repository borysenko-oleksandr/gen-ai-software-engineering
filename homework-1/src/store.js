const { v4: uuidv4 } = require('uuid');

const transactions = [];

function createTransaction(data) {
  const transaction = {
    id: uuidv4(),
    fromAccount: data.fromAccount || null,
    toAccount: data.toAccount || null,
    amount: data.amount,
    currency: data.currency.toUpperCase(),
    type: data.type,
    timestamp: new Date().toISOString(),
    status: 'completed',
  };
  transactions.push(transaction);
  return transaction;
}

function getAll() {
  return transactions;
}

function getById(id) {
  return transactions.find((t) => t.id === id) || null;
}

module.exports = { createTransaction, getAll, getById };
