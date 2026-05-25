# Codebase Research — 001-seeded

## Defects

### Bug #1 — Off-by-one in pagination

- File: `src/routes/users.js`
- Lines: `14-15`
- Snippet:
  ```js
  const end = start + PAGE_SIZE - 1;
  const slice = users.slice(start, end);
  ```
- Symptom: every page returns `PAGE_SIZE - 1` items instead of `PAGE_SIZE`; the last record on every page is silently dropped.
- Root cause: `Array.prototype.slice(start, end)` treats `end` as an exclusive index, so computing `end` as `start + PAGE_SIZE - 1` causes exactly one element to be omitted per page. The correct expression is `start + PAGE_SIZE`.
- Suggested fix direction: change the `end` computation to `start + PAGE_SIZE` (remove the `- 1`).

---

### Bug #2 — Missing input validation on `GET /users/:id`

- File: `src/routes/users.js`
- Lines: `24-26`
- Snippet:
  ```js
  const id = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === id);
  res.json(user);
  ```
- Symptom: non-numeric or unknown ids return HTTP 200 with an empty body instead of HTTP 404.
- Root cause: `parseInt` returns `NaN` for non-numeric strings, and `users.find(...)` returns `undefined` when no record matches; neither result is checked before calling `res.json(user)`, which serializes `undefined` as an empty 200 response.
- Suggested fix direction: add guards that return HTTP 400 when `id` is `NaN` and HTTP 404 when `user` is `undefined`.

---

### Security #1 — Plain-text password comparison

- File: `src/routes/users.js`
- Lines: `36`
- Snippet:
  ```js
  if (user && user.password === password) {
  ```
- Related fixture — `src/data/users.js`, lines `3-9`:
  ```js
  { id: 1, username: "alice",   password: "alice-pw",   email: "alice@example.com" },
  { id: 2, username: "bob",     password: "bob-pw",     email: "bob@example.com" },
  { id: 3, username: "carol",   password: "carol-pw",   email: "carol@example.com" },
  { id: 4, username: "dave",    password: "dave-pw",    email: "dave@example.com" },
  { id: 5, username: "eve",     password: "eve-pw",     email: "eve@example.com" },
  { id: 6, username: "frank",   password: "frank-pw",   email: "frank@example.com" },
  { id: 7, username: "grace",   password: "grace-pw",   email: "grace@example.com" }
  ```
- Symptom: login endpoint accepts and compares passwords in plain text; a data breach exposes all credentials directly, and the `===` comparison leaks timing information.
- Root cause: passwords are stored as raw strings in the fixture and compared with the strict-equality operator `===`, which short-circuits on the first differing character, creating a timing oracle. No hashing at rest means any read access to the data store (memory dump, log line, error message) exposes credentials directly.
- Suggested fix direction: hash passwords with `crypto.scryptSync` (or bcrypt) at storage time and compare the stored hash against a freshly derived hash of the supplied password using `crypto.timingSafeEqual` to eliminate the timing side-channel.

---

## References

- `src/routes/users.js:6` — `PAGE_SIZE` constant definition.
- `src/routes/users.js:12-16` — `GET /users` pagination handler (Bug #1 at line 14).
- `src/routes/users.js:23-27` — `GET /users/:id` single-user handler (Bug #2 at lines 24-26).
- `src/routes/users.js:33-40` — `POST /login` credentials handler (Security #1 at line 36).
- `src/data/users.js:2-10` — in-memory fixture with plain-text passwords (Security #1 contributing factor, lines 3-9).
