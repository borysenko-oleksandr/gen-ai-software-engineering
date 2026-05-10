const request = require('supertest');
const app = require('../src/app');
const store = require('../src/utils/store');

beforeEach(() => store.clear());

const validTicket = (suffix = '') => ({
  customer_id: `cust-perf${suffix}`,
  customer_email: `perf${suffix}@example.com`,
  customer_name: `Perf User ${suffix}`,
  subject: 'Performance test ticket subject',
  description: 'This is a performance test ticket with sufficient description length.',
});

describe('Performance tests', () => {
  test('creates 100 tickets in under 2 seconds', async () => {
    const start = Date.now();
    const promises = Array.from({ length: 100 }, (_, i) =>
      request(app).post('/tickets').send(validTicket(i))
    );
    const results = await Promise.all(promises);
    const elapsed = Date.now() - start;
    expect(results.every(r => r.status === 201)).toBe(true);
    expect(elapsed).toBeLessThan(2000);
  });

  test('handles 20 concurrent GET requests', async () => {
    await request(app).post('/tickets').send(validTicket('x'));
    const start = Date.now();
    const promises = Array.from({ length: 20 }, () => request(app).get('/tickets'));
    const results = await Promise.all(promises);
    const elapsed = Date.now() - start;
    expect(results.every(r => r.status === 200)).toBe(true);
    expect(elapsed).toBeLessThan(1000);
  });

  test('bulk import 20 tickets is faster than 500ms', async () => {
    const path = require('path');
    const start = Date.now();
    const res = await request(app)
      .post('/tickets/import')
      .attach('file', path.join(__dirname, 'fixtures/sample_tickets.json'));
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(500);
  });

  test('classify endpoint responds within 100ms', async () => {
    const created = await request(app).post('/tickets').send(validTicket('cls'));
    const start = Date.now();
    const res = await request(app).post(`/tickets/${created.body.id}/auto-classify`);
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(100);
  });

  test('list endpoint with 500 tickets responds under 200ms', async () => {
    const promises = Array.from({ length: 500 }, (_, i) =>
      request(app).post('/tickets').send(validTicket(i))
    );
    await Promise.all(promises);
    const start = Date.now();
    const res = await request(app).get('/tickets');
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(500);
    expect(elapsed).toBeLessThan(200);
  });
});
