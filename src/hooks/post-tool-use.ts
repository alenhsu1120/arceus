/**
 * PostToolUse hook — records tool execution results.
 */

import { readStdin, passThrough, getArceusDir } from "./utils.js";
import type { PostToolUseInput } from "./types.js";
import { logEvent } from "../state/index.js";

async function main(): Promise<void> {
  const input = await readStdin<PostToolUseInput>();
  const arceusDir = getArceusDir(input.cwd);

  // Log significant tool uses (skip noisy ones)
  const significantTools = ["Bash", "Edit", "Write", "Agent"];
  if (significantTools.includes(input.tool_name)) {
    logEvent(arceusDir, input.session_id, {
      timestamp: new Date().toISOString(),
      event: "tool_use",
      data: {
        tool: input.tool_name,
        input: truncate(JSON.stringify(input.tool_input), 500),
        response: truncate(input.tool_response, 500),
      },
    });
  }

  passThrough();
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

main().catch((err) => {
  process.stderr.write(`arceus post-tool-use hook error: ${err}\n`);
  process.exit(0);
});
