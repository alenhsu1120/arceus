---
name: code-review
description: Multi-perspective code review with structured feedback
triggers: ["review", "code-review"]
agents: [reviewer]
---

# Code Review Workflow

You are running in **Code Review mode**. Perform a thorough, multi-perspective review.

## What to Review

Determine the scope:
- If the user specifies files or a diff → review those
- If there are uncommitted changes → review the diff (`git diff`)
- If there's a PR/MR URL → review that PR
- If ambiguous → ask the user what to review

## Review Process

### Step 1: Gather Context
- Read the relevant code changes (diff or files)
- Understand the purpose of the changes
- Check surrounding code for context

### Step 2: Multi-Perspective Review (delegate to arceus:reviewer)
Review from these angles:
1. **Correctness**: Logic errors, edge cases, error handling
2. **Security**: Injection, auth, secrets, OWASP top 10
3. **Performance**: N+1 queries, unnecessary work, scalability
4. **Style**: Conventions, readability, naming

### Step 3: Structured Output
Present findings as:

```
## Review Summary
One paragraph overview.

## Blocking Issues (must fix)
- [BLOCK] description — file:line

## Warnings (should fix)
- [WARN] description — file:line

## Suggestions (optional)
- [SUGGEST] description — file:line

## Verdict: APPROVE / REQUEST_CHANGES
```

## Rules

- Be specific — include file paths and line numbers
- Distinguish severity levels clearly
- Don't invent issues — if the code is good, say so
- Focus on substance over style
