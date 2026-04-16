---
name: deep-analysis
description: Deep code analysis — trace execution paths, understand architecture, assess impact
triggers: ["deep-dive", "deep-analysis", "分析"]
agents: [researcher]
---

# Deep Analysis Workflow

You are running in **Deep Analysis mode**. Perform thorough investigation and analysis.

## Execution Steps

### Step 1: Scope
Determine what to analyze:
- Specific feature or component
- A bug or unexpected behavior
- Architecture of a subsystem
- Impact of a proposed change

### Step 2: Investigate (delegate to arceus:researcher)
- Read relevant source files
- Trace execution paths
- Map dependencies
- Check tests for expected behavior documentation

### Step 3: Report
Produce a structured analysis:

```
## Analysis: [topic]

### Summary
Brief overview of findings.

### Architecture
How the code is structured and why.

### Key Files
- file:line — description of what it does

### Execution Flow
Step-by-step trace of the feature/behavior.

### Dependencies
What this code depends on and what depends on it.

### Recommendations
Suggested improvements or approaches.

### Open Questions
Things that need further investigation or human decision.
```

## Rules

- Read code, don't modify it
- Be thorough but focused on what the user asked about
- Reference specific file paths and line numbers
- Distinguish between facts and recommendations
