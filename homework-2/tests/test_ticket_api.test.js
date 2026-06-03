const request = require('supertest');
const app = require('../src/app');
const store = require('../src/utils/store');

beforeEach(() => store.clear());

const validTicket = {
  customer_id: 'cust-001',
  customer_email: 'user@example.com',
  customer_name: 'Alice',
  subject: 'Cannot login',
  description: 'I have been unable to login for the past 2 hours.',
};

describe('POST /tickets', () => {
  test('creates a ticket and returns 201', async () => {
    const res = await request(app).post('/tickets').send(validTicket);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.customer_email).toBe('user@example.com');
  });

  test('auto-classifies when ?auto_classify=true', async () => {
    const res = await request(app).post('/tickets?auto_classify=true').send(validTicket);
    expect(res.status).toBe(201);
    expect(res.body.category).toBeDefined();
    expect(res.body.confidence).toBeDefined();
  });

  test('returns 400 for missing required fields', async () => {
    const res = await request(app).post('/tickets').send({ customer_id: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('returns 400 for invalid email', async () => {
    const res = await request(app).post('/tickets').send({ ...validTicket, customer_email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for subject too long', async () => {
    const res = await request(app).post('/tickets').send({ ...validTicket, subject: 'x'.repeat(201) });
    expect(res.status).toBe(400);
  });
});

describe('GET /tickets', () => {
  test('returns empty array initially', async () => {
    const res = await request(app).get('/tickets');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('filters by category', async () => {
    await request(app).post('/tickets').send({ ...validTicket, category: 'billing_question' });
    await request(app).post('/tickets').send({ ...validTicket, customer_email: 'b@b.com', category: 'other' });
    const res = await request(app).get('/tickets?category=billing_question');
    expect(res.body.length).toBe(1);
    expect(res.body[0].category).toBe('billing_question');
  });

  test('filters by priority', async () => {
    await request(app).post('/tickets').send({ ...validTicket, priority: 'urgent' });
    await request(app).post('/tickets').send({ ...validTicket, customer_email: 'b@b.com', priority: 'low' });
    const res = await request(app).get('/tickets?priority=urgent');
    expect(res.body.length).toBe(1);
  });
});

describe('GET /tickets/:id', () => {
  test('returns ticket by id', async () => {
    const created = await request(app).post('/tickets').send(validTicket);
    const res = await request(app).get(`/tickets/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/tickets/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

describe('PUT /tickets/:id', () => {
  test('updates ticket status', async () => {
    const created = await request(app).post('/tickets').send(validTicket);
    const res = await request(app).put(`/tickets/${created.body.id}`).send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });
});

describe('DELETE /tickets/:id', () => {
  test('deletes a ticket', async () => {
    const created = await request(app).post('/tickets').send(validTicket);
    const del = await request(app).delete(`/tickets/${created.body.id}`);
    expect(del.status).toBe(200);
    const get = await request(app).get(`/tickets/${created.body.id}`);
    expect(get.status).toBe(404);
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/tickets/nonexistent-id');
    expect(res.status).toBe(404);
  });
});
