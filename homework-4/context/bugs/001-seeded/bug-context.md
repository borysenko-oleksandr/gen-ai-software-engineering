# Bug Context — `001-seeded`

This file is the **single source of truth** for the seeded defects that the
4-agent pipeline must find, plan, fix, security-review, and cover with tests.
It is the entry point for the Bug Researcher agent.

## Application under test

- Stack: Node.js + Express, in-memory data store.
- Entry point: [src/app.js](../../../src/app.js)
- Routes: [src/routes/users.js](../../../src/routes/users.js)
- Fixture data: [src/data/users.js](../../../src/data/users.js)
- Tests: `npm test` (Jest + supertest). Baseline tests in
  [tests/users.baseline.test.js](../../../tests/users.baseline.test.js) are
  expected to **fail** until the Bug Fixer applies the fixes.

## Seeded defects

### Bug #1 — Off-by-one in pagination
- **Where**: `src/routes/users.js`, `GET /users` handler.
- **Symptom**: every page returns `PAGE_SIZE - 1` items instead of `PAGE_SIZE`;
  the last record on every page is silently dropped.
- **Root cause**: slice end is computed as `start + PAGE_SIZE - 1`. The end
  index passed to `Array.prototype.slice` is exclusive, so the correct value
  is `start + PAGE_SIZE`.
- **Severity**: medium (silent data loss in API response).

### Bug #2 — Missing input validation on `GET /users/:id`
- **Where**: `src/routes/users.js`, `GET /users/:id` handler.
- **Symptom**: non-numeric or unknown ids return HTTP 200 with an empty body
  instead of HTTP 404.
- **Root cause**: `parseInt` may return `NaN`; the result of `users.find(...)`
  may be `undefined`. Neither case is checked before responding.
- **Severity**: medium (broken contract; clients can't distinguish
  "not found" from "found, empty").

### Security #1 — Plain-text password comparison
- **Where**: `src/routes/users.js`, `POST /users/login` handler.
- **Symptom**: passwords are stored in plain text in the fixture and compared
  with `===` against the request body.
- **Issues**:
  - No hashing at rest.
  - `===` short-circuits on first differing byte → timing oracle.
- **Expected remediation**: store hashed credentials (e.g. scrypt / bcrypt /
  Node `crypto.scryptSync`) and compare hashes using
  `crypto.timingSafeEqual`.
- **Severity**: HIGH (credential exposure + timing attack surface).

## Pipeline contract

The Bug Researcher agent should consume this file and produce
`research/codebase-research.md` referencing exact `file:line` locations.
Downstream artifacts live alongside this file under
`context/bugs/001-seeded/`.
