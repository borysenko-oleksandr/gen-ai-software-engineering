# Implementation Plan — 001-seeded

## Test command
`npm test`

## Steps

### Step 1: Fix off-by-one in pagination (Bug #1)
- File: `src/routes/users.js`
- Lines: `14-15`
- Before:
  ```js
  const end = start + PAGE_SIZE - 1;
  const slice = users.slice(start, end);
  ```
- After:
  ```js
  const end = start + PAGE_SIZE;
  const slice = users.slice(start, end);
  ```
- Expected test outcome: `GET /users (pagination) > page 0 returns the first PAGE_SIZE items` passes (returns 3 items with ids [1,2,3] instead of 2).

---

### Step 2: Add input validation on GET /users/:id (Bug #2)
- File: `src/routes/users.js`
- Lines: `23-27`
- Before:
  ```js
  router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const user = users.find((u) => u.id === id);
    res.json(user);
  });
  ```
- After:
  ```js
  router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid id — must be a number" });
    }
    const user = users.find((u) => u.id === id);
    if (user === undefined) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });
  ```
- Expected test outcome: `GET /users/:id (validation) > non-numeric id returns 404` and `GET /users/:id (validation) > unknown id returns 404` both pass (currently both return 200; after this change non-numeric returns 400 and unknown id returns 404 — the baseline test only checks `toBe(404)` for non-numeric, so returning 400 will still fail that assertion; see note below).

  **Note on the non-numeric test**: `users.baseline.test.js` line 21 expects status `404` for `/users/abc`. The most semantically correct HTTP status for a malformed id is `400 Bad Request`. However, because the baseline test asserts `404`, the "after" snippet above must return `404` for both cases to satisfy that test. Adjust the NaN branch to return `404`:

  ```js
  router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users.find((u) => u.id === id);
    if (user === undefined) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });
  ```

  Use this second variant so `npm test` passes without modifying the baseline test file.

- Expected test outcome: both `non-numeric id returns 404` and `unknown id returns 404` pass.

---

### Step 3: Replace plain-text passwords in the fixture with scrypt hashes (Security #1 — data layer)
- File: `src/data/users.js`
- Lines: `1-13` (full file rewrite)
- Before:
  ```js
  // In-memory user store. NOT production data — fixture for the pipeline demo.
  const users = [
    { id: 1, username: "alice",   password: "alice-pw",   email: "alice@example.com" },
    { id: 2, username: "bob",     password: "bob-pw",     email: "bob@example.com" },
    { id: 3, username: "carol",   password: "carol-pw",   email: "carol@example.com" },
    { id: 4, username: "dave",    password: "dave-pw",    email: "dave@example.com" },
    { id: 5, username: "eve",     password: "eve-pw",     email: "eve@example.com" },
    { id: 6, username: "frank",   password: "frank-pw",   email: "frank@example.com" },
    { id: 7, username: "grace",   password: "grace-pw",   email: "grace@example.com" }
  ];

  module.exports = { users };
  ```
- After:
  ```js
  // In-memory user store. NOT production data — fixture for the pipeline demo.
  // Passwords are stored as scrypt-derived hex strings.
  // Salt: Buffer.from("pipeline-demo-salt"), keylen: 32.
  // Pre-computed with: crypto.scryptSync(plaintext, salt, 32).toString("hex")
  const users = [
    { id: 1, username: "alice", passwordHash: "b4341644fd16dc100ee2e51ac8243c538621214b57608afd55cfbb91cdf93e54", email: "alice@example.com" },
    { id: 2, username: "bob",   passwordHash: "bdadbd7360e6ec019625d0acc173eeb324e209d523166a6d0b8f6d302e5116a3", email: "bob@example.com" },
    { id: 3, username: "carol", passwordHash: "88d2e54e9c7c4df7e639a937ca7ed5b9b71409a5a3da3e968f6db82c9050d241", email: "carol@example.com" },
    { id: 4, username: "dave",  passwordHash: "a6fcb1eaeb39e2aa2f3d5ffaba968889009a4004d97062a6e873d4a484a25d0f", email: "dave@example.com" },
    { id: 5, username: "eve",   passwordHash: "9f141faf5ec8827d36417b786f0b1b571b82d00715349ce4c43ddf4164d1f773", email: "eve@example.com" },
    { id: 6, username: "frank", passwordHash: "5a769cc711b53a462705d49ed29a5adca4964b656c0710bc63dcacd92ffefa45", email: "frank@example.com" },
    { id: 7, username: "grace", passwordHash: "421c52dfdcd8172e9bd3f5ad2ffdf839fdb4ace4b89fc5271f1e7f7c5103dd59", email: "grace@example.com" }
  ];

  module.exports = { users };
  ```
- Expected test outcome: existing baseline tests are unaffected (they do not exercise `/login`). Step 4 below must be applied immediately after this step because the login route now references `user.password` which no longer exists; applying Step 3 alone would break login.

---

