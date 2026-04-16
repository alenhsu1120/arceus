/**
 * Shared utilities for hook scripts.
 */

import type { HookBaseInput, HookOutput } from "./types.js";

/**
 * Read JSON from stdin (Claude Code sends hook input as JSON on stdin).
 */
export async function readStdin<T extends HookBaseInput>(): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  return JSON.parse(raw) as T;
}

/**
 * Write hook output as JSON to stdout.
 */
export function writeOutput(output: HookOutput): void {
  process.stdout.write(JSON.stringify(output));
}

/**
 * Pass-through output — continue without modification.
 */
export function passThrough(): void {
  writeOutput({ continue: true, suppressOutput: true });
}

/**
 * Inject additional context into Claude's conversation.
 */
export function injectContext(
  hookEventName: string,
  additionalContext: string,
): void {
  writeOutput({
    continue: true,
    hookSpecificOutput: {
      hookEventName,
      additionalContext,
    } as HookOutput["hookSpecificOutput"],
  });
}

/**
 * Resolve .arceus/ directory path for a project.
 */
export function getArceusDir(cwd: string): string {
  return `${cwd}/.arceus`;
}

/**
 * Get the plugin root directory.
 */
export function getPluginRoot(): string {
  return process.env["CLAUDE_PLUGIN_ROOT"] ?? process.cwd();
}
