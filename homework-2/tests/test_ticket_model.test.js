const { validateTicket, createTicket } = require('../src/models/ticket');

const validData = {
  customer_id: 'cust-001',
  customer_email: 'test@example.com',
  customer_name: 'Bob',
  subject: 'Login issue',
  description: 'Cannot login to the portal since yesterday.',
};

describe('validateTicket', () => {
  test('passes for valid data', () => {
    expect(validateTicket(validData)).toHaveLength(0);
  });

  test('fails when customer_email is invalid', () => {
    const errors = validateTicket({ ...validData, customer_email: 'bad' });
    expect(errors.some(e => e.field === 'customer_email')).toBe(true);
  });

  test('fails when subject is empty', () => {
    const errors = validateTicket({ ...validData, subject: '' });
    expect(errors.some(e => e.field === 'subject')).toBe(true);
  });

  test('fails when subject exceeds 200 chars', () => {
    const errors = validateTicket({ ...validData, subject: 'x'.repeat(201) });
    expect(errors.some(e => e.field === 'subject')).toBe(true);
  });

  test('fails when description is too short', () => {
    const errors = validateTicket({ ...validData, description: 'short' });
    expect(errors.some(e => e.field === 'description')).toBe(true);
  });

  test('fails when description exceeds 2000 chars', () => {
    const errors = validateTicket({ ...validData, description: 'x'.repeat(2001) });
    expect(errors.some(e => e.field === 'description')).toBe(true);
  });

  test('fails for invalid category enum', () => {
    const errors = validateTicket({ ...validData, category: 'unknown' });
    expect(errors.some(e => e.field === 'category')).toBe(true);
  });

  test('fails for invalid priority enum', () => {
    const errors = validateTicket({ ...validData, priority: 'critical' });
    expect(errors.some(e => e.field === 'priority')).toBe(true);
  });

  test('fails for invalid metadata source', () => {
    const errors = validateTicket({ ...validData, metadata: { source: 'fax' } });
    expect(errors.some(e => e.field === 'metadata.source')).toBe(true);
  });
});

describe('createTicket', () => {
  test('generates a UUID id', () => {
    const t = createTicket(validData);
    expect(t.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('defaults status to new', () => {
    const t = createTicket(validData);
    expect(t.status).toBe('new');
  });

  test('defaults priority to medium', () => {
    const t = createTicket(validData);
    expect(t.priority).toBe('medium');
  });
});
