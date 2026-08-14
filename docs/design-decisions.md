# uni-mcp 设计定案

- 日期：2026-08-11
- 状态：Ricky 已确认，作为实现依据
- 来源：grilling 全程审讯（八轮决策）+ 九个调查 agent 的事实核实

## 一句话

uni-mcp 是给大学生的开箱即用课程 AI 助手插件：Claude Code 和 ChatGPT 桌面（Codex 视图）双端可装，装好跑一次 setup，AI 就带着工具、知识、工作区和记忆接管课程事务。解决的问题：canvas-ed-mcp 这类 MCP server 装完是 49 个裸工具，AI 第一次拿到没有任何「哪门课该怎么查、资料在哪」的经验。

## 产品定位

- 名字 uni-mcp，独立仓库（即本仓库 github.com/r1ckyIn/uni-mcp）。
- 受众：任何用 Canvas / Ed / Gradescope 的大学的学生，含完全不懂命令行的小白。小白只和 AI 聊天、不翻本地文档，一切引导都要能在对话里完成。
- 伞形两期：本期只集成 canvas-ed-mcp；下期集成 unsw-mcp（已开发完，TypeScript，40 工具，Ed 侧 19 个工具名与 canvas-ed 几乎一一同名，知识层届时可直接复用）。
- 宿主：Claude Code + ChatGPT 桌面 app 的 Codex 视图为主打（Ricky 判断大部分用户用客户端）；Codex CLI 顺带兼容；其他 MCP 客户端只在 README 提一句「server 可独立接」。

## 打包形态（关键机制均已核实）

- 同仓双 manifest：`.claude-plugin/`（Claude Code marketplace）+ `.codex-plugin/plugin.json`（Codex/ChatGPT 官方插件机制，2026-03 上线，可打包 skills + MCP servers，ChatGPT 与 Codex 共用插件目录）。〔2026-08-12 更新（issue #10 / ADR-0002）：插件内容已解耦进 `plugin/` 子目录，双 manifest 均放 `plugin/` 内（`plugin/.claude-plugin/` 已迁，Codex 侧届时放 `plugin/.codex-plugin/`），marketplace.json 留仓库根。〕
- SKILL.md 知识层一套两端共用：两家都基于 agentskills.io 开放标准。
- Codex 侧注意：custom prompts 已官方弃用，一切走 skills；skills 用户目录是 `~/.agents/skills`（`~/.codex/skills` 源码已标 deprecated，二手资料多写反）；自建 marketplace = 仓库根 `.agents/plugins/marketplace.json` + `codex plugin marketplace add owner/repo`，装完需新开 session。
- Claude 侧注意：Claude Code 只读 CLAUDE.md、不原生读 AGENTS.md，脚手架必须生成 CLAUDE.md 一行 `@AGENTS.md` 导入；插件 `.mcp.json` 支持 `${CLAUDE_PLUGIN_ROOT}` 与用户环境变量 `${VAR}` 展开。
- ChatGPT Work 核实结论：Work 是真产品（2026-07 发布的 agent 模式），但 Codex 未被并入、未改名，桌面 app 内仍是独立 Codex 视图在本地文件夹干活。桌面端安装第三方 marketplace 插件的确切步骤实现时实测。

## server 侧

- canvas-ed-mcp 唯一改动：把写死的悉尼 Canvas 网址（`CANVAS_BASE_URL` 及域名校验）改成环境变量可配，默认悉尼；unit outline 抓取保持 USYD 专属，由知识层标注「仅悉尼可用」。
- 不打包（不加 pyproject）、不把 server 塞进插件仓。
- 安装走提示词驱动：小红书发布提示词（Ricky 撰写），让用户的 AI 按 setup skill 的约定把 canvas-ed-mcp clone 到约定位置、装依赖、注册 MCP 配置、只读验证可用性。〔2026-08-14 更新（issue #6 / ADR-0005）：已落地为独立 `server-install` skill、不并入 setup（#7）；约定位置 `~/.uni-mcp/canvas-ed-mcp`，提示词定稿在 docs/xiaohongshu.md，流程唯一真源是该 skill。〕
- 凭证流程：用户照小红书配图流程取 token（Canvas：Account → Settings → 拉到底 Approved Integrations → New Access Token，有效期上限 90 天，只显示一次；Ed：搜「ed api」进 edstem.org 的 settings/api-tokens 页，先选学校区域再登录，创建令牌只显示一次），token 直接贴聊天里，agent 写入 macOS 钥匙串（Windows 退环境变量），启动时从钥匙串读取，明文不落盘、后续调用不回显。风险兜底：Canvas token 90 天自动过期、随时可删除重生成、指引保留「谁拿着谁就能查你的课表，别发给任何人」警告。〔2026-08-14 更新（issue #6 / ADR-0005）：凭证链路已落地——钥匙串写入、MCP 启动命令经 `security` 命令替换现读、Windows 退 `setx`，均见 `server-install` skill 与 ADR-0005。〕

