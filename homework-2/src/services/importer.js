const { parse: parseCsv } = require('csv-parse/sync');
const { parseStringPromise } = require('xml2js');

function importJson(buffer) {
  let data;
  try {
    data = JSON.parse(buffer.toString('utf8'));
  } catch {
    throw new Error('Invalid JSON: could not parse file');
  }
  if (!Array.isArray(data)) throw new Error('Invalid JSON: root element must be an array');
  return data;
}

function importCsv(buffer) {
  let records;
  try {
    records = parseCsv(buffer.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new Error(`Invalid CSV: ${err.message}`);
  }
  return records.map(row => {
    // Deserialize nested metadata and tags from CSV string fields
    const ticket = { ...row };
    if (typeof ticket.tags === 'string') {
      try { ticket.tags = JSON.parse(ticket.tags); } catch { ticket.tags = ticket.tags ? ticket.tags.split('|') : []; }
    }
    if (typeof ticket.metadata === 'string') {
      try { ticket.metadata = JSON.parse(ticket.metadata); } catch { ticket.metadata = {}; }
    }
    return ticket;
  });
}

async function importXml(buffer) {
  let parsed;
  try {
    parsed = await parseStringPromise(buffer.toString('utf8'), { explicitArray: false, trim: true });
  } catch (err) {
    throw new Error(`Invalid XML: ${err.message}`);
  }

  const root = parsed.tickets || parsed.root || parsed;
  const items = root.ticket;
  if (!items) throw new Error('Invalid XML: no <ticket> elements found');
  const arr = Array.isArray(items) ? items : [items];

  return arr.map(item => {
    const ticket = { ...item };
    // Unwrap metadata sub-object
    if (ticket.metadata && typeof ticket.metadata === 'object') {
      ticket.metadata = { ...ticket.metadata };
    }
    // Unwrap tags
    if (ticket.tags && typeof ticket.tags === 'object') {
      const tagVal = ticket.tags.tag;
      ticket.tags = tagVal ? (Array.isArray(tagVal) ? tagVal : [tagVal]) : [];
    }
    if (typeof ticket.tags === 'string') {
      ticket.tags = ticket.tags ? ticket.tags.split('|') : [];
    }
    return ticket;
  });
}

module.exports = { importJson, importCsv, importXml };
