# ADR-0004: 静态知识层落成单一 course-playbook skill

- 日期：2026-08-13
- 状态：已定（issue #5）；沿用 ADR-0002 的 `plugin/` 布局

## 决策

1. **知识层第 1、2 层合并为一个 skill。** 设计定案把工具路由 playbook 和踩坑启发记为两块知识，落地时合入 `plugin/skills/course-playbook/` 一个 skill：两块服务同一触发族（问 due、找课件、搜 Ed、查考核、查成绩），拆成两个 skill 要付两份常驻 description 的上下文成本，且坑点贴在对应路由旁边（closing≠due 贴 deadline 节、Type 列贴考核节）比单列一处更可靠。
2. **USYD 浏览器路线放 `references/` 子目录。** skill 首次引入 bundled reference（`references/usyd-browser-routes.md`），按需加载：只有无 API 站点的问题才需要它，常驻在 SKILL.md 里是浪费。ADR-0001/0002 记录的「skill = 目录 + SKILL.md」布局由此扩展为可带 references 子目录；agentskills.io 标准与两宿主均支持目录内附文件。SKILL.md 里明确要求从 skill 自身目录解析该相对路径（会话 cwd 是用户工作区，直接 Read 相对路径会落空——同一坑 install-check 已用两行防过）。
3. **第 3 层（课程地图）不在本 skill。** 属 setup（#7）生成的工作区活文件，静态层只负责随插件分发的英文知识。
4. **换大学的扩展形态：** 路线文件按大学命名（`usyd-browser-routes.md`），unsw-mcp 期新大学 = 新增 `<uni>-browser-routes.md` 同形文件并在 SKILL.md 分派处按宿主大学选择；不是往 USYD 文件里塞第二所学校的段落。
5. **manifest description 四槽同步进 validate。** 本票把发布描述手抄进四处（Claude manifest、Codex manifest、Codex interface.longDescription、Claude marketplace 条目），`check-codex-manifests.mjs` 的 `checkClaudeSync` 相应加了 description 同步检查 + `codex-description-drift` fixture，防四槽静默漂移。

## 后果

- 加新浏览器站点 = 往路线文件加一段（设计定案的维护目标不变）。
- skill 的 frontmatter description 常驻加载（约 580 字符），换取六类问题的模型自主触发；用户级并无显式命令，属预期成本。
- 发布描述改动现在必须四处同改，validate 红灯兜底。
