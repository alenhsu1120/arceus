# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arceus is a **Claude Code plugin** that provides multi-agent orchestration through hooks, magic keywords, skills, and subagent delegation. Named after the Pokémon that created the world with all types — a universal AI collaboration engine.

Architecture reference: `docs/architecture/arceus-plugin-architecture.md`

## Language Rules

- Respond in **Traditional Chinese** (繁體中文)
- Code: **TypeScript** (English variable names, comments)
- Documentation (docs/): **Traditional Chinese**

## Build / Test / Lint Commands

```bash
npm run build        # tsup → dist/ (ESM, hooks bundled standalone)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/
npm run lint:fix     # eslint src/ --fix
npm run test         # vitest run
npm run test:watch   # vitest (watch mode)
npm run verify       # typecheck + lint + test + build (all in sequence)
```

CLI: `node dist/cli.js --version`

## Plugin Architecture

### Four-Layer Design (Hooks → Skills → Agents → State)

```
.claude-plugin/plugin.json    # Plugin manifest
hooks/hooks.json              # Hook registrations (lifecycle events)
agents/*.md                   # Agent definitions (markdown + YAML frontmatter)
skills/*/SKILL.md             # Skill workflow definitions
.mcp.json                     # MCP server for state tools
```

### Source Structure

```
src/
├── hooks/                    # Hook implementations (each is a standalone entry point)
│   ├── types.ts              # Hook stdin/stdout protocol types
│   ├── utils.ts              # Shared hook utilities (readStdin, writeOutput)
│   ├── session-start.ts      # SessionStart: load .arceus/ state, inject context
│   ├── keyword-detector.ts   # UserPromptSubmit: magic keyword detection + skill injection
│   ├── pre-tool-use.ts       # PreToolUse: safety checks on dangerous commands
│   ├── post-tool-use.ts      # PostToolUse: log tool execution results
│   ├── subagent-stop.ts      # SubagentStop: collect results, inject verification reminders
│   └── stop.ts               # Stop: save state before session ends
├── state/                    # .arceus/ state management
│   ├── notepad.ts            # Compaction-resistant persistent notes
│   ├── session-log.ts        # JSONL event log per session
│   └── config.ts             # Project config (.arceus/config.json)
├── index.ts                  # Main exports (state API + types)
└── cli.ts                    # CLI (arceus init, arceus status)
```

### Hook Protocol

Hooks receive JSON on stdin from Claude Code and output JSON to stdout:
- Input: `{ session_id, cwd, prompt, tool_name, ... }` (varies by event)
- Output: `{ continue, hookSpecificOutput: { additionalContext } }` to inject context

### Magic Keywords

| Keyword | Skill | Effect |
|---------|-------|--------|
| autopilot | autopilot | Full auto: plan → implement → test → review |
| plan / 規劃 | plan-and-execute | Plan first, confirm, then execute |
| review | code-review | Multi-perspective code review |
| fix / debug | debug-loop | Iterative fix until tests pass |
| sync / 同步 | task-sync | Sync task status to platforms |
| deep-dive / 分析 | deep-analysis | Deep code investigation |

### Agents (subagent delegation)

Agents are defined as markdown files in `agents/`. Used via Claude Code's Task/Agent system with `subagent_type="arceus:<name>"`.

### Evidence-Driven Verification

All code changes must pass: typecheck → lint → test → build before completion.