### Step 4: Replace plain-text comparison in POST /login with scrypt + timingSafeEqual (Security #1 — route layer)
- File: `src/routes/users.js`
- Lines: `1-43` (full file rewrite to add `crypto` require and update the login handler; all other handlers are already fixed by Steps 1–2)
- Before (full file after Steps 1 and 2 have been applied):
  ```js
  const express = require("express");
  const { users } = require("../data/users");

  const router = express.Router();

  const PAGE_SIZE = 3;

  // GET /users?page=N — paginated list.
  // Bug #1 (off-by-one): the slice end is `start + PAGE_SIZE - 1`, so the last
  // item of every page is silently dropped. Should be `start + PAGE_SIZE`.
  router.get("/", (req, res) => {
    const page = parseInt(req.query.page, 10) || 0;
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = users.slice(start, end);
    res.json({ page, pageSize: PAGE_SIZE, total: users.length, items: slice });
  });

  // GET /users/:id — fetch single user.
  // Bug #2 (missing validation): no NaN / not-found guard. `parseInt("abc")`
  // yields NaN, `users.find(...)` returns undefined, which is serialized as
  // an empty 200 response instead of a 404.
  router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users.find((u) => u.id === id);
    if (user === undefined) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // POST /login — credentials check.
  // Security #1: passwords are stored and compared in plain text using `===`.
  // No hashing, no constant-time comparison — vulnerable to credential leaks
  // and timing attacks.
  router.post("/login", (req, res) => {
    const { username, password } = req.body || {};
    const user = users.find((u) => u.username === username);
    if (user && user.password === password) {
      return res.json({ ok: true, userId: user.id });
    }
    return res.status(401).json({ ok: false });
  });

  module.exports = router;
  ```
- After:
  ```js
  const crypto = require("crypto");
  const express = require("express");
  const { users } = require("../data/users");

  const router = express.Router();

  const PAGE_SIZE = 3;
  // Salt must match the value used to pre-compute the hashes in src/data/users.js.
  const HASH_SALT = Buffer.from("pipeline-demo-salt");
  const HASH_KEYLEN = 32;

  // GET /users?page=N — paginated list (Bug #1 fixed: end is exclusive).
  router.get("/", (req, res) => {
    const page = parseInt(req.query.page, 10) || 0;
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = users.slice(start, end);
    res.json({ page, pageSize: PAGE_SIZE, total: users.length, items: slice });
  });

  // GET /users/:id — fetch single user (Bug #2 fixed: NaN and not-found guards).
  router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users.find((u) => u.id === id);
    if (user === undefined) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  // POST /login — credentials check (Security #1 fixed: scrypt + timingSafeEqual).
  router.post("/login", (req, res) => {
    const { username, password } = req.body || {};
    const user = users.find((u) => u.username === username);
    if (!user || typeof password !== "string") {
      return res.status(401).json({ ok: false });
    }
    const incoming = crypto.scryptSync(password, HASH_SALT, HASH_KEYLEN);
    const stored = Buffer.from(user.passwordHash, "hex");
    const match = crypto.timingSafeEqual(incoming, stored);
    if (match) {
      return res.json({ ok: true, userId: user.id });
    }
    return res.status(401).json({ ok: false });
  });

  module.exports = router;
  ```

  **Important**: Steps 3 and 4 must be applied together before running tests, because Step 3 renames `password` to `passwordHash` in the fixture and Step 4 is the only consumer of that field. Apply Step 3 first, then Step 4 immediately after.

- Expected test outcome: all three baseline tests continue to pass; login with a correct password returns `{ ok: true }` and login with a wrong password returns HTTP 401.

---

## Apply order summary

| Step | File | Depends on |
|------|------|-----------|
| 1 | `src/routes/users.js` lines 14-15 | nothing |
| 2 | `src/routes/users.js` lines 23-27 | Step 1 (same file; apply together) |
| 3 | `src/data/users.js` full file | nothing |
| 4 | `src/routes/users.js` full file rewrite | Steps 1, 2, 3 must be complete first |

Because Steps 1, 2, and 4 all touch `src/routes/users.js`, the Fixer should apply all three changes to that file in a single pass (i.e., produce the final "after" shown in Step 4, which already incorporates Steps 1 and 2).

---

## Manual verification

After the Fixer applies the changes, run:

```bash
# All three baseline tests should pass
npm test

# Verify pagination returns 3 items (was 2 before fix)
curl -s "http://localhost:3000/users?page=0" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const b=JSON.parse(d); console.log('items:', b.items.length, b.items.map(u=>u.id));"

# Verify non-numeric id returns 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/users/abc

# Verify unknown id returns 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/users/9999

# Verify login with correct credentials succeeds
curl -s -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"alice-pw"}' | node -e "process.stdin.resume();process.stdin.on('data',d=>console.log(JSON.parse(d)));"

# Verify login with wrong password returns 401
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"wrong"}'
```

---

## References
- `verified-research.md` — all five claims verified PASS with EXCELLENT quality rating.
- `src/routes/users.js:14` — `const end = start + PAGE_SIZE - 1;` (Bug #1).
- `src/routes/users.js:23-27` — unguarded `parseInt` + `users.find` + `res.json(user)` (Bug #2).
- `src/routes/users.js:36` — `user.password === password` plain-text comparison (Security #1).
- `src/data/users.js:3-9` — plain-text `*-pw` passwords in fixture (Security #1 data layer).
- `tests/users.baseline.test.js:21` — asserts `404` for non-numeric id (governs the NaN branch status code choice).
- Scrypt parameters: salt = `Buffer.from("pipeline-demo-salt")`, keylen = 32, Node.js built-in `crypto.scryptSync` defaults for N/r/p.
