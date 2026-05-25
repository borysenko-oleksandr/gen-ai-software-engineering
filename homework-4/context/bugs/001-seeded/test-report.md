# Test Report — 001-seeded

Skill reference: `skills/unit-tests-FIRST.md`

## Summary
- Tests added: 23  (in `tests/users.fixed.test.js`)
- Tests passing: 26 / 26  (23 new + 3 from `tests/users.baseline.test.js`)
- Coverage scope:
  - `src/routes/users.js` — pagination (Bug #1), GET /:id guards (Bug #2), login scrypt handler (Sec #1)
  - `src/data/users.js` — `passwordHash` fixture verified indirectly via login tests

## FIRST Checklist
- Fast: ✓ — all 26 tests complete in 0.808 s; each test is in-memory Express with no network or real DB I/O
- Independent: ✓ — every `test(...)` calls `createApp()` itself; no shared mutable state between tests
- Repeatable: ✓ — pure in-memory fixtures, no `Date.now()`, `Math.random()`, or environment variables; same result on every machine
- Self-validating: ✓ — every assertion uses explicit `expect(...)` matchers; no console-inspection or manual output review
- Timely: ✓ — tests written against the fixed code, covering each failure mode the bugs and security issue exhibited

## Tests Added

### `tests/users.fixed.test.js` — `GET /users — pagination fix (Bug #1)`
- `regression — page 0 returns exactly PAGE_SIZE (3) items, not 2` — proves off-by-one is fixed (pre-fix returned 2)
- `page 0 returns users with ids [1, 2, 3]` — happy-path: correct set on first page
- `page 1 returns users with ids [4, 5, 6]` — happy-path: second page uses correct window
- `page 2 returns only the remaining user (id 7)` — edge-case: partial last page handled correctly
- `response body includes page, pageSize, and total fields` — happy-path: metadata contract

### `tests/users.fixed.test.js` — `GET /users/:id — validation fix (Bug #2)`
- `regression — non-numeric id returns 404, not 200` — proves NaN guard is applied (pre-fix returned 200 with empty body)
- `regression — unknown numeric id returns 404, not 200` — proves not-found guard is applied
- `known id 1 returns 200 with alice's data` — happy-path: valid id resolves correctly
- `known id 7 returns 200 with grace's data` — happy-path: boundary user is reachable
- `non-numeric id "abc" returns 404` (test.each × 4: abc, xyz, NaN, undefined) — edge-cases for string inputs
- `404 response body contains error field` — self-documenting error shape

### `tests/users.fixed.test.js` — `POST /users/login — scrypt security fix (Sec #1)`
- `correct credentials for alice return 200 with ok:true` — happy-path: scrypt hash verified correctly
- `correct credentials for bob return 200 with ok:true` — happy-path: second fixture user
- `wrong password for alice returns 401 with ok:false` — security: wrong password rejected
- `using plain-text password as username is rejected (401)` — security: plain-text credential field no longer accepted
- `unknown username returns 401` — security: non-existent user rejected
- `empty request body returns 401, not 500` — security: malformed input handled gracefully
- `missing password field returns 401` — security: absent password field handled
- `non-string password (number) returns 401` — security: type guard on password field
- `regression — empty string password is rejected (401)` — proves pre-fix plain-text comparison is gone (empty string could pass `=== ""` if hash was empty)

## Run Output
```
> homework-4-pipeline@1.0.0 test
> jest --colors

 PASS  tests/users.fixed.test.js
 PASS  tests/users.baseline.test.js

Test Suites: 2 passed, 2 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        0.808 s, estimated 1 s
Ran all test suites.
```

## References
- `skills/unit-tests-FIRST.md` — FIRST principles applied throughout
- `fix-summary.md` — changed files and line references:
  - `src/routes/users.js:16` — `const end = start + PAGE_SIZE;` (Bug #1)
  - `src/routes/users.js:22-31` — NaN and not-found guards (Bug #2)
  - `src/routes/users.js:35-48` — scrypt + timingSafeEqual login handler (Sec #1)
  - `src/data/users.js:5-13` — `passwordHash` fields replacing plain-text `password` fields (Sec #1 data layer)
