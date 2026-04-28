const express = require('express');
const router = express.Router();
const transactionService = require('../services/transactionService');
const { validateTransaction } = require('../validators/transaction');

router.post('/', (req, res) => {
  const errors = validateTransaction(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const transaction = transactionService.createTransaction(req.body);
  res.status(201).json(transaction);
});

router.get('/', (req, res) => {
  try {
    const transactions = transactionService.getTransactions(req.query);
    res.json(transactions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  const transaction = transactionService.getTransactionById(req.params.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  res.json(transaction);
});

module.exports = router;
