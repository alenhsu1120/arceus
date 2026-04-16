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
