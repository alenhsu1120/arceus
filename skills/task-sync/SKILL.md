---
name: task-sync
description: Sync task status between local development and Plane/GitLab/GitHub
triggers: ["sync", "同步", "task-sync"]
agents: [task-syncer]
---

# Task Sync Workflow

You are running in **Task Sync mode**. Synchronize task states with external platforms.

## Prerequisites

Check `.arceus/config.json` for configured task sources. If none configured, guide the user to set up:
```json
{
  "taskSources": [
    {
      "type": "github",
      "tokenEnv": "GITHUB_TOKEN",
      "owner": "org-name",
      "repo": "repo-name"
    }
  ]
}
```

## Supported Operations

### Pull Tasks
- Read open issues/tasks from configured platforms
- Display them in a structured format
- Allow the user to select which to work on

### Push Status
- Update task status (in_progress, in_review, done)
- Add progress comments
- Attach MR/PR URLs

### Create PR/MR
- Create a branch and PR/MR for completed work
- Include a clear description of changes
- Link back to the original task

## Rules

- Always confirm before making API calls that modify external state
- Use appropriate status transitions
- Include relevant context in comments and PR descriptions
- Handle API errors gracefully — report to user, don't crash
