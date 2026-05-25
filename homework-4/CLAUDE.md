# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This homework is **not yet implemented** — the working tree currently contains only [TASKS.md](TASKS.md), which is the spec. Everything below describes the target architecture defined by that spec. Read TASKS.md first; if you find a discrepancy between this file and TASKS.md, TASKS.md wins.

## What this project is

A 4-agent pipeline that operates on a small seeded sample app. The pipeline finds bugs and a security issue planted in `src/`, fixes them, security-reviews the fix, and generates unit tests — end-to-end via a single command.

Run order (note: the verifier and generator do *not* fan out in parallel — the spec lists them as sequential phases on changed code):

```
Bug Researcher → Bug Research Verifier → Bug Planner → Bug Fixer → Security Verifier → Unit Test Generator
```

The Bug Researcher and Bug Planner are upstream producers — they are referenced as inputs but are **not** among the 4 required agent files. The 4 required agents are research-verifier, bug-fixer, security-verifier, unit-test-generator.

## Single-command execution (required)

The whole pipeline must run from one command (e.g. `npm run pipeline` or `./run-pipeline.sh`) that invokes each agent in order and auto-loads its skills. No manual per-agent invocation. When implementing the runner, ensure each step's output file exists before launching the next step, and short-circuit on failure (especially: if Bug Fixer's tests fail, stop and surface the failure rather than letting Security Verifier and Unit Test Generator run on a broken tree).

## File layout the pipeline depends on

Agents communicate exclusively through files under `context/bugs/<bug-id>/`. The contract:

| Producer | Output file | Consumer |
|---|---|---|
| Bug Researcher | `research/codebase-research.md` | Research Verifier |
| Research Verifier | `research/verified-research.md` | Bug Planner |
| Bug Planner | `implementation-plan.md` | Bug Fixer |
| Bug Fixer | `fix-summary.md` + code edits in `src/` | Security Verifier, Unit Test Generator |
| Security Verifier | `security-report.md` (no code edits) | — |
| Unit Test Generator | `test-report.md` + test files in `tests/` | — |

If you change any of these paths, update the pipeline runner and every `*.agent.md` that references them — agents are coordinated by convention, not by a framework.

## Per-agent rules worth remembering

- **Each `*.agent.md` must declare its model in frontmatter** and the README must justify the choice. The spec suggests stronger reasoning models for research verification and security review, faster/cheaper models for routine fixes and test scaffolding.
- **Security Verifier is read-only** — it produces `security-report.md` and must not edit code. Each finding needs severity (CRITICAL/HIGH/MEDIUM/LOW/INFO), `file:line`, and remediation.
- **Unit Test Generator covers only changed code**, not the whole app, and must follow the FIRST skill (see below).
- **Research Verifier** must verify every `file:line` reference and snippet in the researcher's output against the actual source, and grade quality using the research-quality skill.

## Required skills

Two skills must live in `skills/` and be referenced from their consuming agents:

- `skills/research-quality-measurement.md` — defines quality levels/labels; used by Research Verifier when writing `verified-research.md`.
- `skills/unit-tests-FIRST.md` — defines FIRST (Fast, Independent, Repeatable, Self-validating, Timely); used by Unit Test Generator.

## Sample app (`src/`)

The app is a deliberate target, not a real product. Requirements:
- Small, single language, minimal deps, runnable locally.
- **≥ 2 intentional bugs** and **≥ 1 intentional security issue**, all documented in `context/bugs/<id>/bug-context.md`.
- A working run command and test command (e.g. `npm test`) that the Bug Fixer and Unit Test Generator can invoke.
- After the pipeline runs, the same app must demonstrate the fixes and pass tests.

The stack isn't chosen yet — when picking one, optimize for keeping the bug surface small enough to fix in a single pipeline run.

## Deliverables checklist (from TASKS.md)

- 4 agents in `agents/` with model frontmatter
- 2 skills in `skills/`
- Runnable sample app in `src/` with seeded bugs + security issue
- All agent output artifacts under `context/bugs/<id>/`
- Screenshots in `docs/screenshots/` (pipeline run, fixes, security scan, unit tests)
- `README.md` (with author info per root README) and `HOWTORUN.md`

## Project-specific convention

After completing any task in this repo, append the prompt(s) used to `docs/ai-prompts.md` (create the file if missing). This is a standing requirement for these homeworks.
