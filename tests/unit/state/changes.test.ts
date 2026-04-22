import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  slugify,
  createChange,
  getChange,
  listChanges,
  updateChangeStatus,
  archiveChange,
  deleteChange,
  readChangeFile,
  writeChangeFile,
  ensureArceusDir,
} from "../../../src/state/index.js";

describe("slugify", () => {
  it("converts spaces to hyphens and lowercases", () => {
    expect(slugify("Add Auth Module")).toBe("add-auth-module");
  });

  it("collapses repeated hyphens and strips edges", () => {
    expect(slugify("  --foo--bar  ")).toBe("foo-bar");
  });

  it("keeps CJK characters", () => {
    expect(slugify("新增 認證模組")).toBe("新增-認證模組");
  });

  it("caps length at 60 chars", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBe(60);
  });
});

describe("createChange", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    rmSync(join(arceusDir, ".."), { recursive: true, force: true });
  });

  it("creates a change with full folder structure", () => {
    const now = new Date("2026-04-22T10:00:00Z");
    const change = createChange(arceusDir, "Add Auth", { now });

    expect(change.id).toBe("2026-04-22-add-auth");
    expect(change.status).toBe("draft");
    expect(existsSync(change.dir)).toBe(true);
    expect(existsSync(change.files.proposal)).toBe(true);
    expect(existsSync(change.files.spec)).toBe(true);
    expect(existsSync(change.files.tasks)).toBe(true);
    expect(existsSync(change.files.decisions)).toBe(true);
    expect(existsSync(join(change.dir, "meta.json"))).toBe(true);
  });

  it("writes title into template files", () => {
    const now = new Date("2026-04-22T10:00:00Z");
    const change = createChange(arceusDir, "Ship feature X", { now });
    expect(readFileSync(change.files.proposal, "utf-8")).toContain(
      "# Ship feature X",
    );
    expect(readFileSync(change.files.spec, "utf-8")).toContain(
      "# Spec — Ship feature X",
    );
  });

  it("disambiguates colliding ids by appending -2, -3...", () => {
    const now = new Date("2026-04-22T10:00:00Z");
    const a = createChange(arceusDir, "Same Title", { now });
    const b = createChange(arceusDir, "Same Title", { now });
    const c = createChange(arceusDir, "Same Title", { now });
    expect(a.id).toBe("2026-04-22-same-title");
    expect(b.id).toBe("2026-04-22-same-title-2");
    expect(c.id).toBe("2026-04-22-same-title-3");
  });

  it("records author when provided", () => {
    const change = createChange(arceusDir, "Foo", {
      now: new Date("2026-04-22T10:00:00Z"),
      author: "mike",
    });
    expect(change.author).toBe("mike");
  });

  it("rejects empty titles", () => {
    expect(() => createChange(arceusDir, "   ")).toThrow();
  });
});

describe("listChanges", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    rmSync(join(arceusDir, ".."), { recursive: true, force: true });
  });

  it("returns empty array when no changes exist", () => {
    expect(listChanges(arceusDir)).toEqual([]);
  });

  it("lists all active changes sorted newest first", () => {
    createChange(arceusDir, "First", { now: new Date("2026-04-20T10:00:00Z") });
    createChange(arceusDir, "Second", { now: new Date("2026-04-21T10:00:00Z") });
    createChange(arceusDir, "Third", { now: new Date("2026-04-22T10:00:00Z") });

    const list = listChanges(arceusDir);
    expect(list.map((c) => c.title)).toEqual(["Third", "Second", "First"]);
  });

  it("filters by status", () => {
    const a = createChange(arceusDir, "Draft change", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    const b = createChange(arceusDir, "Active change", {
      now: new Date("2026-04-22T11:00:00Z"),
    });
    updateChangeStatus(arceusDir, b.id, "active");

    const drafts = listChanges(arceusDir, { status: "draft" });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.id).toBe(a.id);

    const actives = listChanges(arceusDir, { status: "active" });
    expect(actives).toHaveLength(1);
    expect(actives[0]!.id).toBe(b.id);
  });

  it("excludes archived by default, includes when requested", () => {
    const a = createChange(arceusDir, "Will archive", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    archiveChange(arceusDir, a.id);

    expect(listChanges(arceusDir)).toHaveLength(0);
    expect(listChanges(arceusDir, { includeArchived: true })).toHaveLength(1);
  });
});

describe("getChange", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    rmSync(join(arceusDir, ".."), { recursive: true, force: true });
  });

  it("finds active changes by id", () => {
    const { id } = createChange(arceusDir, "Find me", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    const found = getChange(arceusDir, id);
    expect(found?.title).toBe("Find me");
  });

  it("finds archived changes by id", () => {
    const { id } = createChange(arceusDir, "Archived one", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    archiveChange(arceusDir, id);
    const found = getChange(arceusDir, id);
    expect(found?.status).toBe("archived");
  });

  it("returns null for unknown ids", () => {
    expect(getChange(arceusDir, "nope")).toBeNull();
  });
});

describe("updateChangeStatus", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    rmSync(join(arceusDir, ".."), { recursive: true, force: true });
  });

  it("transitions draft → active → completed", () => {
    const { id } = createChange(arceusDir, "Lifecycle", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    expect(updateChangeStatus(arceusDir, id, "active").status).toBe("active");
    expect(updateChangeStatus(arceusDir, id, "completed").status).toBe(
      "completed",
    );
  });

  it("bumps updatedAt", async () => {
    const { id, updatedAt } = createChange(arceusDir, "ts", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    await new Promise((r) => setTimeout(r, 10));
    const updated = updateChangeStatus(arceusDir, id, "active");
    expect(updated.updatedAt).not.toBe(updatedAt);
  });
});

describe("archiveChange", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    rmSync(join(arceusDir, ".."), { recursive: true, force: true });
  });

  it("moves folder into archive/ and marks status", () => {
    const { id, dir: originalDir } = createChange(arceusDir, "to archive", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    const archived = archiveChange(arceusDir, id);
    expect(archived.status).toBe("archived");
    expect(archived.dir).toContain("/archive/");
    expect(existsSync(originalDir)).toBe(false);
    expect(existsSync(archived.dir)).toBe(true);
  });
});

describe("readChangeFile / writeChangeFile", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    rmSync(join(arceusDir, ".."), { recursive: true, force: true });
  });

  it("round-trips file content", () => {
    const change = createChange(arceusDir, "rw", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    writeChangeFile(change, "spec", "# Custom spec body");
    expect(readChangeFile(change, "spec")).toBe("# Custom spec body");
  });

  it("bumps meta updatedAt on write", async () => {
    const change = createChange(arceusDir, "ts", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    const original = change.updatedAt;
    await new Promise((r) => setTimeout(r, 10));
    writeChangeFile(change, "proposal", "new body");
    const after = getChange(arceusDir, change.id);
    expect(after?.updatedAt).not.toBe(original);
  });
});

describe("deleteChange", () => {
  let arceusDir: string;

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "arceus-test-"));
    arceusDir = join(tempDir, ".arceus");
    ensureArceusDir(arceusDir);
  });

  afterEach(() => {
    rmSync(join(arceusDir, ".."), { recursive: true, force: true });
  });

  it("removes the change folder", () => {
    const { id, dir } = createChange(arceusDir, "delete me", {
      now: new Date("2026-04-22T10:00:00Z"),
    });
    deleteChange(arceusDir, id);
    expect(existsSync(dir)).toBe(false);
    expect(getChange(arceusDir, id)).toBeNull();
  });

  it("is a no-op for unknown ids", () => {
    expect(() => deleteChange(arceusDir, "nope")).not.toThrow();
  });
});