## 知识层（三层）

1. 工具路由 playbook（静态随插件，英文）：哪类问题用哪个工具、什么顺序查最省，例如问 due 用 `canvas_get_upcoming`、找课件先 `list_modules` 别直接 `list_files`、搜 Ed 先 `search` 别翻页。
2. 踩坑启发（静态随插件，英文）：closing time ≠ due time；考核表必看 Type 列（描述写 Online quiz 可能实为 In-class + LockDown Browser）；信息优先级按问题类型分链——权重与 due 以官方 unit outline 为权威、实际截止看 Canvas 作业对象（两者不一致取早的）、执行细则看 Ed staff FAQ、时效通知看官方邮件。不设单一优先级链（Ricky 自己工作区两处链写法本就是不同维度）。〔2026-08-13 更新（issue #5 / ADR-0004）：第 1、2 层已合并落地为单一 `course-playbook` skill，坑点贴在对应路由旁；USYD 路线放 skill 的 `references/` 子目录按需加载。〕
3. 课程地图（setup 生成的活文件，跟随用户语言）：每门课的作业/讲义/讨论各在哪个平台、浏览器源路线、日常发现随手增补。

- USYD 路线作为第一个内置参考实例（来自历史实据挖掘）：Timetable 正确入口 `timetable.sydney.edu.au/even/student`（裸域名是错误页）、Sydney Student（选退课/census/正式成绩）、Echo360 录播（Canvas 左侧 Recorded Lectures，可下 TXT 字幕）、Zoom tab、github.sydney.edu.au（学校企业版，非公网 github.com）、Library 数字化节选、Handbook。
- 浏览器源形态：知识层路线条目（站名 → URL → 里面有什么 → 怎么查 → 坑），不写站点专用代码，加新站 = 加一段文档。CC 走 claude-in-chrome；OpenAI 侧走桌面版官方 Chrome 扩展（已核实：CLI 够不着该扩展，桌面 app 可用且能用已登录会话）。

## 验证纪律

- 字面全验：一切信息至少两源交叉，并注明来源与不一致。
- 天然单源的信息尽力找旁证（邮箱/公告/outline），找不到就明说「仅单源、无法交叉」，零容错项额外提醒用户自行确认。
- 默认只读红线：任何写操作（交作业、发帖、删帖、删 workspace）必须用户当次明确点头，AI 不得自作主张。写进 AGENTS.md 模板和知识层，两宿主同守。

## 工作区

- 形态：用户建（或选）一个文件夹跑 setup，该文件夹成为课程助手主场，之后在这里开 CC / ChatGPT 桌面。〔2026-08-14 增补（issue #7，Ricky 定）：**setup 只服务新工作区，不做迁移。** 已经手工建过课程工作区的用户（Ricky 自己的 `courses/` 就是一例：状态文件在 `Unit of Study/` 而不是 `status/`，AGENTS.md 是手写的）不要在原地跑 setup——Step 1 会把它判成「上次跑到一半」，在旁边新建 `status/` 形成第二个状态源，重跑规则还会按模板刷掉手写的 AGENTS.md。这类用户要么另起一个空文件夹从零跑，要么继续手工维护；本期不提供迁移路径，也不为此开票。〕
- 结构（Ricky 现行实践的精简泛化版）：
  - `AGENTS.md`：红线 + 约定 + 主动性条款（用户可能不熟 CLI，回答时主动给可复制的下一步）；
  - `CLAUDE.md`：一行导入；
  - 状态真相源目录：考核总表（按时间倒排，备注列带溯源与作废账本）、todos、weekly 周计划，外加「明确不做的事」负向决策清单；硬规定「不许另开状态文件」；
  - 每课一个目录（课程代码命名，学期不进路径），内置该课的课程地图文件，资料子结构随用随长，不预建 {lectures,assignments,labs,notes,exams} 五件套空壳；
  - 学期结束整包挪 `archive/<年月-事件>/`。〔2026-08-14 更新（issue #7 / ADR-0006）：结构已落地——状态目录固定 `status/{assessments,todos,weekly,not-doing}.md`（文件名英文、内容随用户语言，考核表备注列兼做溯源与作废账本）；AGENTS.md 是英文逐字模板，放 setup skill 的 `references/workspace-templates.md`；浏览器路线不往工作区抄，只在插件未覆盖时才建 `browser-routes.md`；git 静默化补了身份护栏与空提交跳过两处护栏。〕
