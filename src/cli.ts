import { Command } from "commander";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeConfig, ensureArceusDir } from "./state/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

const program = new Command();

program
  .name("arceus")
  .description("Claude Code plugin — multi-agent orchestration with magic keywords")
  .version(getVersion());

program
  .command("init")
  .description("Initialize .arceus/ directory in the current project")
  .action(() => {
    const cwd = process.cwd();
    const arceusDir = join(cwd, ".arceus");

    if (existsSync(arceusDir)) {
      console.log(".arceus/ already exists. Skipping initialization.");
      return;
    }

    ensureArceusDir(arceusDir);
    writeConfig(arceusDir, {
      verification: {
        typecheck: "npm run typecheck",
        lint: "npm run lint",
        test: "npm run test",
        build: "npm run build",
      },
      maxRetries: 3,
    });

    console.log("Initialized .arceus/ directory with default config.");
    console.log("Edit .arceus/config.json to configure task sources and model preferences.");
  });

program
  .command("status")
  .description("Show Arceus plugin status")
  .action(() => {
    const cwd = process.cwd();
    const arceusDir = join(cwd, ".arceus");
    const configPath = join(arceusDir, "config.json");

    if (!existsSync(arceusDir)) {
      console.log("Arceus not initialized. Run `arceus init` first.");
      return;
    }

    console.log("Arceus Plugin Status");
    console.log("====================");
    console.log(`  Directory: ${arceusDir}`);
    console.log(`  Config: ${existsSync(configPath) ? "found" : "missing"}`);
    console.log(`  Notepad: ${existsSync(join(arceusDir, "notepad.md")) ? "has content" : "empty"}`);

    const sessionsDir = join(arceusDir, "sessions");
    if (existsSync(sessionsDir)) {
      try {
        const sessions = readdirSync(sessionsDir);
        console.log(`  Sessions: ${sessions.length}`);
      } catch {
        console.log("  Sessions: unknown");
      }
    }
  });

program.parse();
