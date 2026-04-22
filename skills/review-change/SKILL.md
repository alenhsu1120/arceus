---
name: review-change
description: Review a change proposal (proposal + spec + tasks) before implementation begins
triggers: ["review-change", "審查"]
agents: [reviewer, researcher]
---

# Review Change Workflow

You are running in **Review Change mode**. Unlike `code-review` (which reviews code), this reviews a **proposal** — the requirements, scope, and task plan — before any code is written.

This is the team's AI-output gate: catching bad plans cheaply, before implementation wastes time.

## Execution Steps

### Step 1: Load the Change
Identify the change id (ask the user if unclear). If no id given:
```bash
npx arceus change list --status draft
```

Read all four files in `.arceus/changes/<id>/`:
- `proposal.md`
- `spec.md`
- `tasks.md`
- `decisions.md`
- `meta.json` (for status and author)

### Step 2: Review Perspectives (delegate to arceus:reviewer)

Evaluate the proposal from these angles:

**1. Clarity**
- Is the problem statement specific? (Cites real files/symbols, not vague "improve performance")
- Is scope unambiguous? (Clear in / out)
- Could another engineer implement this without asking follow-up questions?

**2. Correctness of Approach**
- Will the proposed approach actually solve the stated problem?
- Are there obvious alternative approaches that were dismissed without reason?
- Does it respect existing architecture? (Read surrounding code via arceus:researcher if unsure)

**3. Completeness**
- Are acceptance criteria testable?
- Are risks acknowledged (breaking changes, migrations, security implications)?
- Are stakeholders identified?

**4. Task Quality**
- Is each task small and independently verifiable?
- Are dependencies ordered correctly?
- Any task that's actually multiple tasks in disguise?

**5. Decisions**
- Are non-obvious technical choices documented?
- Are there silent assumptions that should be surfaced?

### Step 3: Structured Output

```
## Change Review: <id>

### Summary
One paragraph — what this change proposes, and overall quality.

### Blocking Issues (must resolve before apply)
- [BLOCK] description — which file (proposal.md / spec.md / tasks.md / decisions.md)

### Warnings (should address)
- [WARN] description — file

### Suggestions (optional)
- [SUGGEST] description — file

### Open Questions
- Questions the team needs to answer before implementation

### Verdict: APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION
```

## Rules

- Be specific — quote the exact line from proposal.md / spec.md / tasks.md
- A review with zero issues is fine if the proposal is good — don't invent problems
- Distinguish `BLOCK` (implementation would produce wrong result) from `WARN` (fixable later) from `SUGGEST` (taste)
- If the proposal is too vague to review, say so and list what's missing — don't try to fill gaps yourself
- Do NOT modify the change files yourself; output a review that the author acts on
