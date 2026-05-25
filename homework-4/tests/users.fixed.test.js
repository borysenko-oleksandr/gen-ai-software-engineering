/**
 * Regression + happy-path tests for the three fixes applied to bug 001-seeded.
 *
 * Fix 1 (Bug #1)  — Pagination off-by-one: end = start + PAGE_SIZE (exclusive)
 * Fix 2 (Bug #2)  — GET /users/:id: NaN guard + undefined guard, both 404
 * Fix 3 (Sec #1)  — POST /users/login: scrypt + timingSafeEqual, no plain-text
 *
 * FIRST compliance: Fast (in-memory, no I/O), Independent (each test creates
 * its own app instance), Repeatable (pure fixtures, no Date.now/Math.random),
 * Self-validating (all assertions use explicit expect()), Timely (written with fix).
 */

const request = require("supertest");
const { createApp } = require("../src/app");

// ---------------------------------------------------------------------------
// Fix 1 — Pagination (Bug #1): end = start + PAGE_SIZE, not PAGE_SIZE - 1
// ---------------------------------------------------------------------------

describe("GET /users — pagination fix (Bug #1)", () => {
  // Regression: pre-fix code returned PAGE_SIZE-1 (2) items on page 0.
  test("regression — page 0 returns exactly PAGE_SIZE (3) items, not 2", async () => {
    const app = createApp();
    const res = await request(app).get("/users?page=0");
    expect(res.status).toBe(200);
    // Pre-fix: items.length was 2. Post-fix: must be 3.
    expect(res.body.items).toHaveLength(3);
  });

  // Happy-path: correct ids on page 0.
  test("page 0 returns users with ids [1, 2, 3]", async () => {
    const app = createApp();
    const res = await request(app).get("/users?page=0");
    expect(res.status).toBe(200);
    expect(res.body.items.map((u) => u.id)).toEqual([1, 2, 3]);
  });

  // Happy-path: page 1 returns the next PAGE_SIZE users.
  test("page 1 returns users with ids [4, 5, 6]", async () => {
    const app = createApp();
    const res = await request(app).get("/users?page=1");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.items.map((u) => u.id)).toEqual([4, 5, 6]);
  });

  // Edge-case: last page may be partial.
  test("page 2 returns only the remaining user (id 7)", async () => {
    const app = createApp();
    const res = await request(app).get("/users?page=2");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(7);
  });

  // Happy-path: metadata fields are present and correct on page 0.
  test("response body includes page, pageSize, and total fields", async () => {
    const app = createApp();
    const res = await request(app).get("/users?page=0");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 0, pageSize: 3, total: 7 });
  });
});

// ---------------------------------------------------------------------------
// Fix 2 — GET /users/:id validation (Bug #2): NaN + undefined guards
// ---------------------------------------------------------------------------

describe("GET /users/:id — validation fix (Bug #2)", () => {
  // Regression: pre-fix code had no NaN guard; non-numeric id returned 200
  // with an undefined body. Post-fix must be 404.
  test("regression — non-numeric id returns 404, not 200", async () => {
    const app = createApp();
    const res = await request(app).get("/users/abc");
    expect(res.status).toBe(404);
  });

  // Regression: pre-fix code had no not-found guard; unknown numeric id
  // returned 200 with undefined. Post-fix must be 404.
  test("regression — unknown numeric id returns 404, not 200", async () => {
    const app = createApp();
    const res = await request(app).get("/users/9999");
    expect(res.status).toBe(404);
  });

  // Happy-path: known id returns 200 with correct user data.
  test("known id 1 returns 200 with alice's data", async () => {
    const app = createApp();
    const res = await request(app).get("/users/1");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, username: "alice" });
  });

  // Happy-path: last user (id 7, grace) is reachable.
  test("known id 7 returns 200 with grace's data", async () => {
    const app = createApp();
    const res = await request(app).get("/users/7");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 7, username: "grace" });
  });

  // Edge-case: special non-numeric strings should all return 404.
  // Note: a bare space " " is excluded because Express normalises
  // /users/%20 to /users/ which hits the list route, not /:id.
  test.each([["abc"], ["xyz"], ["NaN"], ["undefined"]])(
    'non-numeric id "%s" returns 404',
    async (id) => {
      const app = createApp();
      const res = await request(app).get(`/users/${id}`);
      expect(res.status).toBe(404);
    }
  );

  // Edge-case: the 404 body has a meaningful error field.
  test("404 response body contains error field", async () => {
    const app = createApp();
    const res = await request(app).get("/users/9999");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

// ---------------------------------------------------------------------------
// Fix 3 — POST /users/login security (Sec #1): scrypt + timingSafeEqual
// ---------------------------------------------------------------------------

describe("POST /users/login — scrypt security fix (Sec #1)", () => {
  // Happy-path: correct credentials return { ok: true }.
  test("correct credentials for alice return 200 with ok:true", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users/login")
      .send({ username: "alice", password: "alice-pw" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, userId: 1 });
  });

  // Happy-path: correct credentials for another user.
  test("correct credentials for bob return 200 with ok:true", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users/login")
      .send({ username: "bob", password: "bob-pw" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, userId: 2 });
  });

  // Security hardening: wrong password must be rejected with 401.
  test("wrong password for alice returns 401 with ok:false", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users/login")
      .send({ username: "alice", password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false });
  });

  // Security hardening: plain-text password stored in old 'password' field
  // must NOT succeed (the data layer no longer stores plain-text).
  test("using plain-text password as username is rejected (401)", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users/login")
      .send({ username: "alice-pw", password: "alice-pw" });
    expect(res.status).toBe(401);
  });

  // Security hardening: unknown username returns 401.
  test("unknown username returns 401", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users/login")
      .send({ username: "nobody", password: "anything" });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false });
  });

  // Security hardening: empty body returns 401, not 500.
  test("empty request body returns 401, not 500", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users/login")
      .send({});
    expect(res.status).toBe(401);
  });

  // Security hardening: missing password field returns 401, not 500.
  test("missing password field returns 401", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users/login")
      .send({ username: "alice" });
    expect(res.status).toBe(401);
  });

  // Security hardening: non-string password (e.g. numeric) returns 401.
  test("non-string password (number) returns 401", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users/login")
      .send({ username: "alice", password: 12345 });
    expect(res.status).toBe(401);
  });

  // Regression: pre-fix code compared user.password === password in plain text;
  // that field no longer exists. Verify the route does NOT accidentally accept
  // an empty string as a valid password.
  test("regression — empty string password is rejected (401)", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/users/login")
      .send({ username: "alice", password: "" });
    expect(res.status).toBe(401);
  });
});
