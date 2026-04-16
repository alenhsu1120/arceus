/**
 * Arceus project config — stored in .arceus/config.json.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

export interface ArceusProjectConfig {
  /** Task sources to sync with */
  taskSources?: TaskSourceEntry[];
  /** Model preferences per agent type */
  modelPreferences?: Record<string, string>;
  /** Verification commands to run */
  verification?: {
    build?: string;
    test?: string;
    lint?: string;
    typecheck?: string;
  };
  /** Max retry rounds for verification failures */
  maxRetries?: number;
}

export interface TaskSourceEntry {
  type: "github" | "gitlab" | "plane";
  token?: string;
  tokenEnv?: string;
  owner?: string;
  repo?: string;
  url?: string;
  workspace?: string;
  project?: string;
}

const CONFIG_FILE = "config.json";

function getConfigPath(arceusDir: string): string {
  return join(arceusDir, CONFIG_FILE);
}

export function readConfig(arceusDir: string): ArceusProjectConfig {
  const path = getConfigPath(arceusDir);
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf-8")) as ArceusProjectConfig;
}

export function writeConfig(
  arceusDir: string,
  config: ArceusProjectConfig,
): void {
  const path = getConfigPath(arceusDir);
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function ensureArceusDir(arceusDir: string): void {
  if (!existsSync(arceusDir)) {
    mkdirSync(arceusDir, { recursive: true });
  }
  // Ensure subdirectories
  for (const sub of ["memory", "sessions", "skills"]) {
    const dir = join(arceusDir, sub);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}
