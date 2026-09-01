---
name: rpg-convert
description: RPG→Python 全流程轉換 — rpg-analyzer → planner → coder → researcher → tester → api-writer → front-check → reviewer 依序執行，遇到失敗或不確定情況會停下來詢問使用者
triggers: ["rpg-convert", "RPG轉換", "RPG全流程轉換"]
agents: [rpg-analyzer, planner, coder, researcher, tester, api-writer, front-check, reviewer]
verification: [build, test]
---

# RPG Convert Workflow

你正在執行 **RPG Convert 全流程轉換模式**。針對使用者指定的 Job（例如 `EE18/Job15`），依序委派 8 個 agent 完成「分析 → 規劃 → 實作 → 文件 → 測試 → API → 前端規範檢查 → 審查」，每個階段都要看到明確結果才進入下一階段。

**與已移除的 `rpg-pipeline` 不同**：這個流程**不是**無人值守模式。遇到失敗、缺漏、或任何需要人判斷的情況，一律停下來問使用者，不自行猜測繼續。

## 輸入

使用者提供一個或多個 Job 路徑（例如 `EE18/Job15`）。若同時提供入口程式檔名，直接採用；若沒有，Step 1 前先自行研究確認入口程式（找該 Job 目前 `Data/` 下既有檔案、查同一個共用選單 CLP／README 慣例、grep 股代資料庫找出真正呼叫它的入口）。

可一次接收多個 Job；逐個依序完整跑完八階段再換下一個 Job（不要並行跑多個 Job，避免同時大量寫入互相干擾）。

## Step 0：Preflight — 確認分支狀態

- `git status`、`git log -5 --oneline`、`git diff`（若有未提交變更）
- 若工作區有看起來不是這次任務產生的異動，STOP 並詢問使用者後再繼續

## Step 1：rpg-analyzer

- 委派 `arceus:rpg-analyzer`，目標目錄為該 Job 資料夾，明確告知已知的呼叫鏈背景（減少 agent 重新摸索的時間）。
- 收到報告後檢查「找不到的參照」清單：
  - 純粹是系統 API（如 QCAEXEC）、印表機定義檔（無原始碼）、或已被 comment out 的死碼 → 可略過繼續
  - 看起來像真正遺漏的程式來源 → **STOP**，向使用者確認是否要手動補齊來源後再繼續，不要自行假設略過

## Step 2：planner（delegate to arceus:planner）

- 提供 Step 1 收集到的 RPG/CLP/DSPF 原始碼路徑，請 planner 解讀 F-spec/E-spec/I-spec(DS)/C-spec，產出：
  - 這個 Job 實際存在哪些操作（查詢、新增、修改、刪除、列印、批次處理等）
  - 依「一個檔案對應一個實際存在的 API 功能」拆出的檔案清單與各檔案要實作的 function
  - 風險與不確定點（例如欄位定義查不到、DBCS 欄位切分需要換算）
- 若 planner 的風險清單中出現「需要人判斷」的項目（例如業務邏輯有歧義、找不到欄位定義且無法從既有慣例合理推斷），**STOP** 並詢問使用者，不要讓 coder 自行猜測繼續。

## Step 3：coder（delegate to arceus:coder）

- 依照 Step 2 的計畫與專案既有慣例（參考同一 EE 底下已完成的 Job）實作 `dal.py` 與業務邏輯檔案、`__init__.py`。
- 對於跨 Job 共用的工具程式，優先參考其他 Job 中已存在的 Python 實作方式。
- coder 報告中列為「假設」的項目，一併記錄，留待 Step 8 review 時再確認一次。

## Step 4：researcher（delegate to arceus:researcher）

- 依 Step 3 產出的程式碼撰寫 `README.md`（函式清單、輸入欄位、錯誤代碼、回傳結構、DAL 對照表）。
- 若讀不到足夠資訊寫出完整章節，略去該節即可，不要杜撰內容。

## Step 5：tester（delegate to arceus:tester）

- 執行單元測試與整合測試（`python -m unittest tests.<Job>.unittest -v`、`python -m tests.<Job>.test`）。
- **失敗處理**：測試失敗 → 交回 `arceus:coder` 修正根因 → 重新測試，最多 3 輪。
  - 3 輪後仍失敗：**STOP**，向使用者回報失敗細節與已嘗試的修正，等待指示，不要繼續 Step 6。
- 不要用 `python3 -c "..."` 之類的臨時腳本去戳 DB 連線或查表是否存在——驗證一律走專案既有的測試執行慣例。

## Step 6：api-writer（delegate to arceus:api-writer）

- 只在 Step 5 驗證通過後才進行。
- 依專案慣例撰寫對應的 FastAPI endpoint 檔案並註冊到路由（參考同一 EE 底下已完成 Job 的 endpoint 寫法）。
- 完成後跑基本驗證（`python3 -m py_compile` 該 endpoint 檔案）。

## Step 7：front-check（delegate to arceus:front-check）

- 只在 Step 6 的 endpoint 檔案完成後才進行。
- 委派 `arceus:front-check`，檢查範圍限定為本次新增/修改的 endpoint 檔案（及其對應的 Job 實作），核對四項規範：
  1. 所有日期輸入輸出是否為 `YYYY-MM-DD` 格式
  2. `DSUSER` 是否還殘留任何長度限制（`max_length`/`min_length` 等）
  3. `/execute` 的 report 結構是否含 `company_code`、`company_name` 兩個欄位
  4. 權限檢查是否透過共用 `utils.common_utils.permissions_check()`（經 `dal.py` 的 `search_khpaut()`），而非自行重寫 KHPAUT 查詢邏輯
- **失敗處理**：有任一項 FAIL → 交回 `arceus:api-writer`（若問題出在 report 產生邏輯本身，交回 `arceus:coder`）修正 → 重新跑 front-check，最多 3 輪。
  - 3 輪後仍有 FAIL：**STOP**，向使用者回報未通過的項目與已嘗試的修正，等待指示，不要繼續 Step 8。

## Step 8：reviewer（delegate to arceus:reviewer）

- 審查本次新增/修改的全部檔案（`dal.py`、業務邏輯檔、`README.md`、測試檔、endpoint 檔）。
- 若 verdict 是 `REQUEST_CHANGES` 或有 `[BLOCK]` 項目：交回對應 agent（coder 或 api-writer）修正 → 重新驗證（回到 Step 5 / Step 6 / Step 7）→ 再次 review。
- 若修正後仍有無法解決的 BLOCK 項目，或問題牽涉架構/業務邏輯判斷：**STOP**，向使用者回報並等待指示。

## Step 9：總結報告

針對每個處理過的 Job，輸出：
- 建立/修改了哪些檔案
- 各階段做了哪些關鍵判斷與假設
- 驗證結果（pass/fail，若曾經 fail 過要註明修正過程）
- Review 結果（verdict、已修正的 blocking issues）
- 任何因為 STOP 而中斷、待使用者確認的項目

## Rules

- 八個階段依序執行，不可跳過或並行；每個階段完成後才進入下一階段。
- 破壞性/不可逆操作（`git push`、`rm -rf`、覆蓋原始碼庫 `/home/c114036/c114036/股代資料/`）一律禁止。
- 遇到失敗、缺漏、或任何需要人判斷的情況，停下來問使用者——不要為了「跑完」而自行假設繼續。
- 一次只深入處理一個 Job，跑完八階段再換下一個。
- 全程使用繁體中文回報。
