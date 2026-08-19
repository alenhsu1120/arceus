/**
 * SubagentStop hook — collects subagent results and updates state.
 */

import { existsSync } from "fs";
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
    const cwd = input.cwd ?? process.cwd();
    const hasPackageJson = existsSync(`${cwd}/package.json`);
    const isPython =
      existsSync(`${cwd}/pyproject.toml`) ||
      existsSync(`${cwd}/requirements.txt`) ||
      existsSync(`${cwd}/setup.py`);

    let verificationSteps: string;
    if (hasPackageJson) {
      verificationSteps = `1. Run typecheck: npm run typecheck (or tsc --noEmit)
2. Run lint: npm run lint
3. Run tests: npm run test
4. Run build: npm run build`;
    } else if (isPython) {
      verificationSteps = `1. Run tests: python -m pytest tests/ (or python -m unittest discover -v)
2. Check syntax: python -m py_compile <changed files>`;
    } else {
      verificationSteps = `1. Run the project's test suite
2. Verify the build/compilation succeeds`;
    }

    writeOutput({
      continue: true,
      suppressOutput: false,
      systemMessage: `[arceus] ${agentName} agent completed. Verification checklist:\n${verificationSteps}`,
    });
    return;
  }

  passThrough();
}

main().catch((err) => {
  process.stderr.write(`arceus subagent-stop hook error: ${err}\n`);
  process.exit(0);
});
