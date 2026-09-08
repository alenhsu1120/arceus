---
name: bc-check
description: 移除 CHANGELOG.md 後，執行 rpg-convert 流程中除 coder 以外的所有階段（分析 → 規劃 → 文件 → 測試 → API → 前端規範檢查 → 審查）
triggers: ["bc-check", "bc檢查", "BC檢查"]
agents: [rpg-analyzer, planner, researcher, tester, api-writer, front-check, reviewer]
verification: [build, test]
---

# BC Check Workflow

你正在執行 **BC Check 模式**。這是 `rpg-convert` 的「複核版」：針對**已經有實作**的 Job，先清掉 `CHANGELOG.md`，再依序跑完 rpg-convert 的所有階段，**唯一不跑的是 `arceus:coder`**（不重寫、不新增業務邏輯實作）。

用途：檢查既有 Job 的實作是否符合 RPG 原始邏輯與專案規範，並補齊文件、測試、endpoint 與審查結論。

**與 rpg-convert 相同**：這**不是**無人值守模式。遇到失敗、缺漏、或任何需要人判斷的情況，一律停下來問使用者，不自行猜測繼續。

## 輸入

使用者提供一個或多個 Job 路徑（例如 `EE18/Job15`）。若同時提供入口程式檔名，直接採用；若沒有，Step 1 前先自行研究確認入口程式（找該 Job 目前 `Data/` 下既有檔案、查同一個共用選單 CLP／README 慣例、grep 股代資料庫找出真正呼叫它的入口）。

可一次接收多個 Job；逐個依序完整跑完所有階段再換下一個 Job（不要並行跑多個 Job）。

## Step 0：Preflight — 確認分支狀態

- `git status`、`git log -5 --oneline`、`git diff`（若有未提交變更）
- 若工作區有看起來不是這次任務產生的異動，STOP 並詢問使用者後再繼續

## Step 0.5：移除 CHANGELOG.md

- 在目標 Job 目錄下尋找 `CHANGELOG.md`（例如 `find <Job 目錄> -name CHANGELOG.md`）。
- 找到就刪除：已被 git 追蹤用 `git rm CHANGELOG.md`，未追蹤用 `rm`。刪除前先 `cat` 一次確認內容是這個 Job 的變更記錄檔（本專案文件慣例只保留 `README.md`）。
- 找不到就記錄「無 CHANGELOG.md，略過」，直接進入 Step 1。
- **範圍限定在本次處理的 Job 目錄**；不要刪除 repo 其他位置或第三方套件的 `CHANGELOG.md`。若在 Job 目錄外看到 `CHANGELOG.md`，STOP 並詢問使用者。

## Step 1：rpg-analyzer

- 委派 `arceus:rpg-analyzer`，目標目錄為該 Job 資料夾，明確告知已知的呼叫鏈背景（減少 agent 重新摸索的時間）。
- 收到報告後檢查「找不到的參照」清單：
  - 純粹是系統 API（如 QCAEXEC）、印表機定義檔（無原始碼）、或已被 comment out 的死碼 → 可略過繼續
  - 看起來像真正遺漏的程式來源 → **STOP**，向使用者確認是否要手動補齊來源後再繼續，不要自行假設略過

## Step 2：planner（delegate to arceus:planner）

- 提供 Step 1 收集到的 RPG/CLP/DSPF 原始碼路徑，請 planner 解讀 F-spec/E-spec/I-spec(DS)/C-spec，產出：
  - 這個 Job 實際存在哪些操作（查詢、新增、修改、刪除、列印、批次處理等）
  - 依「一個檔案對應一個實際存在的 API 功能」應有的檔案清單與各檔案要實作的 function
  - 風險與不確定點（例如欄位定義查不到、DBCS 欄位切分需要換算）
- **本模式的重點**：把 planner 的預期結果與**目前既有的 Python 實作**逐項對照，列出「已實作／缺漏／與 RPG 不符」三類差異，作為後續各階段與最終報告的依據。
  - 對照前先讀該 Job 的 `README.md`，確認差異是否已被記錄為「刻意略去／已補上」，避免把既有決策誤報成缺口。
- 若風險清單中出現「需要人判斷」的項目（業務邏輯有歧義、找不到欄位定義且無法從既有慣例合理推斷），**STOP** 並詢問使用者。

## Step 3：（跳過 coder）

**不委派 `arceus:coder`**，也不自行改寫業務邏輯檔或 `dal.py`。

Step 2 找出的缺漏或與 RPG 不符之處，只**記錄**下來帶進最終報告，不在本流程中實作。若使用者要求修正，請他改用 `rpg-convert` 或直接指定 coder 任務。

