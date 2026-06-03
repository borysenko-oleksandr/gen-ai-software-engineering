const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const store = require('../src/utils/store');

beforeEach(() => store.clear());

const fixturePath = name => path.join(__dirname, 'fixtures', name);

const validTicket = {
  customer_id: 'cust-001',
  customer_email: 'user@example.com',
  customer_name: 'Alice',
  subject: 'Cannot login',
  description: 'I have been unable to login for the past 2 hours.',
};

describe('Integration: full ticket lifecycle', () => {
  test('create, read, update, delete workflow', async () => {
    // Create
    const created = await request(app).post('/tickets').send(validTicket);
    expect(created.status).toBe(201);
    const id = created.body.id;

    // Read
    const read = await request(app).get(`/tickets/${id}`);
    expect(read.status).toBe(200);
    expect(read.body.subject).toBe('Cannot login');

    // Update
    const updated = await request(app).put(`/tickets/${id}`).send({ status: 'in_progress' });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('in_progress');

    // Delete
    const deleted = await request(app).delete(`/tickets/${id}`);
    expect(deleted.status).toBe(200);

    // Verify gone
    const gone = await request(app).get(`/tickets/${id}`);
    expect(gone.status).toBe(404);
  });
});

describe('Integration: bulk import + auto-classify', () => {
  test('imports JSON and classifies all tickets', async () => {
    const res = await request(app)
      .post('/tickets/import?auto_classify=true')
      .attach('file', fixturePath('sample_tickets.json'));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(20);
    expect(res.body.successful).toBeGreaterThan(0);
  });

  test('bulk import reports per-row errors without aborting batch', async () => {
    const csvWithErrors = Buffer.from(
      'customer_id,customer_email,customer_name,subject,description,category,priority,status,assigned_to,tags,metadata\n' +
      'cust-1,bad-email,Name,Subject line here,Description must be at least ten chars,other,medium,new,,[],"{}"\n' +
      'cust-2,good@example.com,Name,Subject line here,Description must be at least ten chars,other,medium,new,,[],"{}"\n'
    );
    const res = await request(app)
      .post('/tickets/import')
      .attach('file', csvWithErrors, 'test.csv');
    expect(res.body.total).toBe(2);
    expect(res.body.successful).toBe(1);
    expect(res.body.failed.length).toBe(1);
  });
});

describe('Integration: resolved_at auto-set', () => {
  test('sets resolved_at when status transitions to resolved', async () => {
    const created = await request(app).post('/tickets').send(validTicket);
    const updated = await request(app).put(`/tickets/${created.body.id}`).send({ status: 'resolved' });
    expect(updated.body.resolved_at).not.toBeNull();
  });
});

describe('Integration: combined filtering', () => {
  test('filters by both category and priority', async () => {
    await request(app).post('/tickets').send({ ...validTicket, category: 'billing_question', priority: 'high' });
    await request(app).post('/tickets').send({ ...validTicket, customer_email: 'b@b.com', category: 'billing_question', priority: 'low' });
    await request(app).post('/tickets').send({ ...validTicket, customer_email: 'c@c.com', category: 'other', priority: 'high' });

    const res = await request(app).get('/tickets?category=billing_question&priority=high');
    expect(res.body.length).toBe(1);
    expect(res.body[0].category).toBe('billing_question');
    expect(res.body[0].priority).toBe('high');
  });
});
