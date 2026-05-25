const request = require("supertest");
const { createApp } = require("../src/app");

// Baseline behavioural tests. They are expected to FAIL on the seeded code
// and PASS after the Bug Fixer agent applies the fixes from the pipeline.

describe("GET /users (pagination)", () => {
  test("page 0 returns the first PAGE_SIZE items", async () => {
    const app = createApp();
    const res = await request(app).get("/users?page=0");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(3); // off-by-one bug returns 2
    expect(res.body.items.map((u) => u.id)).toEqual([1, 2, 3]);
  });
});

describe("GET /users/:id (validation)", () => {
  test("non-numeric id returns 404", async () => {
    const app = createApp();
    const res = await request(app).get("/users/abc");
    expect(res.status).toBe(404); // bug: currently returns 200 with empty body
  });

  test("unknown id returns 404", async () => {
    const app = createApp();
    const res = await request(app).get("/users/9999");
    expect(res.status).toBe(404);
  });
});
