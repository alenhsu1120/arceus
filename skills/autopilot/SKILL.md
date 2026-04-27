---
name: autopilot
description: Full automated development workflow — plan, implement, test, review, complete
triggers: ["autopilot", "auto-pilot", "full-auto"]
agents: [planner, coder, tester, reviewer]
verification: [build, test, lint, typecheck]
---

# Autopilot Workflow

You are running in **Autopilot mode**. Execute the full development cycle automatically.

## Execution Steps

### Step 0: Preflight — Check Branch State
Before any planning or code changes, inspect the working tree:
- `git status` — any uncommitted / untracked files?
- `git log -5 --oneline` — recent commits
- `git diff` — if dirty, read the changes
- `git fetch --quiet` then `git status -sb` — confirm the local branch is not behind upstream
- Current branch — if on `main`/`master`/`develop`/`trunk`, switch to a feature branch (suggest `feature/<task-slug>`) before any edit. The PreToolUse preflight hook will hard-block edits otherwise.

If the tree has modifications that don't look like yours, STOP and confirm with the user before proceeding. Autopilot must not silently overwrite in-progress work.

### Step 0.5: Check for Active Change Proposals
Before planning from scratch, look for in-flight change proposals — the user may already have an approved spec waiting to be implemented:
- Run `npx arceus change list --status active` (or read `.arceus/changes/<id>/meta.json` files)
- **If exactly one `active` proposal exists**: STOP and ask the user "偵測到 active 提案 `<id>`，要走 `apply` 流程嗎？" Pivot to the `apply` skill if they confirm.
- **If multiple `active` proposals exist**: STOP and list them, ask which to apply (or whether to start fresh autopilot).
- **If none exist**: continue with Step 1.

This avoids re-planning work that was already specified, and keeps the team-collaboration trail intact.

### Step 1: Understand Requirements
- Read the user's request carefully
- Identify affected files and components
- Clarify scope (what IS and IS NOT included)

### Step 2: Plan (delegate to arceus:planner)
- Decompose into subtasks
- Identify risks and dependencies
- Determine execution order

### Step 3: Implement (delegate to arceus:coder for each subtask)
- Execute subtasks in dependency order
- Parallelize independent subtasks where possible
- Each subtask should be small and focused

### Step 4: Verify (delegate to arceus:tester)
- Run full verification: typecheck → lint → test → build
- If any step fails, fix and re-verify (max 3 rounds)

### Step 5: Review (delegate to arceus:reviewer)
- Code review the changes
- Fix any blocking issues found
- Re-verify after fixes

### Step 6: Complete
- Summarize what was done
- List all files changed
- Report verification results

## Failure Handling

- **Verification failure**: Auto-fix, max 3 rounds. After 3 failures, report to user with error details.
- **Planning failure**: Fall back to simpler approach or ask user for clarification.
- **Review blocking issues**: Fix them, re-verify, then continue.

## Rules

- Every subtask must pass verification before moving to the next
- Never skip verification steps
- If unsure about a design decision, ask the user before proceeding
- Keep the user informed of progress at each major step
