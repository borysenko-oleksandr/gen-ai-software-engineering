# Fix Summary — 001-seeded

## Changes Made

### Change 1: Fix off-by-one in pagination (Bug #1) + Add input validation on GET /users/:id (Bug #2)
- File: `src/routes/users.js`
- Steps 1, 2, and 4 applied as a single pass (plan instructs this because all three touch the same file)
- Before (line 14): `const end = start + PAGE_SIZE - 1;`
- After (line 16): `const end = start + PAGE_SIZE;`
- Before (lines 23-27): unguarded `parseInt` + `users.find` + `res.json(user)` with no NaN/404 handling
- After (lines 22-31): NaN guard returns 404, not-found guard returns 404
- Test result: pass — `page 0 returns the first PAGE_SIZE items`, `non-numeric id returns 404`, `unknown id returns 404` all green

### Change 2: Replace plain-text passwords with scrypt hashes (Security #1 — data layer, Step 3)
- File: `src/data/users.js`
- Before: `password` field containing plain-text strings (e.g. `"alice-pw"`)
- After: `passwordHash` field containing scrypt hex digests (salt `pipeline-demo-salt`, keylen 32)
- Test result: pass — baseline tests do not exercise `/login`, so no regression

### Change 3: Replace plain-text comparison with scrypt + timingSafeEqual (Security #1 — route layer, Step 4)
- File: `src/routes/users.js`
- Before: `user.password === password` (plain-text equality)
- After: `crypto.scryptSync` + `crypto.timingSafeEqual` against `user.passwordHash`
- Added `crypto` require and `HASH_SALT` / `HASH_KEYLEN` constants
- Test result: pass — all 3 baseline tests continue to pass

## Overall Status
- Plan steps applied: 4 / 4 (Steps 1+2+4 applied together per plan's apply-order note; Step 3 applied immediately before)
- Tests: PASS — `3 passed, 3 total` in `tests/users.baseline.test.js` (0.516 s)

## Manual Verification
```bash
# All three baseline tests
npm test

# Pagination returns 3 items (was 2 before fix)
curl -s "http://localhost:3000/users?page=0" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const b=JSON.parse(d); console.log('items:', b.items.length, b.items.map(u=>u.id));"

# Non-numeric id returns 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/users/abc

# Unknown id returns 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/users/9999

# Login with correct credentials returns { ok: true }
curl -s -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"alice-pw"}' | node -e "process.stdin.resume();process.stdin.on('data',d=>console.log(JSON.parse(d)));"

# Login with wrong password returns 401
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"wrong"}'
```

## References
- `implementation-plan.md` — all four steps
- `src/routes/users.js:16` — `const end = start + PAGE_SIZE;` (Bug #1 fix)
- `src/routes/users.js:23-31` — NaN and not-found guards (Bug #2 fix)
- `src/routes/users.js:36-47` — scrypt + timingSafeEqual login handler (Security #1 fix)
- `src/data/users.js:5-11` — `passwordHash` fields replacing plain-text `password` fields (Security #1 data layer)
- `tests/users.baseline.test.js` — 3 tests, all passing
