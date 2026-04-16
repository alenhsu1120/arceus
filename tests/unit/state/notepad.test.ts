import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  readNotepad,
  writeNotepad,
  appendToNotepad,
  ensureArceusDir,
  logEvent,
  readSessionLog,
} from "../../../src/state/index.js";

describe("Notepad", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    const parentDir = join(arceusDir, "..");
    rmSync(parentDir, { recursive: true, force: true });
  });

  it("should return empty string for non-existent notepad", () => {
    const content = readNotepad(arceusDir);
    expect(content).toBe("");
  });

  it("should write and read notepad content", () => {
    writeNotepad(arceusDir, "# My Notes\n\nSome content here.");
    const content = readNotepad(arceusDir);
    expect(content).toBe("# My Notes\n\nSome content here.");
  });

  it("should append sections to notepad", () => {
    appendToNotepad(arceusDir, "Progress", "Task 1 completed.");
    const content = readNotepad(arceusDir);
    expect(content).toContain("## Progress");
    expect(content).toContain("Task 1 completed.");
  });

  it("should replace existing sections", () => {
    appendToNotepad(arceusDir, "Progress", "Task 1 completed.");
    appendToNotepad(arceusDir, "Progress", "Task 2 completed.");
    const content = readNotepad(arceusDir);
    expect(content).not.toContain("Task 1 completed.");
    expect(content).toContain("Task 2 completed.");
  });
});

describe("ensureArceusDir", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    const parentDir = join(arceusDir, "..");
    rmSync(parentDir, { recursive: true, force: true });
  });

  it("should create directory structure", () => {
    expect(existsSync(join(arceusDir, "memory"))).toBe(true);
    expect(existsSync(join(arceusDir, "sessions"))).toBe(true);
    expect(existsSync(join(arceusDir, "skills"))).toBe(true);
  });
});

describe("SessionLog", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    const parentDir = join(arceusDir, "..");
    rmSync(parentDir, { recursive: true, force: true });
  });

  it("should log and read session events", () => {
    logEvent(arceusDir, "session-1", {
      timestamp: "2026-04-16T10:00:00Z",
      event: "test_event",
      data: { key: "value" },
    });

    logEvent(arceusDir, "session-1", {
      timestamp: "2026-04-16T10:01:00Z",
      event: "another_event",
    });

    const events = readSessionLog(arceusDir, "session-1");
    expect(events).toHaveLength(2);
    expect(events[0]!.event).toBe("test_event");
    expect(events[1]!.event).toBe("another_event");
  });

  it("should return empty array for non-existent session", () => {
    const events = readSessionLog(arceusDir, "non-existent");
    expect(events).toHaveLength(0);
  });
});