## Step 4：researcher（delegate to arceus:researcher）

- 依既有程式碼撰寫／更新該 Job 的 `README.md`（函式清單、輸入欄位、錯誤代碼、回傳結構、DAL 對照表）。
- 內容一律以**實際的程式碼**為依據；若讀不到足夠資訊寫出完整章節，略去該節即可，不要杜撰內容。
- Step 0.5 刪掉的 `CHANGELOG.md` 內容**不要**搬進 `README.md`。

## Step 5：tester（delegate to arceus:tester）

- 執行單元測試與整合測試（`python -m unittest tests.<Job>.unittest -v`、`python -m tests.<Job>.test`）。
- 不要用 `python3 -c "..."` 之類的臨時腳本去戳 DB 連線或查表是否存在——驗證一律走專案既有的測試執行慣例。
- **失敗處理**：本模式不跑 coder，所以測試失敗不自行修 root cause。**STOP**，向使用者回報失敗細節（測試名稱、錯誤訊息、你判斷的可能原因），並詢問是否要授權 coder 修正；未取得指示前不要進入 Step 6。

## Step 6：api-writer（delegate to arceus:api-writer）

- 只在 Step 5 驗證通過後才進行。
- 檢查對應的 FastAPI endpoint 是否存在且已註冊到路由；缺少或與 Job 實作不符就依專案慣例補上／修正（參考同一 EE 底下已完成 Job 的 endpoint 寫法）。
- 完成後跑基本驗證（`python3 -m py_compile` 該 endpoint 檔案）。

## Step 7：front-check（delegate to arceus:front-check）

- 只在 Step 6 完成後才進行。
- 委派 `arceus:front-check`，檢查範圍限定為本次涉及的 endpoint 檔案（及其對應的 Job 實作），核對四項規範：
  1. 所有日期輸入輸出是否為 `YYYY-MM-DD` 格式
  2. `DSUSER` 是否還殘留任何長度限制（`max_length`/`min_length` 等）
  3. `/execute` 的 report 結構是否含 `company_code`、`company_name` 兩個欄位
  4. 權限檢查是否透過共用 `utils.common_utils.permissions_check()`（經 `dal.py` 的 `search_khpaut()`），而非自行重寫 KHPAUT 查詢邏輯
- **失敗處理**：問題出在 endpoint 層 → 交回 `arceus:api-writer` 修正後重跑 front-check，最多 3 輪。問題出在業務邏輯／report 產生邏輯本身（需要 coder）→ **STOP**，回報未通過項目並詢問使用者是否授權 coder 修正。

## Step 8：reviewer（delegate to arceus:reviewer）

- 審查該 Job 的全部相關檔案（`dal.py`、業務邏輯檔、`README.md`、測試檔、endpoint 檔），並把 Step 2 的差異清單一併交給 reviewer 作為背景。
- 若 verdict 是 `REQUEST_CHANGES` 或有 `[BLOCK]` 項目：
  - endpoint 層問題 → 交回 `arceus:api-writer` 修正 → 重跑 Step 6 / Step 7 → 再次 review
  - 業務邏輯層問題（需要 coder）或牽涉架構／業務判斷 → **STOP**，回報並等待使用者指示

## Step 9：總結報告

針對每個處理過的 Job，輸出：
- `CHANGELOG.md` 的處理結果（已刪除／原本就不存在）
- 修改／新增了哪些檔案（`README.md`、endpoint、測試等）
- **RPG ↔ 既有實作差異清單**：已實作／缺漏／與 RPG 不符，各項附上依據（RPG 行號、Python 檔案位置）
- 驗證結果（pass/fail，fail 的細節）
- Review 結果（verdict、blocking issues）
- 所有因為「需要 coder」而未處理、待使用者決定的項目

## Rules

- 階段依序執行，不可跳過或並行；每個階段完成後才進入下一階段。
- **絕對不委派 `arceus:coder`，也不自行改寫業務邏輯實作**。需要動業務邏輯的修正一律 STOP 問使用者。
- 破壞性/不可逆操作（`git push`、`rm -rf`、覆蓋原始碼庫 `/home/c114036/c114036/股代資料/`）一律禁止。`CHANGELOG.md` 的刪除限定 Step 0.5 所述範圍。
- 遇到失敗、缺漏、或任何需要人判斷的情況，停下來問使用者——不要為了「跑完」而自行假設繼續。
- 一次只深入處理一個 Job，跑完所有階段再換下一個。
- 全程使用繁體中文回報。
