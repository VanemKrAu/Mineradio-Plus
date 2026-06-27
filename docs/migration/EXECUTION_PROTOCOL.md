# Migration Execution Protocol

更新时间：2026-06-27

本文定义 Tauri 二开迁移进入长流程开发时的执行规则。它补足 `IMPLEMENTATION_PLAN_TAURI_REWRITE.md` 的执行约束，避免后续 agent 直接在主分支或模糊计划上开工。

## 启动条件

开始任何代码实现前必须满足：

- 已读 `AGENTS.md`。
- 已读 `docs/migration/PRD_TAURI_REWRITE.md`。
- 已读 `docs/migration/DESIGN_TAURI_REWRITE.md`。
- 已读 `docs/migration/IMPLEMENTATION_PLAN_TAURI_REWRITE.md`。
- 已读对应子计划，例如 `docs/migration/plans/01-baseline-freeze.md`。
- 已确认当前工作不依赖旧 `AI_HANDOFF.md` / `PROJECT_MEMORY.md` / `HANDOFF_NEXT_CHAT.md`。
- 已创建隔离 worktree，不在主工作区直接做长流程实现。

## Worktree 规则

执行实现计划前必须使用 `using-git-worktrees`：

1. 优先使用项目内 `.worktrees/`。
2. 若 `.worktrees/` 不存在，使用全局 worktree 目录，或先把 `.worktrees/` 加入 `.gitignore`。
3. 创建分支名使用 `codex/tauri-rewrite-<phase>`。
4. 在 worktree 中运行 baseline 检查。
5. 只有 baseline 检查结果明确后才能派发实现任务。

本仓库当前存在大量文档清洗和迁移规划改动。创建 worktree 前应先决定是否提交这些文档改动，避免 worktree 基于未提交状态导致后续难以追踪。

## 执行模式

优先使用 `subagent-driven-development`：

- 每个任务一个新 subagent。
- Controller 必须把任务全文、相关文档路径、验收命令和禁止事项放进 prompt。
- Subagent 不得自行设计新架构。
- Subagent 不得跳过测试。
- 每个任务完成后先做 spec compliance review，再做 code quality review。
- 任一 reviewer 提出问题时必须修复并复审。

仅当 subagent 不可用时使用 `executing-plans` 内联执行。

## 计划层级

计划分三层：

1. PRD：`docs/migration/PRD_TAURI_REWRITE.md`
2. 总实现计划：`docs/migration/IMPLEMENTATION_PLAN_TAURI_REWRITE.md`
3. 子系统计划：`docs/migration/plans/*.md`

代码实现只能从子系统计划开始。总实现计划不能直接作为代码任务执行，因为它是 sequencing plan，不包含每个文件的最终代码。

## 子计划完成标准

每个 `docs/migration/plans/*.md` 必须包含：

- 目标。
- 明确文件清单。
- 输入文档。
- 不允许做的事。
- 步骤 checklist。
- 具体命令。
- 期望结果。
- 回滚方式。
- subagent prompt 摘要。

涉及代码的子计划还必须包含：

- 测试优先步骤。
- 最小实现步骤。
- 自审步骤。
- 验证命令。

## 阶段顺序

严格按以下顺序推进：

1. Baseline freeze。
2. Workspace and Tauri shell。
3. Shared contracts。
4. Sidecar gateway and provider adapters。
5. Tauri runtime layer。
6. React shell and Zustand stores。
7. Playback/search/lyrics/queue。
8. Visual engine parity。
9. Desktop lyrics/windows/wallpaper。
10. Tauri updater/release/license gates。

不能跳过 baseline freeze 和 shared contracts。

## Gate 规则

- Capability parity checklist 是发布硬门槛。
- License gate 是公开发布硬门槛。
- Deferred capabilities 里的 `deferred` 项发布前必须决策。
- Visual parity gate 必须有 Electron baseline 截图/录屏对照。
- Tauri updater gate 不允许复用旧 Electron patch JSON。

## 分支与提交

建议提交颗粒：

- 文档/计划提交。
- baseline freeze 提交。
- workspace skeleton 提交。
- shared contracts 提交。
- sidecar gateway 提交。
- each provider adapter 提交。
- each UI/visual subsystem 提交。
- release/updater/license gate 提交。

提交前必须运行对应子计划的验证命令。

## 停止条件

遇到以下情况立即停止并回报：

- 官方脚手架命令与计划不一致。
- Tauri/Bun/React 版本导致命令不可用。
- WebView2 行为与 Electron baseline 明显不一致。
- QQ 开源项目 license 不兼容或无法确认。
- Visual parity 无法通过截图/录屏解释差异。
- `git diff --check` 或关键测试失败两次以上。

## 当前结论

截至 2026-06-27，文档已足够支撑总方向和阶段拆分，但还不够支撑整段迁移代码一次性执行。必须继续按子系统补齐 `docs/migration/plans/*.md`，然后逐阶段进入 worktree 和 subagent 执行。
