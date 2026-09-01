# Arceus

> 阿爾宙斯——創造世界的傳說寶可夢，擁有全部屬性。

Claude Code 多 Agent 協作插件。透過 magic keywords 觸發工作流，用 subagent 真正執行任務，evidence-driven 驗證確保品質。

## 功能

- **Magic Keywords** — 在 Claude Code 裡用自然語言觸發工作流
- **6 種 Skills** — autopilot、plan-and-execute、code-review、debug-loop、deep-analysis、rpg-convert
- **8 個 Agents** — planner、coder、tester、reviewer、researcher、api-writer、rpg-analyzer、front-check
- **Evidence-Driven** — 任務完成前必須通過 build/test/lint 驗證
- **持久化狀態** — `.arceus/` 目錄保存 notepad、session log、config

## 安裝

```bash
# 方式 A：開發測試
claude --plugin-dir /path/to/arceus

# 方式 B：透過 marketplace 安裝
claude plugin marketplace add /path/to/marketplace
claude plugin install arceus@marketplace-name
```

安裝後在目標專案初始化：

```bash
arceus init
```

## 使用方式

在 Claude Code 對話中輸入 magic keyword 即可觸發：

| Keyword | 效果 |
|---------|------|
| `autopilot` | 全自動：規劃 → 實作 → 測試 → review → 完成 |
| `plan` / `規劃` | 先出計畫，確認後再執行 |
| `review` | 多角度 code review |
| `fix` / `debug` | 反覆除錯直到測試通過 |
| `deep-dive` / `分析` | 深度程式碼分析 |
| `rpg-convert` / `RPG轉換` | RPG→Python 全流程轉換：rpg-analyzer → planner → coder → researcher → tester → api-writer → front-check → reviewer |

### 範例

```
幫我用 autopilot 實作使用者登入功能

plan 重構 API 路由層

review 目前的 diff

debug 這個測試為什麼失敗
```

## Agents

| Agent | 說明 | Model | Level |
|---|---|---|---|
| `planner` | 需求分析、風險評估、任務拆解 | claude-opus-4-6 | 3 |
| `coder` | 專注實作程式碼（RPG → Python FastAPI 轉換 SOP） | claude-sonnet-4-6 | 2 |
| `tester` | 執行驗證指令並回報通過/失敗結果 | claude-sonnet-4-6 | 2 |
| `reviewer` | 多角度程式碼審查（正確性、安全性、效能、風格） | claude-sonnet-4-6 | 2 |
| `researcher` | 為 Job 模組寫 README.md | claude-sonnet-4-6 | 2 |
| `api-writer` | 寫 FastAPI endpoint 檔案並註冊到路由檔 | claude-sonnet-4-6 | 2 |
| `rpg-analyzer` | 分析 RPG/CLP 原始檔，追蹤引用的程式和檔案，複製到 Data/ 目錄 | claude-sonnet-4-6 | 2 |
| `front-check` | 檢查功能開發完成後：日期格式（YYYY-MM-DD）、DSUSER 不可有長度限制、execute report 需含 company_code/company_name、權限檢查需使用共用 permissions_check() | claude-sonnet-4-6 | 2 |

Agent 定義位於 [`agents/*.md`](agents/)。

## 架構

```
Hooks → Skills → Agents → State
```

四層設計，參考 [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) 的模式：

1. **Hooks** — 掛入 Claude Code lifecycle，偵測 keyword、注入 context
2. **Skills** — 可組合的工作流定義（markdown SKILL.md）
3. **Agents** — 專職 agent（markdown 定義，透過 subagent 執行）
4. **State** — `.arceus/` 持久化（notepad、session log、config）

```
arceus/
├── .claude-plugin/plugin.json   # Plugin manifest
├── hooks/hooks.json             # Lifecycle hook 註冊
├── agents/*.md                  # Agent 定義
├── skills/*/SKILL.md            # Skill 工作流
├── .mcp.json                    # MCP server 設定
├── src/
│   ├── hooks/                   # Hook 實作（TypeScript）
│   ├── state/                   # .arceus/ 狀態管理
│   ├── index.ts                 # 主要 exports
│   └── cli.ts                   # CLI (init, status)
└── tests/
```

詳細架構文件：[docs/architecture/arceus-plugin-architecture.md](docs/architecture/arceus-plugin-architecture.md)

## 開發

```bash
npm install
npm run build        # tsup → dist/
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest
npm run verify       # 全部跑一遍
```

## 授權

Apache-2.0
