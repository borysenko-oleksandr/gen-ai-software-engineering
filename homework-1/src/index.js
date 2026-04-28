const express = require('express');
const app = express();

app.use(express.json());

app.use('/transactions', require('./routes/transactions'));
app.use('/accounts', require('./routes/accounts'));

app.get('/', (_req, res) => {
  res.json({ service: 'Banking Transactions API', version: '1.0.0' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Banking Transactions API running on http://localhost:${PORT}`);
});
