# ADR-0006: setup 主体走第三个 skill，工作区结构与幂等规则定死

- 日期：2026-08-14
- 状态：已定（issue #7）；沿用 ADR-0002 的 `plugin/` 布局与 ADR-0005 的凭证链路

## 决策

1. **setup 是独立 skill，不再拆命令。** 插件只交付 skills（Codex 侧 custom prompts 已弃用），所以「唯一显式命令」的落地形态就是 `plugin/skills/setup/`。工作区就是当前会话所在的文件夹：已有 `AGENTS.md` + `status/` 判定为重跑、不再发问；文件夹里装着别的项目（源码、别人的仓库）时停手改建新文件夹——课程工作区会被整体管理和整体保存，跟别的东西共用一个文件夹必然互相踩。
2. **连通检查不重写取 token 流程。** 两个只读调用（`canvas_list_courses`、`ed_get_user_info`）判定三种情况：工具不在 = server 没连，转 server-install；认证失败 = 该服务 token 缺失或过期，只跑 server-install 的刷新段；Gradescope 报错视为未配置、继续。ADR-0005 已定安装与凭证唯一真源是 server-install，这里只留指路。
3. **状态真相源固定四个文件，文件名英文、内容跟随用户语言。** `status/{assessments,todos,weekly,not-doing}.md`。`assessments.md` 按 due 时间倒排、由 setup 每次重跑刷新；备注列同时承担溯源（这条来自 unit outline，某日抓取）与作废账本（值变了保留旧值和变更日期，不删）。另外三个是用户的：首次建好标题就不再动，重跑也不动。「不许另开状态文件」写进 AGENTS.md，靠后续会话守。
4. **AGENTS.md 是英文逐字模板，放 skill 的 `references/`。** 它是给两个宿主读的指令文件，不翻译；模板里唯一占位符是语言名，setup 填成用户的语言，之后工作区其他产物（课程地图、状态文件、表头）全用该语言写。课程地图与状态文件在同一个模板文件里只给「形状」，不给逐字文本——它们要按用户语言写。CLAUDE.md 仍是一行 `@AGENTS.md`（Claude Code 不原生读 AGENTS.md）。
5. **浏览器路线不往工作区抄。** 悉尼路线随插件走 `course-playbook/references/usyd-browser-routes.md`，工作区只在有插件覆盖不到的东西时（别的学校的对应站点、用户的 Outlook、某个学位专属门户）才建 `browser-routes.md`；只跟一门课有关的怪癖（这门课用 Zoom 不是 Echo360）写进那门课的课程地图。没东西可记就不建文件，与「不预建空壳」同一条纪律。
6. **git 静默化的两处护栏。** `git config user.email` 读空时补一个仓库级身份（`uni-mcp` / `uni-mcp@localhost`）——没配过 git 的机器上 `commit` 会直接失败，小白看到的是一堆看不懂的 git 报错；提交前用 `git diff --cached --quiet` 判空，让「什么都没变的重跑」成为无操作而不是报错退出。对用户不出现 git 词汇，只说「已经保存了，弄坏了我可以还原」。
7. **资料只取总纲。** 每门课存 `<CODE>/outline.md`（解析后的 unit outline + syllabus 正文 + 来源 URL 与抓取日期）；课程把 outline 作为 Canvas 文件发布时再 `canvas_download_file` 落进课程目录。其余讲义、题面、读物日常按需下载。课程目录只按课程代码命名，学期不进路径，不预建子目录。
8. **不新增 validate 检查。** 新 skill 已被现有检查覆盖：检查 2（strict 跑 skills 规范）、3（markdown lint）、4（相对链接与锚点）、5（Codex 侧 SKILL.md 存在性与 `disable-model-invocation`）。本票只需把 `codex-description-drift` fixture 的版本跟到 0.6.0——它拷了一份完整 manifest，版本落后会让版本漂移错误一起冒出来、稀释该 fixture 的隔离性（同一问题 ADR-0005 那轮已处置过一次）。

## 后果

- 「重跑 = 增量刷新」的语义落在每一步里：Step 1 认工作区、Step 3 只问新课、Step 4 合并写课程地图不覆盖、Step 5 只刷考核表、Step 7 空提交跳过。没有单独的「增量模式」分支，重跑路径与首跑是同一段文字，不会两套逻辑各腐烂一半。
- 课程地图是活文件：setup 拥有其中的事实字段，人和后续会话追加的行必须保留。这条靠 SKILL.md 的措辞约束，没有机器校验——课程地图不在插件仓里，validate 够不着。
- 退课不删目录，学期结束整包挪 `archive/<年月-事件>/`，删除动作永远在用户手里。
- 三条静态 skill 之间的分工至此固定：server-install 管装和凭证，setup 管工作区与课程地图，course-playbook 管日常问答路由。加第四种知识层前先回看这条边界。
- 用真实课名收尾、不落 GUIDE 文件：上手例句只出现在对话里，改例句 = 改 SKILL.md 一处。
