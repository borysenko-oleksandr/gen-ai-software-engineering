const path = require('path');
const { importJson } = require('../src/services/importer');
const fs = require('fs');

const fixturePath = name => path.join(__dirname, 'fixtures', name);

describe('JSON import', () => {
  test('parses valid JSON file and returns array', () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.json'));
    const records = importJson(buffer);
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(20);
  });

  test('first record has required fields', () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.json'));
    const records = importJson(buffer);
    expect(records[0]).toHaveProperty('customer_id');
    expect(records[0]).toHaveProperty('customer_email');
  });

  test('throws on invalid JSON syntax', () => {
    const buffer = fs.readFileSync(fixturePath('invalid_tickets.json'));
    expect(() => importJson(buffer)).toThrow(/Invalid JSON/);
  });

  test('throws when JSON root is not an array', () => {
    const buffer = Buffer.from('{"key": "value"}');
    expect(() => importJson(buffer)).toThrow(/root element must be an array/);
  });

  test('preserves metadata object structure', () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.json'));
    const records = importJson(buffer);
    expect(records[0].metadata).toHaveProperty('source');
    expect(records[0].metadata).toHaveProperty('device_type');
  });
});
