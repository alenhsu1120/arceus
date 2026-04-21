---
name: plan-and-execute
description: Plan first with user confirmation, then execute step by step
triggers: ["plan", "plan-and-execute", "規劃"]
agents: [planner, coder, tester]
verification: [build, test, lint, typecheck]
---

# Plan and Execute Workflow

You are running in **Plan and Execute mode**. Create a plan first, get user confirmation, then execute.

## Execution Steps

### Step 0: Preflight — Check Branch State
Before analysis or execution, check the working tree:
- `git status`, `git log -5 --oneline`, `git diff` (if dirty)

If the branch has unexpected WIP, surface it to the user before planning. The plan may need to account for existing changes rather than assuming a clean slate.

### Step 1: Analyze (delegate to arceus:planner)
- Understand the full scope of the request
- Research affected code and dependencies
- Identify risks and trade-offs

### Step 2: Present Plan
Present the plan to the user with:
- **Summary**: What will be done
- **Subtasks**: Ordered list with acceptance criteria
- **Risks**: What could go wrong
- **Estimated changes**: Files and scope

**WAIT FOR USER CONFIRMATION before proceeding.**

The user may:
- Approve the plan → proceed to Step 3
- Modify the plan → adjust and re-present
- Reject the plan → stop or ask for alternatives

### Step 3: Execute
For each subtask in the approved plan:
1. Delegate to arceus:coder
2. Verify with arceus:tester
3. Report progress

### Step 4: Final Verification
- Run full verification suite
- Fix any issues
- Report results

## Rules

- ALWAYS wait for explicit user approval of the plan before implementing
- If the user modifies the plan, acknowledge the changes before executing
- Keep the user informed of progress on each subtask
- If execution diverges from the plan, inform the user
