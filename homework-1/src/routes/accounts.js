const express = require('express');
const router = express.Router();
const accountService = require('../services/accountService');

router.get('/:accountId/balance', (req, res) => {
  const result = accountService.getBalance(req.params.accountId);
  if (!result) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json(result);
});

router.get('/:accountId/summary', (req, res) => {
  const result = accountService.getSummary(req.params.accountId);
  if (!result) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json(result);
});

module.exports = router;
