/**
 * SubagentStop hook — collects subagent results and updates state.
 */

import { readStdin, writeOutput, passThrough, getArceusDir } from "./utils.js";
import type { SubagentStopInput } from "./types.js";
import { logEvent } from "../state/index.js";

async function main(): Promise<void> {
  const input = await readStdin<SubagentStopInput>();

  // Only track arceus agents
  if (!input.agent_type?.startsWith("arceus:")) {
    passThrough();
    return;
  }

  const arceusDir = getArceusDir(input.cwd);
  const agentName = input.agent_type.replace("arceus:", "");

  logEvent(arceusDir, input.session_id, {
    timestamp: new Date().toISOString(),
    event: "subagent_complete",
    agent: agentName,
    data: {
      agent_id: input.agent_id,
      result_preview: input.last_assistant_message?.slice(0, 500),
    },
  });

  // Inject reminder about verification after coder/debugger agents
  if (agentName === "coder" || agentName === "debugger") {
    writeOutput({
      continue: true,
      hookSpecificOutput: {
        hookEventName: "SubagentStop",
        additionalContext: `<arceus-verification-reminder>
The ${agentName} agent has completed. Before marking this task as done:
1. Run typecheck: npm run typecheck (or tsc --noEmit)
2. Run lint: npm run lint
3. Run tests: npm run test
4. Run build: npm run build

Do NOT mark the task complete until all verification steps pass.
</arceus-verification-reminder>`,
      },
    });
    return;
  }

  passThrough();
}

main().catch((err) => {
  process.stderr.write(`arceus subagent-stop hook error: ${err}\n`);
  process.exit(0);
});
