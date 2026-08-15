# 陌生人走通验收（#9）

spec（#1）定的人工验收：干净环境的陌生人从 README 开始——装插件 → 配 token → 跑 setup → 常见问题答对——Claude Code 和 ChatGPT 桌面各走一遍，以 checklist 记录。本文件就是那份记录。

打勾规则：能由 agent 自动实测的项已打勾，每项注明验证日期和方式；分段的真实验证记录（各功能票落地时用真账号跑过的）作为佐证引用；**从零到尾一口气连走**这类必须真人做的项留空，由 Ricky 勾。全部勾完即满足 #9 的这条验收。

三条环境类验收已成立，一并记录：

- [x] repo 已 public（2026-08-13 转 public，见 #9 评论）
- [x] marketplace 实际可装（2026-08-15 实测，见下面两侧各自第 1 项）
- [x] CI（validate）在 main 上绿（2026-08-15 查 `gh run list`，最近一次 main 运行 success）

## Claude Code 侧

- [x] **照 README 快速上手装插件（干净环境、从 GitHub 拉取）** —— 2026-08-15 实测 README 写的 CLI 形式：临时 `CLAUDE_CONFIG_DIR` 下 `claude plugin marketplace add r1ckyIn/uni-mcp` 与 `claude plugin install uni-mcp@uni-mcp` 均成功，`claude plugin details uni-mcp` 列出全部 4 个技能（v0.6.0）。同一流程录成 README 演示图（`docs/assets/demo.tape`）。README 附注的会话内斜杠形式在 #2 落地时验证过。
- [x] **「check uni-mcp」确认安装** —— #2 落地时在真会话验证（2026-08-13 前后，marketplace → manifest → 技能加载链路通）；本次复核技能清单可见。
- [x] **配 token / 装 server** —— #6 用真账号完整走通（2026-08-14，PR #15）：克隆、取 Canvas / Ed token、写入钥匙串、注册宿主、只读连通验证。
- [x] **跑 setup** —— #7 用真账号完整跑过（2026-08-14，PR #16；随后 #19 按实际运行结果修了六条，含一条会说错死线的）。产物工作区留存于 `sandbox/uni-test`（仓库外，作对照）。
- [x] **常见问题答对** —— #5 知识层定稿前用真账号把调用链实际运行验证过（2026-08-13，PR #14；抓出一批静默错误假设并修正）。
- [ ] **陌生人连走**：找一个没接触过本仓库的人（或全新机器环境），只给 README，从装插件到问答一口气串完，途中不查任何本仓库之外的资料。上面各段分别验证过，这项验证的是衔接处不断。

## Codex CLI / ChatGPT 桌面侧

- [x] **照 README 快速上手装插件（干净环境、从 GitHub 拉取）** —— 2026-08-15 实测：隔离 `CODEX_HOME` 下 `codex plugin marketplace add r1ckyIn/uni-mcp` 与 `codex plugin add uni-mcp@uni-mcp` 均成功，4 个技能目录落位，`codex plugin list` 显示 installed, enabled（v0.6.0）。
- [ ] **ChatGPT 桌面 Codex 视图里确认插件可见、「check uni-mcp」通过** —— CLI 与桌面共享插件配置（#4 定案依据），但桌面 app 界面里的实际确认要真人开 app 做。
- [ ] **在 Codex / ChatGPT 桌面宿主里配 token / 装 server** —— #6 的真账号走通在 Claude 宿主完成；Codex 宿主的 server 注册与连通验证留真人跑。
- [ ] **在 ChatGPT 桌面跑 setup**。
- [ ] **在 ChatGPT 桌面问常见问题并答对**（可复用 Claude 侧同一组问题：这周 due 什么、找某周课件、搜 Ed、某考核占分与形式）。

## 备注

- Codex 侧 CLI 校验极弱（`codex plugin add` 对坏 manifest 也静默装上，见 `docs/validation.md` 检查 5 的说明），所以「CLI 装上」不能替代桌面端真人确认。
- 人工项全部勾完后，在 #9 里评论记录并关票。
