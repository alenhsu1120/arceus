---
name: apply
description: Implement an approved change proposal from .arceus/changes/<id>/
triggers: ["apply", "實作"]
agents: [coder, tester, reviewer]
verification: [typecheck, lint, test, build]
---

# Apply Workflow

You are running in **Apply mode**. Take an approved change proposal and implement it, following `tasks.md` as the source of truth.

## Execution Steps

### Step 0: Preflight — Check Branch State
- `git status`, `git log -5 --oneline`, `git diff` (if dirty)
- If the tree has modifications that don't look like yours, STOP and ask the user

### Step 1: Load the Change
Identify the target change id from the user's message. If the user didn't specify one:
```bash
npx arceus change list --status active
```
Ask the user which change to apply if more than one is active.

Read all four files:
- `proposal.md` — context and why
- `spec.md` — acceptance criteria
- `tasks.md` — the checklist to execute
- `decisions.md` — technical decisions to respect

### Step 2: Verify Approval Gate
- `meta.json` status must be `active` (not `draft`). If it's still `draft`, stop and tell the user to approve via `npx arceus change status <id> active` first.
- Confirm the task checklist is non-empty.

### Step 3: Execute Tasks (delegate to arceus:coder)
For each unchecked item in `tasks.md`:
1. Delegate the subtask to `arceus:coder`
2. After the coder reports completion, mark the item `[x]` in `tasks.md`
3. Commit or leave uncommitted per user preference (do NOT auto-commit unless user asks)
4. Continue to the next task

**Parallelize** independent tasks when possible (multiple subagent delegations in one turn).

### Step 4: Verify (delegate to arceus:tester)
Run full verification: typecheck → lint → test → build.

If any step fails:
- Fix and re-run (max 3 rounds)
- If still failing after 3 rounds, report to user with error details and stop

### Step 5: Review (delegate to arceus:reviewer)
Review the implemented diff against `spec.md` acceptance criteria:
- Does the code satisfy every acceptance criterion?
- Any blocking correctness/security/performance issues?

Fix blocking issues, re-verify.

### Step 6: Complete
When all tasks are checked and verification passes:
```bash
npx arceus change status <id> completed
```

Report to the user:
- Summary of what was done
- Files changed
- Verification results
- Suggest archiving (`npx arceus change archive <id>`) once the linked PR is merged

## Rules

- Never implement anything not listed in `tasks.md` — if scope creep is needed, update the spec and ask the user first
- Every task MUST pass verification before being marked complete
- If a task turns out to be wrong or infeasible, stop and update the spec/tasks with the user before proceeding
- Preserve the original `decisions.md` rationale; only append new decisions, never rewrite history
- The coder never modifies `meta.json` manually — use `npx arceus change status` CLI
