# AI Prompts — Homework 4

This file records the prompts used during the implementation of Homework 4,
per the project convention in `CLAUDE.md`.

---

## Session: Initial scaffolding (2026-05-25)

### Prompt 1 — Analyse the task and plan
> чому я не можу вибрати /plan

Follow-up:
> проаналізуй файл і давай подумаємо що це і як його реалізувати

Outcome: produced the implementation plan stored at
`~/.claude/plans/smooth-herding-melody.md` covering the 4-agent pipeline,
6 `.agent.md` files, 2 skills, sample Express app, and single-command
runner.

### Prompt 2 — Step-by-step implementation
> роби покроково
>
> роби по кроково і мова документації повинна бути англ

Outcome: created the working tree in this order:

1. `package.json`, `src/app.js`, `src/routes/users.js`, `src/data/users.js`,
   `tests/users.baseline.test.js` (3 failing baseline tests confirming the
   seeded defects).
2. `context/bugs/001-seeded/bug-context.md` documenting the seeds.
3. `skills/research-quality-measurement.md`,
   `skills/unit-tests-FIRST.md`.
4. Six agent files in `agents/` — research-verifier, bug-fixer,
   security-verifier, unit-test-generator (required), plus
   bug-researcher and bug-planner (upstream).
5. `run-pipeline.sh` orchestrating `claude -p` for each agent, with
   per-step output verification and a hard stop on failing tests after
   the Bug Fixer.
6. `README.md`, `HOWTORUN.md`.

### User-confirmed design choices

| Decision | Choice | Source |
|----------|--------|--------|
| Agent execution | `claude -p` (headless CLI) | AskUserQuestion answer |
| Sample-app stack | Node.js + Express + Jest | AskUserQuestion answer |
| Seeded defects | 2 logic bugs + 1 security issue | AskUserQuestion answer |