- 资料策略：setup 只下载每课 outline / syllabus 总纲，其余日常按需下载并归档进对应目录。
- 进度：考核状态（due / 交没交 / 成绩，自动来自 MCP 可随时刷新）+ 学习进度（复习到 week 几，日常聊到就记）。
- git：setup 静默 init，agent 负责提交；对用户只说「改坏了随时可以回滚」这类人话，不暴露 git 术语（小白看不到终端输出）。
- 记忆分工：工作区文件是课程事实唯一真源（两宿主共享）；宿主自带记忆（CC auto-memory / ChatGPT memory）只放交互偏好，不放课程事实。

## setup skill

- 全插件唯一的显式命令；幂等可重跑，换学期 / 加课 = 重跑走增量刷新。
- 流程：连通检查（缺哪个服务的凭证就给对应的小红书式取 token 指引）→ list_courses 列出发现的课让用户勾选要管的（最少确认，避免摸旧课）→ 逐课摸底写课程地图 → 把 Outlook、课表、选课系统等无 API 站点记成浏览器路线条目 → 铺目录 → 尾声用用户真实课名输出上手指南（例句：查 due、找课件、搜 Ed），不落 GUIDE 文件。〔2026-08-14 更新（issue #6 / ADR-0005）：取 token 指引与凭证存取已实现于 `server-install` skill，setup 的连通检查届时直接复用、不另写一份。〕〔2026-08-14 更新（issue #7 / ADR-0006）：已落地为 `setup` skill，八步流程与逐步的幂等规则见该 SKILL.md；连通检查确按上条复用 server-install，本 skill 不含任何取 token 步骤。〕

## 门面与语言

- README.md 英文主文件 + 第一屏语言切换行 + README.zh-CN.md（顶部注明以英文版为准）；快速上手双语。
- SKILL.md / AGENTS.md 模板 / manifest / 代码 / CLI 输出全英文（skill description 英文召回更好，用户照样用中文提问）；工作区生成物跟随用户语言。
- README 面子工程对标热门双语仓（lobe-chat / ant-design 一类）：badges、截图、结构美观。

## 完成标准

- 陌生人走通：干净环境从 README 开始——装插件 → 配 token → 跑 setup → 常见问题答对；两个宿主各走一遍；repo public、marketplace 可装。
- CI 自动化测试：插件结构校验、知识文档 lint。

## 挂账（不进本期）

- unsw-mcp 接入（下期 milestone）。
- canvas-ed-mcp 的 outline 解析器丢 Type 列（知识层先教用 WebFetch 抓原页兜底），及 README 底部 license 表述与 MIT badge 不一致。
- ChatGPT 桌面端安装第三方 marketplace 插件的确切步骤实测。〔2026-08-13 更新（issue #4 / ADR-0003）：CLI 装好后桌面端可见 + `codex://` deeplink 直达插件页已实测走通，此项了结；收窄为「桌面端不经 CLI 的纯 app 内浏览/安装入口是否存在」继续挂账。〕
- Codex 官方插件目录（github.com/openai/plugins）的第三方投稿流程未核实。

## 关键事实来源

- Codex 插件/skills/AGENTS.md/MCP：learn.chatgpt.com/docs/{plugins,build-skills,agent-configuration/agents-md,extend/mcp}、developers.openai.com/plugins/build/plugins、github.com/openai/plugins
- skills 路径源码：github.com/openai/codex → codex-rs/ext/skills/src/host_roots.rs
- ChatGPT Work 与 Codex 关系：help.openai.com/en/articles/20001275
- Claude Code 记忆与插件 MCP：code.claude.com/docs/en/memory、code.claude.com/docs/en/mcp
- OpenAI 侧浏览器：learn.chatgpt.com/docs/{browser,chrome-extension}、openai/codex issues #22164 #26820
- 双语仓库实践：lobe-chat、ant-design、dify、daymade/claude-code-skills 实地核对
