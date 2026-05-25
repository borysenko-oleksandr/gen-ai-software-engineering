# How to run

## Prerequisites

- Node.js 18+ and npm.
- Claude Code CLI (`claude`) installed and authenticated. The pipeline runner
  shells out to `claude -p` once per agent.

```bash
claude --version    # sanity check
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

## Run the full pipeline (single command)

```bash
npm run pipeline
# or, equivalently:
./run-pipeline.sh 001-seeded
```

The runner:

1. Validates `context/bugs/001-seeded/bug-context.md` exists.
2. Invokes `claude -p` for each agent in order, using the corresponding
   `agents/*.agent.md` as the system prompt.
3. After each step, verifies the expected output file was produced.
4. After the Bug Fixer step, runs `npm test`; if tests fail, the pipeline
   stops and Security Verifier / Unit Test Generator do **not** run.
5. Writes a full transcript to `docs/pipeline.log`.

## Verify the result

```bash
npm test                         # baseline + generated tests should now pass
git diff src/                    # see the fixes the Bug Fixer applied
ls context/bugs/001-seeded/      # all six artifacts present
cat context/bugs/001-seeded/security-report.md
cat context/bugs/001-seeded/test-report.md
```

## Re-run a single agent (manual)

```bash
BUG_ID=001-seeded
claude -p "Run the Bug Fixer for BUG_ID=$BUG_ID..." \
       --append-system-prompt "$(cat agents/bug-fixer.agent.md)" \
       --permission-mode acceptEdits
```

## Reset to the seeded state

```bash
git checkout src/ tests/users.baseline.test.js
rm -rf context/bugs/001-seeded/research \
       context/bugs/001-seeded/{implementation-plan,fix-summary,security-report,test-report}.md \
       tests/*.test.js
git checkout tests/users.baseline.test.js
```
