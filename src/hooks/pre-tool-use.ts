/**
 * PreToolUse hook — safety checks before tool execution.
 */

import { readStdin, writeOutput, passThrough } from "./utils.js";
import type { PreToolUseInput } from "./types.js";

// Dangerous command patterns to warn about
const DANGEROUS_PATTERNS = [
  /\brm\s+-rf\s+[/~]/,
  /\bgit\s+push\s+--force/,
  /\bgit\s+reset\s+--hard/,
  /\bdrop\s+(?:table|database)/i,
  /\bformat\s+[a-z]:/i,
];

async function main(): Promise<void> {
  const input = await readStdin<PreToolUseInput>();

  if (input.tool_name !== "Bash") {
    passThrough();
    return;
  }

  const command = (input.tool_input["command"] as string) ?? "";

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      writeOutput({
        continue: true,
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason: `[Arceus Safety] Potentially dangerous command detected: ${command.slice(0, 100)}`,
          additionalContext:
            "Arceus flagged this command as potentially dangerous. Please confirm before proceeding.",
        },
      });
      return;
    }
  }

  passThrough();
}

main().catch((err) => {
  process.stderr.write(`arceus pre-tool-use hook error: ${err}\n`);
  process.exit(0);
});
