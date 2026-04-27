import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  runGitPreflight,
  isPreflightDone,
  markPreflightDone,
  ensureArceusDir,
} from "../../../src/state/index.js";

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf-8" }).trim();
}

function initRepo(dir: string): void {
  git(dir, "init", "--initial-branch=main");
  git(dir, "config", "user.email", "test@arceus.test");
  git(dir, "config", "user.name", "Arceus Test");
  git(dir, "config", "commit.gpgsign", "false");
  writeFileSync(join(dir, "README.md"), "init\n");
  git(dir, "add", "README.md");
  git(dir, "commit", "-m", "init");
}

describe("runGitPreflight", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "arceus-preflight-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns ok for non-git directories", () => {
    const result = runGitPreflight(tempDir);
    expect(result.ok).toBe(true);
  });

  it("blocks edits on the main branch", () => {
    initRepo(tempDir);
    const result = runGitPreflight(tempDir, { fetch: false });
    expect(result.ok).toBe(false);
    expect(result.currentBranch).toBe("main");
    expect(result.reason).toContain("protected branch");
    expect(result.suggestedBranch).toMatch(/^feature\//);
  });

  it("allows edits on a feature branch with no upstream", () => {
    initRepo(tempDir);
    git(tempDir, "checkout", "-b", "feature/test");
    const result = runGitPreflight(tempDir, { fetch: false });
    expect(result.ok).toBe(true);
    expect(result.currentBranch).toBe("feature/test");
  });

  it("blocks when local branch is behind upstream", () => {
    // Set up an upstream "remote" repo and a local clone
    const remoteDir = mkdtempSync(join(tmpdir(), "arceus-preflight-remote-"));
    try {
      initRepo(remoteDir);
      git(remoteDir, "checkout", "-b", "feature/work");
      writeFileSync(join(remoteDir, "a.txt"), "a\n");
      git(remoteDir, "add", "a.txt");
      git(remoteDir, "commit", "-m", "a");

      // Clone, then advance the remote so the clone falls behind.
      const cloneDir = join(tempDir, "clone");
      execFileSync("git", ["clone", "--branch", "feature/work", remoteDir, cloneDir], {
        encoding: "utf-8",
      });
      writeFileSync(join(remoteDir, "b.txt"), "b\n");
      git(remoteDir, "add", "b.txt");
      git(remoteDir, "commit", "-m", "b");

      const result = runGitPreflight(cloneDir, { fetch: true });
      expect(result.ok).toBe(false);
      expect(result.reason).toContain("behind");
    } finally {
      rmSync(remoteDir, { recursive: true, force: true });
    }
  });

  it("respects custom protectedBranches", () => {
    initRepo(tempDir);
    git(tempDir, "checkout", "-b", "feature/test");
    const result = runGitPreflight(tempDir, {
      fetch: false,
      protectedBranches: ["feature/test"],
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("feature/test");
  });

  it("skips upstream check when requireUpstreamSynced is false", () => {
    initRepo(tempDir);
    git(tempDir, "checkout", "-b", "feature/test");
    const result = runGitPreflight(tempDir, {
      fetch: false,
      requireUpstreamSynced: false,
    });
    expect(result.ok).toBe(true);
  });

  it("blocks on detached HEAD", () => {
    initRepo(tempDir);
    const sha = git(tempDir, "rev-parse", "HEAD");
    git(tempDir, "checkout", "--detach", sha);
    const result = runGitPreflight(tempDir, { fetch: false });
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Detached HEAD");
    expect(result.suggestedBranch).toMatch(/^feature\//);
  });
});

describe("preflight marker", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-preflight-marker-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    const parentDir = join(arceusDir, "..");
    rmSync(parentDir, { recursive: true, force: true });
  });

  it("starts as not done", () => {
    expect(isPreflightDone(arceusDir, "session-1")).toBe(false);
  });

  it("is done after marking", () => {
    markPreflightDone(arceusDir, "session-1");
    expect(isPreflightDone(arceusDir, "session-1")).toBe(true);
    expect(existsSync(join(arceusDir, "sessions", "session-1", "preflight.ok"))).toBe(true);
  });

  it("is per-session", () => {
    markPreflightDone(arceusDir, "session-1");
    expect(isPreflightDone(arceusDir, "session-2")).toBe(false);
  });
});
