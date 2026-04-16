/**
 * Arceus — Claude Code Plugin
 *
 * Multi-agent orchestration via hooks, skills, and subagent delegation.
 * This module exports the state management API for use by MCP tools.
 */

export {
  readNotepad,
  writeNotepad,
  appendToNotepad,
  logEvent,
  readSessionLog,
  readConfig,
  writeConfig,
  ensureArceusDir,
} from "./state/index.js";

export type {
  NotepadEntry,
  SessionEvent,
  ArceusProjectConfig,
  TaskSourceEntry,
} from "./state/index.js";

export type {
  HookInput,
  HookOutput,
  SessionStartInput,
  UserPromptSubmitInput,
  PreToolUseInput,
  PostToolUseInput,
  SubagentStopInput,
  StopInput,
} from "./hooks/types.js";
