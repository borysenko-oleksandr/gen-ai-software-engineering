# How to run

## Prerequisites

- Node.js 18+ and npm.
- Claude Code installed and authenticated (VS Code extension or CLI).

```bash
node --version      # 18+
```

## Install

```bash
cd homework-4
npm install
```

## Run the sample app

```bash
npm start
# server on http://localhost:3000
curl http://localhost:3000/users?page=0
curl http://localhost:3000/users/1
curl -X POST -H 'Content-Type: application/json' \
     -d '{"username":"alice","password":"alice-pw"}' \
     http://localhost:3000/users/login
```

## Run baseline tests (before the pipeline)

```bash
npm test
```

Expected: tests in `tests/users.baseline.test.js` **fail** — they encode the
seeded defects.

## Run the full pipeline

Open a Claude Code session in this directory and invoke any entry-point agent.
The orchestrator **automatically chains** every subsequent step without further
input from you:

```
@agent-bug-researcher 001-seeded
```

That single message runs all six agents in sequence. You will see a one-line
status update after each step. The chain stops automatically on:

- Research Verifier returning `Overall result: FAIL`
- `npm test` failing after the Bug Fixer step

To resume from a mid-pipeline step (e.g. if you need to re-run from the
planner onward):

```
@agent-bug-planner 001-seeded
```

## Verify the result

```bash
npm test                         # baseline + generated tests should now pass
git diff src/                    # see the fixes the Bug Fixer applied
ls context/bugs/001-seeded/      # all six artifacts present
cat context/bugs/001-seeded/security-report.md
cat context/bugs/001-seeded/test-report.md
```

## Re-run from a specific step

Invoke the desired entry-point agent directly. The orchestrator will
auto-chain all subsequent steps:

```
@agent-bug-fixer 001-seeded
```

This runs bug-fixer → security-verifier → unit-test-generator, skipping the
earlier steps. See the entry-point table in `CLAUDE.md` for all starting
points.

## Reset to the seeded state

```bash
git checkout src/ tests/users.baseline.test.js
rm -rf context/bugs/001-seeded/research \
       context/bugs/001-seeded/{implementation-plan,fix-summary,security-report,test-report}.md \
       tests/*.test.js
git checkout tests/users.baseline.test.js
```
