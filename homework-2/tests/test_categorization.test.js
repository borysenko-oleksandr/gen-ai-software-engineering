const { classify } = require('../src/services/classifier');

const base = {
  id: 'test-id',
  subject: '',
  description: '',
};

describe('classify – priority', () => {
  test('assigns urgent for "critical"', () => {
    const r = classify({ ...base, subject: 'critical failure', description: 'system is down' });
    expect(r.priority).toBe('urgent');
  });

  test('assigns urgent for "production down"', () => {
    const r = classify({ ...base, subject: 'production down', description: 'nothing works' });
    expect(r.priority).toBe('urgent');
  });

  test('assigns high for "blocking"', () => {
    const r = classify({ ...base, subject: 'blocking issue', description: 'cannot proceed' });
    expect(r.priority).toBe('high');
  });

  test('assigns high for "asap"', () => {
    const r = classify({ ...base, subject: 'fix asap', description: 'urgent matter' });
    expect(r.priority).toBe('high');
  });

  test('assigns low for "minor"', () => {
    const r = classify({ ...base, subject: 'minor visual glitch', description: 'cosmetic issue' });
    expect(r.priority).toBe('low');
  });

  test('defaults to medium when no keyword matches', () => {
    const r = classify({ ...base, subject: 'general question', description: 'I have a question about the product.' });
    expect(r.priority).toBe('medium');
  });
});

describe('classify – category', () => {
  test('assigns account_access for "login"', () => {
    const r = classify({ ...base, subject: 'login problem', description: 'I cannot login to my account.' });
    expect(r.category).toBe('account_access');
  });

  test('assigns technical_issue for "error"', () => {
    const r = classify({ ...base, subject: 'system error', description: 'getting 500 error on every request' });
    expect(r.category).toBe('technical_issue');
  });

  test('assigns billing_question for "invoice"', () => {
    const r = classify({ ...base, subject: 'invoice missing', description: 'I did not receive my invoice this month.' });
    expect(r.category).toBe('billing_question');
  });

  test('assigns other when no category keyword matches', () => {
    const r = classify({ ...base, subject: 'random topic', description: 'Just wanted to say hello to the team.' });
    expect(r.category).toBe('other');
  });
});

describe('classify – confidence and reasoning', () => {
  test('returns confidence between 0 and 1', () => {
    const r = classify({ ...base, subject: 'critical login issue', description: 'password reset needed' });
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });

  test('returns reasoning string', () => {
    const r = classify({ ...base, subject: 'login issue', description: 'cannot access account' });
    expect(typeof r.reasoning).toBe('string');
    expect(r.reasoning.length).toBeGreaterThan(0);
  });

  test('returns keywords array', () => {
    const r = classify({ ...base, subject: 'login failed', description: 'password not working' });
    expect(Array.isArray(r.keywords)).toBe(true);
  });

  test('low confidence when no keywords match', () => {
    const r = classify({ ...base, subject: 'hello', description: 'just a quick message for you.' });
    expect(r.confidence).toBeLessThan(0.5);
  });
});
