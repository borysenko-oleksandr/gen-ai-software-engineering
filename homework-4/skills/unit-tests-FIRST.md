# Skill: Unit Tests — FIRST

**Purpose**: define what makes a unit test acceptable in this project.
This skill is consumed by the **Unit Test Generator** agent and applies to
every test file it writes.

## The FIRST principles

| Letter | Principle      | What it means here |
|--------|----------------|--------------------|
| **F**  | Fast           | A single test must complete in well under 1 second. No `sleep`, no network, no real DB. Suite < 5 s total for the changed surface. |
| **I**  | Independent    | Order-independent. No shared mutable state between tests. Each `test(...)` builds its own app instance / fixtures. |
| **R**  | Repeatable     | Deterministic. No `Date.now()`, `Math.random()`, env vars, or wall clocks without being injected/mocked. Same input → same output on every machine. |
| **S**  | Self-validating | Pass/fail is decided by explicit `expect(...)` assertions. No console inspection, no manual checks, no "look at the output". |
| **T**  | Timely         | Written **with** the fix, against the changed code. Cover the failure mode that the bug exhibited, not just the happy path. |

## Coverage rules

- Cover **only code that changed** in `fix-summary.md`. Do not write tests
  for unrelated modules.
- Each fixed defect MUST have at least:
  1. one regression test that fails on the pre-fix code, and
  2. one happy-path test that passes on the fixed code.
- Security fixes additionally require a test that exercises the
  hardened path (e.g. wrong-password rejection, hash mismatch).

## File and naming conventions

- Place new tests under `tests/`, mirroring `src/` structure.
- Name files `<module>.test.js`. One `describe(...)` block per public
  behaviour; one `test(...)` per scenario.
- Use `supertest` for HTTP routes; require modules directly for pure
  functions.

## Required structure of `test-report.md`

```
# Test Report — <bug-id>

## Summary
- Tests added: N
- Tests passing: N / N
- Coverage scope: <list of changed files covered>

## FIRST Checklist
- Fast: ✓ / ✗ — note
- Independent: ✓ / ✗ — note
- Repeatable: ✓ / ✗ — note
- Self-validating: ✓ / ✗ — note
- Timely: ✓ / ✗ — note

## Tests Added
- `tests/<file>` — `<describe> > <test>` — what it proves

## Run Output
<pasted `npm test` summary>

## References
- `fix-summary.md`, changed files with `file:line`.
```

## Hard rules

- The generator MUST cite this skill by name in `test-report.md`.
- If any FIRST item is marked ✗, the generator MUST justify it in the note
  or refactor the test until it can be marked ✓.
- The generator MUST run `npm test` and embed the real summary line —
  fabricated output is a hard fail.
