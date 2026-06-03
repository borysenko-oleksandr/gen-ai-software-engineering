const path = require('path');
const { importCsv } = require('../src/services/importer');
const fs = require('fs');

const fixturePath = name => path.join(__dirname, 'fixtures', name);

describe('CSV import', () => {
  test('parses valid CSV and returns array of objects', () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.csv'));
    const records = importCsv(buffer);
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(50);
  });

  test('first record has expected fields', () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.csv'));
    const records = importCsv(buffer);
    expect(records[0]).toHaveProperty('customer_id');
    expect(records[0]).toHaveProperty('customer_email');
    expect(records[0]).toHaveProperty('subject');
  });

  test('parses tags as array', () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.csv'));
    const records = importCsv(buffer);
    expect(Array.isArray(records[0].tags)).toBe(true);
  });

  test('parses metadata as object', () => {
    const buffer = fs.readFileSync(fixturePath('sample_tickets.csv'));
    const records = importCsv(buffer);
    expect(typeof records[0].metadata).toBe('object');
    expect(records[0].metadata).toHaveProperty('source');
  });

  test('throws on malformed CSV with unclosed quote', () => {
    const buffer = fs.readFileSync(fixturePath('invalid_tickets.csv'));
    expect(() => importCsv(buffer)).toThrow();
  });

  test('returns empty array for CSV with only headers', () => {
    const buffer = Buffer.from('customer_id,customer_email,subject\n');
    const records = importCsv(buffer);
    expect(records).toHaveLength(0);
  });
});
