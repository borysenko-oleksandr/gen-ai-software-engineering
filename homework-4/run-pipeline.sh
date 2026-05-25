#!/usr/bin/env bash
# Single-command runner for the 4-agent pipeline.
#
# Usage:  ./run-pipeline.sh [BUG_ID]
#         npm run pipeline -- [BUG_ID]
#
# Default BUG_ID is "001-seeded". The runner drives `claude -p` once per
# agent, in the fixed order from TASKS.md, and aborts on the first failure.
#
# Each step:
#   1. Verifies the input file from the previous step exists.
#   2. Builds a prompt from the agent's `.agent.md` (loaded by Claude Code
#      as the agent definition).
#   3. Invokes `claude -p` and waits for completion.
#   4. Verifies the expected output file was produced.
# After the Bug Fixer step, `npm test` must pass before Security Verifier
# and Unit Test Generator are allowed to run.

set -euo pipefail

BUG_ID="${1:-001-seeded}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUG_DIR="$ROOT/context/bugs/$BUG_ID"
LOG="$ROOT/docs/pipeline.log"

mkdir -p "$ROOT/docs" "$BUG_DIR/research"
: > "$LOG"

log() { printf '\n=== %s ===\n' "$*" | tee -a "$LOG"; }
fail() { printf '\n!!! %s\n' "$*" | tee -a "$LOG" >&2; exit 1; }

require_file() {
  local path="$1" who="$2"
  [[ -f "$path" ]] || fail "$who did not produce expected file: $path"
}

run_agent() {
  local agent_file="$1" user_prompt="$2" expected_output="$3"
  local name
  name="$(basename "$agent_file" .agent.md)"

  log "Running agent: $name"
  [[ -f "$agent_file" ]] || fail "Missing agent file: $agent_file"

  # claude -p reads the prompt from stdin (or arg) and runs headless.
  # The .agent.md frontmatter declares the model; we pass it explicitly
  # via --append-system-prompt so the agent role is enforced for this turn.
  local system_prompt
  system_prompt="$(cat "$agent_file")"

  if ! command -v claude >/dev/null 2>&1; then
    fail "claude CLI not found in PATH. Install Claude Code first."
  fi

  claude -p "$user_prompt" \
    --append-system-prompt "$system_prompt" \
    --permission-mode acceptEdits \
    2>&1 | tee -a "$LOG"

  require_file "$expected_output" "$name"
  log "Agent $name completed → $expected_output"
}

# ---------- Preconditions ----------
[[ -f "$BUG_DIR/bug-context.md" ]] || fail "Missing $BUG_DIR/bug-context.md"
log "Pipeline start — BUG_ID=$BUG_ID"

# ---------- 1. Bug Researcher ----------
run_agent \
  "$ROOT/agents/bug-researcher.agent.md" \
  "Run the Bug Researcher for BUG_ID=$BUG_ID. Read $BUG_DIR/bug-context.md and write $BUG_DIR/research/codebase-research.md." \
  "$BUG_DIR/research/codebase-research.md"

# ---------- 2. Research Verifier ----------
run_agent \
  "$ROOT/agents/research-verifier.agent.md" \
  "Run the Research Verifier for BUG_ID=$BUG_ID. Load skills/research-quality-measurement.md, verify $BUG_DIR/research/codebase-research.md, and write $BUG_DIR/research/verified-research.md." \
  "$BUG_DIR/research/verified-research.md"

# Hard stop on FAIL verdict.
if grep -qE '^- Overall result:\s*FAIL' "$BUG_DIR/research/verified-research.md"; then
  fail "Research Verifier returned FAIL — aborting pipeline."
fi

# ---------- 3. Bug Planner ----------
run_agent \
  "$ROOT/agents/bug-planner.agent.md" \
  "Run the Bug Planner for BUG_ID=$BUG_ID. Read $BUG_DIR/research/verified-research.md and write $BUG_DIR/implementation-plan.md." \
  "$BUG_DIR/implementation-plan.md"

# ---------- 4. Bug Fixer ----------
run_agent \
  "$ROOT/agents/bug-fixer.agent.md" \
  "Run the Bug Fixer for BUG_ID=$BUG_ID. Read $BUG_DIR/implementation-plan.md, apply all steps, run npm test, and write $BUG_DIR/fix-summary.md." \
  "$BUG_DIR/fix-summary.md"

# Hard stop if tests fail after the fix.
log "Running npm test after Bug Fixer"
if ! (cd "$ROOT" && npm test --silent 2>&1 | tee -a "$LOG"); then
  fail "npm test failed after Bug Fixer — Security Verifier and Unit Test Generator skipped."
fi

# ---------- 5. Security Verifier ----------
run_agent \
  "$ROOT/agents/security-verifier.agent.md" \
  "Run the Security Verifier for BUG_ID=$BUG_ID. Read $BUG_DIR/fix-summary.md and the changed files, then write $BUG_DIR/security-report.md. Do not edit any code." \
  "$BUG_DIR/security-report.md"

# ---------- 6. Unit Test Generator ----------
run_agent \
  "$ROOT/agents/unit-test-generator.agent.md" \
  "Run the Unit Test Generator for BUG_ID=$BUG_ID. Load skills/unit-tests-FIRST.md, generate tests under tests/ for changed code only, run npm test, and write $BUG_DIR/test-report.md." \
  "$BUG_DIR/test-report.md"

log "Pipeline finished successfully — artifacts in $BUG_DIR"
