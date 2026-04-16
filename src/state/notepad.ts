/**
 * Notepad — compaction-resistant persistent state.
 * Survives context resets by being written to .arceus/notepad.md.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

export interface NotepadEntry {
  section: string;
  content: string;
  updatedAt: string;
}

const NOTEPAD_FILE = "notepad.md";

function getNotepadPath(arceusDir: string): string {
  return join(arceusDir, NOTEPAD_FILE);
}

export function readNotepad(arceusDir: string): string {
  const path = getNotepadPath(arceusDir);
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8");
}

export function writeNotepad(arceusDir: string, content: string): void {
  const path = getNotepadPath(arceusDir);
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, content, "utf-8");
}

export function appendToNotepad(
  arceusDir: string,
  section: string,
  content: string,
): void {
  const existing = readNotepad(arceusDir);
  const timestamp = new Date().toISOString();
  const entry = `\n## ${section}\n_Updated: ${timestamp}_\n\n${content}\n`;

  // Replace existing section or append
  const sectionRegex = new RegExp(
    `## ${escapeRegex(section)}[\\s\\S]*?(?=\\n## |$)`,
  );
  const updated = sectionRegex.test(existing)
    ? existing.replace(sectionRegex, entry.trim())
    : existing + entry;

  writeNotepad(arceusDir, updated);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
