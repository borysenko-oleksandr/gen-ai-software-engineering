# Homework 4 — 4-Agent Pipeline

**Author**: Oleksandr Borysenko (oborysenko@n-ix.com)
**Course**: GenAI and Agentic AI for Software Engineering

A six-step agent pipeline that operates on a small Express sample app with
deliberately seeded defects. The pipeline locates the defects, plans the fix,
applies it, security-reviews the change, and generates unit tests — all from
a single Claude Code conversation command.

## Pipeline

```
Bug Researcher → Research Verifier → Bug Planner → Bug Fixer → Security Verifier → Unit Test Generator
```

The four agents required by the task are **Research Verifier**, **Bug Fixer**,
**Security Verifier**, **Unit Test Generator**. The Researcher and Planner
are lightweight upstream producers required by the pipeline contract but not
counted toward the four.

Agents communicate exclusively through files under
`context/bugs/<bug-id>/` — there is no shared in-memory state.

| Step | Producer | Output |
|------|----------|--------|
| 1 | Bug Researcher | `research/codebase-research.md` |
| 2 | Research Verifier | `research/verified-research.md` |
| 3 | Bug Planner | `implementation-plan.md` |
| 4 | Bug Fixer | `fix-summary.md` + edits in `src/` |
| 5 | Security Verifier | `security-report.md` (read-only) |
| 6 | Unit Test Generator | `test-report.md` + new `tests/*.test.js` |

## Model selection

Each `agents/*.agent.md` declares its model in YAML frontmatter.

| Agent | Model | Rationale |
|-------|-------|-----------|
| `research-verifier` | `opus` | Fact-checking requires careful, citation-grade reasoning. |
| `bug-fixer` | `sonnet` | Routine, mechanical execution of a plan — speed and cost matter more than reasoning depth. |
| `security-verifier` | `opus` | Security review benefits from the strongest reasoning model available. |
| `unit-test-generator` | `sonnet` | Scaffolding tests around clearly-defined changes; Sonnet is sufficient. |
| `bug-researcher` | `sonnet` | Targeted code-locating work; Sonnet is fast and accurate enough. |
| `bug-planner` | `sonnet` | Structured translation of verified research into deterministic steps. |

## Skills

- `skills/research-quality-measurement.md` — rubric used by the Research
  Verifier (`EXCELLENT / GOOD / ACCEPTABLE / POOR / UNUSABLE`).
- `skills/unit-tests-FIRST.md` — FIRST principles (Fast, Independent,
  Repeatable, Self-validating, Timely) used by the Unit Test Generator.

## Sample app

A minimal Express API in `src/` backed by an in-memory user store. Routes:

- `GET /users?page=N` — paginated list (seeded **Bug #1**: off-by-one).
- `GET /users/:id` — single user (seeded **Bug #2**: missing validation).
- `POST /users/login` — credentials check (seeded **Security #1**: plain-text
  password comparison).

All seeds are documented in
[context/bugs/001-seeded/bug-context.md](context/bugs/001-seeded/bug-context.md).
Baseline tests in [tests/users.baseline.test.js](tests/users.baseline.test.js)
fail until the Bug Fixer applies the planned changes.

## How to run

See [HOWTORUN.md](HOWTORUN.md).

## Agent files

Each agent has **two** files that are kept in sync:

- [agents/*.agent.md](agents/) — required by the homework spec
  (`TASKS.md` mandates this exact path and naming).
- [.claude/agents/*.md](.claude/agents/) — Claude Code subagent
  definitions consumed by the conversation runner (`/agents`, auto-chaining).

Both files carry identical frontmatter (`name`, `description`, `model`,
`tools`) and body — the `.claude/agents/` copy is what Claude Code actually
invokes.

## Deliverables

- 4 required agents in [agents/](agents/) (+ 2 upstream), with runtime
  equivalents in [.claude/agents/](.claude/agents/).
- 2 skills in [skills/](skills/).
- Runnable sample app in [src/](src/) with seeded defects.
- Pipeline artifacts under
  [context/bugs/001-seeded/](context/bugs/001-seeded/).
- Screenshots in [docs/screenshots/](docs/screenshots/).
