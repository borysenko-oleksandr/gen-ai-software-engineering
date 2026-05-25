# Security Report — 001-seeded

## Summary
- Files reviewed: 2 (`src/routes/users.js`, `src/data/users.js`)
- Findings: CRITICAL: 0 / HIGH: 0 / MEDIUM: 2 / LOW: 3 / INFO: 2
- Overall verdict: PASS

## Findings

### [MEDIUM] Static, hardcoded salt shared across all users
- Location: `src/routes/users.js:9` and `src/data/users.js:3`
- Description: A single hardcoded salt (`"pipeline-demo-salt"`) is used for every user's scrypt hash. Salts should be unique per user and random.
- Impact: An attacker who obtains the user store can pre-compute a single rainbow table covering every account in one pass and can also detect when two users share the same password (hashes are identical). This effectively negates the cost benefit of salting.
- Remediation: Generate a cryptographically random per-user salt with `crypto.randomBytes(16)`, store it alongside each `passwordHash`, and pass that user-specific salt into `scryptSync` during login.

### [MEDIUM] Synchronous scrypt on the request thread enables trivial DoS
- Location: `src/routes/users.js:41`
- Description: `crypto.scryptSync` blocks the Node.js event loop for the duration of the KDF. The login endpoint is unauthenticated and unrate-limited.
- Impact: A small number of concurrent `/login` requests (with arbitrary passwords) will saturate the single event loop, denying service to all other HTTP routes.
- Remediation: Use the async `crypto.scrypt(...)` callback/promise form, add request rate limiting (e.g. `express-rate-limit`) on `/login`, and consider account lockout after repeated failures.

### [LOW] Username enumeration via timing / control-flow difference
- Location: `src/routes/users.js:37-43`
- Description: When the username does not exist, the handler returns 401 immediately without performing the scrypt computation. When the username exists, the handler runs scrypt. The wall-clock difference is large (tens to hundreds of ms) and easily measured remotely.
- Impact: An attacker can enumerate valid usernames, which lowers the cost of subsequent credential-stuffing or targeted phishing.
- Remediation: Always perform a dummy scrypt computation against a constant hash when the user is not found, then return 401 unconditionally so all login paths take comparable time.

### [LOW] `timingSafeEqual` can throw on length mismatch and leak via 500
- Location: `src/routes/users.js:42-43`
- Description: If `user.passwordHash` is malformed (odd hex length, missing, etc.), `Buffer.from(hash, "hex")` may yield a buffer of unexpected length and `timingSafeEqual` throws `RangeError: Input buffers must have the same byte length`. There is no try/catch, so Express returns a 500 with a stack trace (depending on environment).
- Impact: Unhandled exception path; potential information disclosure via error response in non-production setups; also a minor availability concern.
- Remediation: Explicitly check `stored.length === HASH_KEYLEN` before calling `timingSafeEqual`, and wrap the comparison in try/catch returning a generic 401.

### [LOW] `parseInt(req.query.page, 10) || 0` silently coerces negative input
- Location: `src/routes/users.js:14-17`
- Description: Negative pages (e.g. `?page=-5`) compute `start = -15`, and `Array.prototype.slice` with a negative start returns the tail of the array. This breaks pagination invariants.
- Impact: Defense-in-depth gap; surprising responses; could mask logic bugs.
- Remediation: Validate that `page` is an integer ≥ 0 (`Number.isInteger(page) && page >= 0`) and return 400 otherwise.

### [INFO] Plain-text password fixture remnants documented in fix-summary
- Location: `context/bugs/001-seeded/fix-summary.md`
- Description: The fix-summary contains the original demo plaintext (`alice-pw`). Not a code finding, but the fixture passwords are recoverable from repo history.
- Impact: None for this demo; would matter for any real deployment.
- Remediation: Treat all seeded credentials as compromised; do not reuse outside the demo.

### [INFO] No authentication / authorization on `/users` and `/users/:id`
- Location: `src/routes/users.js:13-32`
- Description: These endpoints return full user records including `passwordHash` via `res.json(user)` without any authentication. This pre-existed the Bug Fixer's changes but the touched line now exposes `passwordHash` instead of `password`.
- Impact: Anyone can fetch `passwordHash` values via `GET /users` or `GET /users/:id`, enabling offline cracking. Combined with the shared salt (MEDIUM above), this becomes practically severe.
- Remediation: Strip `passwordHash` from responses (project to safe fields) and add authentication/authorization in front of these routes.

## References
- `context/bugs/001-seeded/fix-summary.md`
- `src/routes/users.js:9,14-17,22-31,35-48`
- `src/data/users.js:3,5-13`
