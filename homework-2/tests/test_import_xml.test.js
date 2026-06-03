const path = require('path');
const { importXml } = require('../src/services/importer');
const fs = require('fs');

const fixturePath = name => path.join(__dirname, 'fixtures', name);

describe('XML import', () => {
  test('parses valid XML file and returns array', async () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.xml'));
    const records = await importXml(buffer);
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(30);
  });

  test('first record has required fields', async () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.xml'));
    const records = await importXml(buffer);
    expect(records[0]).toHaveProperty('customer_id');
    expect(records[0]).toHaveProperty('customer_email');
  });

  test('parses tags as array', async () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.xml'));
    const records = await importXml(buffer);
    expect(Array.isArray(records[0].tags)).toBe(true);
  });

  test('throws on malformed XML', async () => {
    const buffer = fs.readFileSync(fixturePath('invalid_tickets.xml'));
    await expect(importXml(buffer)).rejects.toThrow(/Invalid XML/);
  });

  test('throws when no ticket elements found', async () => {
    const buffer = Buffer.from('<?xml version="1.0"?><tickets></tickets>');
    await expect(importXml(buffer)).rejects.toThrow(/no <ticket> elements/);
  });
});
