# Skill: Research Quality Measurement

**Purpose**: provide a consistent vocabulary and rubric for grading the
output of the Bug Researcher agent. This skill is consumed by the
**Research Verifier** when producing `verified-research.md`.

## Quality levels

| Label        | Score | When to assign |
|--------------|-------|----------------|
| `EXCELLENT`  | 5/5   | Every claim is verified against current source. Every `file:line` reference resolves. Every code snippet matches the file byte-for-byte. Root causes are stated, not just symptoms. Zero discrepancies. |
| `GOOD`       | 4/5   | All major claims verified. ≤ 1 minor discrepancy (e.g. line drifted by ±2, paraphrased snippet). Root causes identified for every reported defect. |
| `ACCEPTABLE` | 3/5   | The defects are correctly identified but at least one of: line numbers are stale, a snippet does not match, a root cause is missing or shallow. Planner can still proceed but must double-check locations. |
| `POOR`       | 2/5   | Multiple references do not resolve, snippets do not match, or a reported defect cannot be reproduced from the current source. Planner must NOT use this output as-is. |
| `UNUSABLE`   | 1/5   | Research is wrong or fabricated. Pipeline should stop. |

## Verification checklist (mandatory)

For every claim in `research/codebase-research.md`, the Verifier must:

1. **Resolve the path** — the referenced file exists in the working tree.
2. **Resolve the line(s)** — the referenced lines exist and are non-empty.
3. **Match the snippet** — quoted code matches the file verbatim
   (whitespace tolerant, semantics strict).
4. **Confirm the symptom** — reproduce the described behaviour or confirm
   it logically follows from the cited code.
5. **Confirm the root cause** — the cited code is *actually* the cause of
   the reported symptom, not a correlated location.

## Required structure of `verified-research.md`

```
# Verified Research — <bug-id>

## Verification Summary
- Overall result: PASS | FAIL
- Research Quality: <one of EXCELLENT | GOOD | ACCEPTABLE | POOR | UNUSABLE>
- Total claims checked: N
- Verified: N
- Discrepancies: N

## Verified Claims
- <claim> — `file:line` — verified ✓ — short note

## Discrepancies Found
- <claim> — expected vs actual — impact on plan

## Research Quality Assessment
- Level: <LABEL>
- Reasoning: <2–4 sentences explaining the rubric application>

## References
- Source files inspected, with `file:line` anchors.
```

## Hard rules

- The Verifier MUST cite this skill by name and version in
  `verified-research.md` (e.g. *"graded per
  `skills/research-quality-measurement.md`"*).
- The Verifier MUST NOT downgrade silently — every step down from
  `EXCELLENT` requires an entry in **Discrepancies Found**.
- If quality is `POOR` or `UNUSABLE`, the verifier sets
  `Overall result: FAIL`; the pipeline runner treats this as a hard stop.
