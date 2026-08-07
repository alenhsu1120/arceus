---
name: rpg-pipeline
description: RPG→Python 全自動轉換管線 — rpg-analyzer → coder → tester → api-writer 依序執行，全程無人值守、不中斷詢問
triggers: ["rpg-pipeline", "overnight-convert", "無人值守", "整夜跑", "全自動轉換", "跑完睡覺"]
agents: [rpg-analyzer, coder, tester, api-writer]
verification: [build, test]
---

# RPG Pipeline（無人值守全自動轉換）

你正在執行 **RPG Pipeline 模式**。使用者已明確授權全程自動化、不中斷詢問（例如使用者已經睡了或即將離線）。目標：針對指定的 Job（例如 `EE18/Job15`），依序完成 rpg-analyzer → coder → tester → api-writer 四個階段，中途不暫停等待任何人的輸入。

## 輸入

使用者會提供一個或多個 Job 路徑（例如 `EE18/Job15`），格式為 `<EE_CODE>/Job<NN>`。若使用者同時提供了入口程式檔名（entry filename），直接採用；若沒有提供，Step 1 由 rpg-analyzer 之前先自行研究確認入口程式（比照 `EE18/Job15` 案例的做法：找該 job 目前 `Data/` 下既有的檔案、查同一個共用選單 CLP／README 慣例、grep 股代資料庫找出真正呼叫它的入口）。

可一次接收多個 Job；逐個依序完整跑完四階段再換下一個 Job（不要並行跑多個 Job，避免同時大量寫入互相干擾、也避免 permission 白名單 race）。

## Step 0：Preflight — 消除中斷來源（每個 Job 開始前都要做一次）

這是「不中斷詢問」承諾能不能達成的關鍵步驟，**不可省略**：

1. 讀取專案的 `.claude/settings.json`（路徑：`<repo_root>/.claude/settings.json`，不是 `settings.local.json`）。
2. 確認/補上這個 Job 會用到的 Edit/Write allow 規則（若已存在則不重複加）：
   - `Edit(//<repo_root>/tdcc_data_importer/Database_mariadb_connector/<EE_CODE>/Job<NN>/**)`
   - `Write(//<repo_root>/tdcc_data_importer/Database_mariadb_connector/<EE_CODE>/Job<NN>/**)`
   - `Edit(//<repo_root>/tdcc_data_importer/tests/<EE_CODE>/Job<NN>/**)`
   - `Write(//<repo_root>/tdcc_data_importer/tests/<EE_CODE>/Job<NN>/**)`
   - `Edit(//<repo_root>/api/api_v1/endpoints/<EE_PREFIX>/**)`
   - `Write(//<repo_root>/api/api_v1/endpoints/<EE_PREFIX>/**)`
3. 只新增、不刪除既有規則；`permissions.allow` 之外的欄位不要動；不要動 `permissions.deny`/`permissions.ask`。
4. 這一步只處理**檔案寫入類**的中斷來源。Bash 指令類的中斷來源交給既有的 `fewer-permission-prompts` 技能邏輯判斷（唯讀類指令通常已被 Claude Code 內建自動放行；`python3 -c`/`mysql -h ... -e` 等具任意程式碼/任意 SQL 執行風險的指令，即使頻繁出現也不要加白名單——這類指令的彈窗是刻意保留的安全機制，不要試圖繞過）。

## Step 1：rpg-analyzer

- 若入口程式未知，先自行研究確認（見「輸入」一節），不要用互動方式問使用者。
- 委派 `arceus:rpg-analyzer`，目標目錄為該 Job 資料夾，明確告知已知的呼叫鏈背景（減少 agent 重新摸索的時間）。
- 收到報告後檢查「找不到的參照」清單：純粹是系統 API（如 QCAEXEC）、印表機定義檔（無原始碼）、或已被 comment out 的死碼，可直接略過繼續；如果是看起來像真正遺漏的程式來源，記錄下來，繼續往下走，最後在總結報告中提出，不要因此卡住整條管線。

## Step 2：coder（delegate to arceus:coder）

- 依照專案既有慣例（參考同一 EE 底下已完成的 Job，例如 dal.py / process.py / print_*.py / __init__.py / README.md 的寫法）將 Step 1 收集到的 RPG/CLP 邏輯轉換為 Python。
- 對於跨 Job 共用的工具程式（如 TRKC01.CLP、RTVCURLIB.CLP、FTCA25I.CLP 等），優先參考其他 Job 中已存在的 Python 實作方式，不要重新設計。
- 若遇到欄位定義、資料表結構不確定，優先查閱專案既有的 dal.py / DB 連線設定自行確認；查不到就採用與其他 Job 一致的合理慣例直接完成，並在報告中列為「假設」。

## Step 3：tester（delegate to arceus:tester）

- 執行驗證（例如 `python3 -m py_compile ...`、既有的 `tests/<EE_CODE>/Job<NN>/` 測試、必要時的 DB 連線驗證）。
- **失敗自動修復迴圈，最多 3 輪**：測試失敗 → 交回 arceus:coder 修正根因 → 重新測試。3 輪後仍失敗，不要卡住等待確認——記錄失敗細節與已嘗試的修正，直接進入 Step 4（若 api-writer 明顯依賴未修好的邏輯則跳過該 Job 的 Step 4，在最終總結中標註「未完成，待人工確認」），繼續處理下一個 Job（如果有多個）。

## Step 4：api-writer（delegate to arceus:api-writer）

- 依專案慣例撰寫對應的 FastAPI endpoint 檔案並註冊到路由（參考同一 EE 底下已完成 Job 的 endpoint 寫法）。
- 完成後跑一次基本驗證（例如 `python3 -m py_compile` 該 endpoint 檔案、必要時啟動 import 檢查），不需要真的啟動 server 手動測試。

## Step 5：總結報告

針對每個處理過的 Job，輸出：
- 建立/修改了哪些檔案（含 Data/ 新複製的原始碼）
- 轉換過程中做了哪些關鍵判斷與假設
- 驗證結果（pass/fail，若 3 輪修復後仍 fail，明確標註）
- 找不到來源、或標記為「待人工確認」的項目清單

## 零中斷規則（Zero-Interruption Rules）

- **絕對不要**使用任何會跳出問題等待使用者回答的工具或方式（例如互動式提問）。所有模糊情況都要自己依專案既有慣例判斷後直接繼續執行。
- 每個階段的 subagent 也必須被告知同樣的規則：全程自主判斷、不中斷詢問。
- 破壞性/不可逆操作（例如 `git push`、`rm -rf`、覆蓋原始碼庫 `/home/c114036/c114036/股代資料/`）仍然一律禁止——「不中斷」不等於「不設防」，只是指不要為了確認而暫停，不是放寬安全邊界。
- 遇到真正無法自行判斷、且錯誤決定會造成不可逆後果的情況（極少數），可以在該 Job 的總結報告中標註「待人工確認」並跳過，但仍要繼續處理其他 Job／完成報告，不要整條管線卡死等待。

## Rules

- 一次只深入處理一個 Job，跑完四階段再換下一個。
- 每個階段完成後才進入下一階段（有依賴關係，不可跳過或並行）。
- 全程使用繁體中文回報。
