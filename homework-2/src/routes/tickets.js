const express = require('express');
const multer = require('multer');
const router = express.Router();
const store = require('../utils/store');
const { validateTicket, createTicket } = require('../models/ticket');
const { classify } = require('../services/classifier');
const { importJson, importCsv, importXml } = require('../services/importer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /tickets
router.post('/', async (req, res) => {
  const errors = validateTicket(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });

  let ticket = createTicket(req.body);

  if (req.query.auto_classify === 'true') {
    const result = classify(ticket);
    ticket = { ...ticket, ...result };
  }

  store.save(ticket);
  return res.status(201).json(ticket);
});

// GET /tickets
router.get('/', (req, res) => {
  let all = store.getAll();
  const { category, priority, status } = req.query;
  if (category) all = all.filter(t => t.category === category);
  if (priority) all = all.filter(t => t.priority === priority);
  if (status)   all = all.filter(t => t.status === status);
  return res.json(all);
});

// GET /tickets/:id
router.get('/:id', (req, res) => {
  const ticket = store.getById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  return res.json(ticket);
});

// PUT /tickets/:id
router.put('/:id', (req, res) => {
  const ticket = store.getById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  // Merge and validate
  const merged = { ...ticket, ...req.body };
  const errors = validateTicket(merged);
  if (errors.length > 0) return res.status(400).json({ errors });

  const updated = store.update(req.params.id, req.body);
  return res.json(updated);
});

// DELETE /tickets/:id
router.delete('/:id', (req, res) => {
  const ticket = store.getById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  store.remove(req.params.id);
  return res.status(200).json({ message: 'Ticket deleted' });
});

// POST /tickets/:id/auto-classify
router.post('/:id/auto-classify', (req, res) => {
  const ticket = store.getById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const result = classify(ticket);
  const updated = store.update(req.params.id, result);
  return res.json({ ...result, ticket: updated });
});

// POST /tickets/import
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded. Use multipart/form-data with field name "file".' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  let rawRecords;

  try {
    if (ext === 'json') {
      rawRecords = importJson(req.file.buffer);
    } else if (ext === 'csv') {
      rawRecords = importCsv(req.file.buffer);
    } else if (ext === 'xml') {
      rawRecords = await importXml(req.file.buffer);
    } else {
      return res.status(400).json({ error: `Unsupported file format: ${ext}. Use csv, json, or xml.` });
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  let successful = 0;
  const failed = [];
  const autoClassify = req.query.auto_classify === 'true';

  for (let i = 0; i < rawRecords.length; i++) {
    const raw = rawRecords[i];
    const errors = validateTicket(raw);
    if (errors.length > 0) {
      failed.push({ row: i + 1, errors });
      continue;
    }
    let ticket = createTicket(raw);
    if (autoClassify) {
      const result = classify(ticket);
      ticket = { ...ticket, ...result };
    }
    store.save(ticket);
    successful++;
  }

  return res.json({ total: rawRecords.length, successful, failed });
});

module.exports = router;
