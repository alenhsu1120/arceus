---
name: debug-loop
description: Iterative debug loop — fix, test, repeat until all tests pass
triggers: ["fix", "debug", "debug-loop", "tdd", "test-first"]
agents: [coder, tester]
verification: [build, test, lint, typecheck]
---

# Debug Loop Workflow

You are running in **Debug Loop mode**. Fix the issue through iterative test-fix cycles.

## Execution Steps

### Step 0: Preflight — Check Branch State
Before touching any code, check the working tree:
- `git status`, `git log -5 --oneline`, `git diff` (if dirty)

If there are uncommitted changes, decide with the user whether they're part of the bug being debugged or unrelated WIP that must be preserved. Fix-loops can iterate many edits — starting from a clean understanding of the baseline is essential.

### Step 1: Identify the Problem
- Run the failing tests or commands to reproduce the issue
- Read error messages and stack traces carefully
- Identify the root cause (not just symptoms)

### Step 2: Fix Loop (max 5 rounds)
For each round:
1. **Analyze** the current failure
2. **Fix** the root cause (delegate to arceus:coder)
3. **Verify** all tests pass (delegate to arceus:tester)
4. If tests pass → done
5. If tests fail → analyze new failure, go to next round

### Step 3: Report
- What was the root cause
- What was changed to fix it
- Verification results
- If unfixed after 5 rounds, report what was tried and what remains

## Rules

- Fix the ROOT CAUSE, not just symptoms
- Don't introduce new issues while fixing
- Run the FULL test suite, not just the failing test
- If a fix causes other tests to fail, that doesn't count as fixed
- After 5 rounds, stop and report to the user
