/**
 * Change — persistent spec-driven artifacts under .arceus/changes/.
 *
 * Each change is a folder containing proposal, spec, tasks, decisions
 * and meta.json. The whole folder is git-committable so team members can
 * review each other's AI-produced plans before implementation.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

export type ChangeStatus = "draft" | "active" | "completed" | "archived";

export interface ChangeMeta {
  id: string;
  title: string;
  status: ChangeStatus;
  createdAt: string;
  updatedAt: string;
  author?: string;
  linkedPr?: string;
  linkedBranch?: string;
}

export interface Change extends ChangeMeta {
  dir: string;
  files: {
    proposal: string;
    spec: string;
    tasks: string;
    decisions: string;
  };
}

export interface ChangeSummary extends ChangeMeta {
  dir: string;
}

export interface CreateChangeOptions {
  author?: string;
  now?: Date;
}

const CHANGES_DIR = "changes";
const ARCHIVE_DIR = "archive";
const META_FILE = "meta.json";
const FILES = {
  proposal: "proposal.md",
  spec: "spec.md",
  tasks: "tasks.md",
  decisions: "decisions.md",
} as const;

// --- Path helpers ---

function getChangesRoot(arceusDir: string): string {
  return join(arceusDir, CHANGES_DIR);
}

function getArchiveRoot(arceusDir: string): string {
  return join(arceusDir, CHANGES_DIR, ARCHIVE_DIR);
}

function getChangeDir(arceusDir: string, id: string, archived = false): string {
  return archived
    ? join(getArchiveRoot(arceusDir), id)
    : join(getChangesRoot(arceusDir), id);
}

// --- Slug / id generation ---

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s一-鿿-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function uniqueId(arceusDir: string, baseId: string): string {
  const root = getChangesRoot(arceusDir);
  const archive = getArchiveRoot(arceusDir);
  let candidate = baseId;
  let n = 2;
  while (existsSync(join(root, candidate)) || existsSync(join(archive, candidate))) {
    candidate = `${baseId}-${n}`;
    n += 1;
  }
  return candidate;
}

// --- Templates ---

function proposalTemplate(title: string): string {
  return `# ${title}

## 為什麼 (Why)

_說明為什麼要做這個 change。問題是什麼、現況痛點、期望效益。_

## 範圍 (Scope)

_明確列出包含 / 不包含的項目。_

- **In scope**:
- **Out of scope**:

## Stakeholders

_誰是這個 change 的 owner / reviewer / 受影響的人。_
`;
}

function specTemplate(title: string): string {
  return `# Spec — ${title}

## 需求描述

_自由格式描述需求，可以寫 user story、功能列表、畫面示意等。_

## 驗收條件

_這個 change 被認為完成的條件。_

- [ ]
- [ ]

## 技術假設

_依賴的前提、外部系統、現有架構限制。_
`;
}

function tasksTemplate(title: string): string {
  return `# Tasks — ${title}

_實作階段的 checklist。arceus:coder 會依序處理並打勾回報。_

- [ ]
- [ ]
- [ ]
`;
}

function decisionsTemplate(title: string): string {
  return `# Decisions — ${title}

_記錄技術選擇與替代方案，避免未來重新爭論同樣的問題。_

## Decision 1:

- **Context**:
- **Options considered**:
- **Chosen**:
- **Rationale**:
`;
}

// --- Core operations ---

export function ensureChangesDir(arceusDir: string): void {
  const root = getChangesRoot(arceusDir);
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  const archive = getArchiveRoot(arceusDir);
  if (!existsSync(archive)) mkdirSync(archive, { recursive: true });
}

export function createChange(
  arceusDir: string,
  title: string,
  options: CreateChangeOptions = {},
): Change {
  if (!title.trim()) {
    throw new Error("Change title cannot be empty");
  }

  ensureChangesDir(arceusDir);

  const now = options.now ?? new Date();
  const datePart = formatDate(now);
  const slug = slugify(title);
  if (!slug) {
    throw new Error(`Cannot derive slug from title: "${title}"`);
  }
  const id = uniqueId(arceusDir, `${datePart}-${slug}`);
  const dir = getChangeDir(arceusDir, id);

  mkdirSync(dir, { recursive: true });

  const meta: ChangeMeta = {
    id,
    title: title.trim(),
    status: "draft",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...(options.author ? { author: options.author } : {}),
  };

  writeFileSync(
    join(dir, META_FILE),
    JSON.stringify(meta, null, 2) + "\n",
    "utf-8",
  );
  writeFileSync(join(dir, FILES.proposal), proposalTemplate(meta.title), "utf-8");
  writeFileSync(join(dir, FILES.spec), specTemplate(meta.title), "utf-8");
  writeFileSync(join(dir, FILES.tasks), tasksTemplate(meta.title), "utf-8");
  writeFileSync(
    join(dir, FILES.decisions),
    decisionsTemplate(meta.title),
    "utf-8",
  );

  return {
    ...meta,
    dir,
    files: {
      proposal: join(dir, FILES.proposal),
      spec: join(dir, FILES.spec),
      tasks: join(dir, FILES.tasks),
      decisions: join(dir, FILES.decisions),
    },
  };
}

function readMeta(dir: string): ChangeMeta | null {
  const metaPath = join(dir, META_FILE);
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, "utf-8")) as ChangeMeta;
  } catch {
    return null;
  }
}

function toChange(dir: string, meta: ChangeMeta): Change {
  return {
    ...meta,
    dir,
    files: {
      proposal: join(dir, FILES.proposal),
      spec: join(dir, FILES.spec),
      tasks: join(dir, FILES.tasks),
      decisions: join(dir, FILES.decisions),
    },
  };
}

export function getChange(arceusDir: string, id: string): Change | null {
  const activeDir = getChangeDir(arceusDir, id, false);
  if (existsSync(activeDir)) {
    const meta = readMeta(activeDir);
    if (meta) return toChange(activeDir, meta);
  }
  const archivedDir = getChangeDir(arceusDir, id, true);
  if (existsSync(archivedDir)) {
    const meta = readMeta(archivedDir);
    if (meta) return toChange(archivedDir, meta);
  }
  return null;
}

export interface ListChangesOptions {
  status?: ChangeStatus | ChangeStatus[];
  includeArchived?: boolean;
}

export function listChanges(
  arceusDir: string,
  options: ListChangesOptions = {},
): ChangeSummary[] {
  const root = getChangesRoot(arceusDir);
  if (!existsSync(root)) return [];

  const results: ChangeSummary[] = [];
  const statusFilter = options.status
    ? new Set(Array.isArray(options.status) ? options.status : [options.status])
    : null;

  const collectFrom = (parent: string) => {
    if (!existsSync(parent)) return;
    for (const name of readdirSync(parent)) {
      if (name === ARCHIVE_DIR) continue;
      const dir = join(parent, name);
      if (!statSync(dir).isDirectory()) continue;
      const meta = readMeta(dir);
      if (!meta) continue;
      if (statusFilter && !statusFilter.has(meta.status)) continue;
      results.push({ ...meta, dir });
    }
  };

  collectFrom(root);
  if (options.includeArchived) {
    collectFrom(getArchiveRoot(arceusDir));
  }

  results.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  return results;
}

export function updateChangeStatus(
  arceusDir: string,
  id: string,
  status: ChangeStatus,
): Change {
  const change = getChange(arceusDir, id);
  if (!change) throw new Error(`Change not found: ${id}`);

  const updated: ChangeMeta = {
    ...stripChangeFields(change),
    status,
    updatedAt: new Date().toISOString(),
  };

  writeFileSync(
    join(change.dir, META_FILE),
    JSON.stringify(updated, null, 2) + "\n",
    "utf-8",
  );

  return toChange(change.dir, updated);
}

export function archiveChange(arceusDir: string, id: string): Change {
  const change = getChange(arceusDir, id);
  if (!change) throw new Error(`Change not found: ${id}`);

  ensureChangesDir(arceusDir);
  const archivedDir = getChangeDir(arceusDir, id, true);

  if (change.dir === archivedDir) {
    return updateChangeStatus(arceusDir, id, "archived");
  }

  if (existsSync(archivedDir)) {
    throw new Error(`Archived change already exists: ${id}`);
  }

  renameSync(change.dir, archivedDir);

  const updated: ChangeMeta = {
    ...stripChangeFields(change),
    status: "archived",
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(
    join(archivedDir, META_FILE),
    JSON.stringify(updated, null, 2) + "\n",
    "utf-8",
  );
  return toChange(archivedDir, updated);
}

export function deleteChange(arceusDir: string, id: string): void {
  const change = getChange(arceusDir, id);
  if (!change) return;
  rmSync(change.dir, { recursive: true, force: true });
}

export function readChangeFile(
  change: Change,
  file: keyof Change["files"],
): string {
  const path = change.files[file];
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8");
}

export function writeChangeFile(
  change: Change,
  file: keyof Change["files"],
  content: string,
): void {
  writeFileSync(change.files[file], content, "utf-8");
  const meta = readMeta(change.dir);
  if (meta) {
    const updated: ChangeMeta = {
      ...meta,
      updatedAt: new Date().toISOString(),
    };
    writeFileSync(
      join(change.dir, META_FILE),
      JSON.stringify(updated, null, 2) + "\n",
      "utf-8",
    );
  }
}

function stripChangeFields(change: Change): ChangeMeta {
  const { dir: _dir, files: _files, ...meta } = change;
  void _dir;
  void _files;
  return meta;
}
