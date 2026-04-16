/**
 * Stop hook — saves state before session ends.
 */

import { readStdin, passThrough, getArceusDir } from "./utils.js";
import type { StopInput } from "./types.js";
import { logEvent } from "../state/index.js";

async function main(): Promise<void> {
  const input = await readStdin<StopInput>();
  const arceusDir = getArceusDir(input.cwd);

  logEvent(arceusDir, input.session_id, {
    timestamp: new Date().toISOString(),
    event: "session_stop",
  });

  // Future: check if there are incomplete tasks that need persistence
  // For now, just log and pass through

  passThrough();
}

main().catch((err) => {
  process.stderr.write(`arceus stop hook error: ${err}\n`);
  process.exit(0);
});
