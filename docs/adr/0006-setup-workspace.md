# ADR-0006: setup 主体走第三个 skill，工作区结构与幂等规则定死

- 日期：2026-08-14
- 状态：已定（issue #7）；沿用 ADR-0002 的 `plugin/` 布局与 ADR-0005 的凭证链路

## 决策

1. **setup 是独立 skill，不再拆命令。** 插件只交付 skills（Codex 侧 custom prompts 已弃用），所以「唯一显式命令」的落地形态就是 `plugin/skills/setup/`。工作区就是当前会话所在的文件夹：已有 `AGENTS.md` + `status/` 判定为重跑、不再发问；只剩其中一半（有 AGENTS.md 没 status/、有课程目录没 AGENTS.md）判定为上次跑到一半，同样按重跑走、各步只补缺的那半，否则「跑到一半再跑一次」会被第三条当成别人的项目而放弃；文件夹里装着别的项目（源码、别人的仓库）时停手改建新文件夹——课程工作区会被整体管理和整体保存，跟别的东西共用一个文件夹必然互相踩。
2. **连通检查不重写取 token 流程。** 两个只读调用（`canvas_list_courses`、`ed_get_user_info`）判定三种情况：工具不在 = server 没连，转 server-install；认证失败 = 该服务 token 缺失或过期，只跑 server-install 的刷新段；Gradescope 报错视为未配置、继续。ADR-0005 已定安装与凭证唯一真源是 server-install，这里只留指路。
3. **状态真相源固定四个文件，文件名英文、内容跟随用户语言。** `status/{assessments,todos,weekly,not-doing}.md`。`assessments.md` 的排序按 Ricky 现行那份表实测定：循环项（每周 quiz 这类）在最上面，其余按 due 从近到远、学期末在最下(`courses/Unit of Study/2026-S2-考核总表.md` 表头写「时间倒排」，行序是 8/16 → … → 11/16–28 考试周，所以他说的「倒排」= 最近的在最上面；这个词在未来日期上本身两可，实现前对着原件核过)。outline 给不出日期的行保留原词（"Formal exam period"），排在它在学期里对应的位置。行的粒度是 outline 的考核项而不是 Canvas 作业对象（一个 10% 的周测在 Canvas 里是十几个对象，照抄会让五门课变成六十行）；备注列同时承担溯源与作废账本（值变了保留旧值和变更日期，不删）。重跑是合并刷新、不是重新生成——重新生成会把作废账本连同人写的行一起抹掉。状态列在 setup 阶段留空：摸底读的是 deadline 不是提交状态，`canvas_get_grades` 与 `canvas_get_all_grades` 都只给课级总分（后者的 docstring 把前者说成「逐项明细」，与其自身 schema 不符，别信），唯一给逐项状态与分数的是 `canvas_get_submission_status`，「交没交、多少分」留给日后按课现问。另外三个是用户的：首次建好标题就不再动，重跑也不动。「不许另开状态文件」写进 AGENTS.md，靠后续会话守。
4. **AGENTS.md 与 CLAUDE.md 是英文逐字模板，放 skill 的 `references/`，重跑按模板刷新 AGENTS.md。** 两个文件是给宿主读的指令文件，所以不翻译（CLAUDE.md 仍是一行 `@AGENTS.md`，因为 Claude Code 不原生读 AGENTS.md）；模板里唯一的占位符是语言名，setup 填成用户的语言，之后工作区其他产物（课程地图、状态文件、表头）全用该语言写，课程地图与状态文件在同一个模板文件里只给「形状」不给逐字文本。这两个文件属于插件、不属于用户：重跑时按当前模板刷新 AGENTS.md（保留用户自己加的小节），否则插件日后加一条红线，所有老工作区永远拿不到，与「重跑即增量刷新」自相矛盾；已经导入 `@AGENTS.md` 的 CLAUDE.md 不动。另有一个例外方向相反：`<CODE>/outline.md` 是抓取的来源文档，保留学校原文不跟随用户语言（见第 7 条）。
5. **浏览器路线不往工作区抄。** 悉尼路线随插件走 `course-playbook/references/usyd-browser-routes.md`，工作区只在有插件覆盖不到的东西时（别的学校的对应站点、用户的 Outlook、某个学位专属门户）才建 `browser-routes.md`；只跟一门课有关的怪癖（这门课用 Zoom 不是 Echo360）写进那门课的课程地图。没东西可记就不建文件，与「不预建空壳」同一条纪律。
6. **git 静默化的四处护栏。** 嵌套仓库：`init` 前先 `git rev-parse --show-toplevel`，输出不等于工作区本身就说明这文件夹在别人的仓库里（`~/uni` 落在 dotfiles 仓库下是常见情形，Step 1 只看文件夹内容看不出来），当场说明并建议换位置，不静默造嵌套仓库。 身份：`user.name` 与 `user.email` 分别取值判空（`[ -n "$(git config …)" ]`），空则补仓库级 `uni-mcp` / `uni-mcp@localhost`——不能用退出码判断，`git config user.email` 对空字符串也返回 0，实测会提交出 `姓名 <>` 这种坏作者；只判 email 也不够，email 有值而 name 为空时 `commit` 会以 `empty ident name` 失败。空提交：`git diff --cached --quiet` 判空，让「什么都没变的重跑」成为无操作而不是报错退出（工作区里的 `AGENTS.md` 保存约定同样带这个判空，否则后续会话每次无改动保存都要跟用户解释一个不许提「git」的报错）。路径：`git -C` 的工作区路径一律加引号，`~/Uni Work` 这类带空格的文件夹否则全线失败。对用户不出现 git 词汇，只说「已经保存了，弄坏了我可以还原」。
7. **资料只取总纲，目录名归一到一个裸课号。** 每门课存 `<CODE>/outline.md`（解析后的 unit outline + syllabus 正文 + 来源 URL 与抓取日期），它是「抓取的原始来源文档」，保留学校原文不跟随用户语言——译文没法当来源引用，而且决定考核形式的措辞（"In-class + LockDown Browser"）恰恰是翻译最容易糊掉的。课程把 outline 作为 Canvas 文件发布时再 `canvas_download_file` 落进课程目录，其余日常按需下载。目录名取一个裸课号：`DATA2002/2902` 落 `DATA2002`（斜杠会把目录劈成两层）、`COMP2022 COMP2922` 落 `COMP2022`、`OLES2617 (S2C, 2026)` 落 `OLES2617`（学期进了路径，下学期同一门课会长出第二个目录，重跑也认不出）；完整课号与学期写进课程地图。不预建子目录。
8. **不新增 validate 检查。** 新 skill 已被现有检查覆盖：检查 2（strict 跑 skills 规范）、3（markdown lint）、4（相对链接与锚点）、5（Codex 侧 SKILL.md 存在性与 `disable-model-invocation`）。本票只需把 `codex-description-drift` fixture 的版本跟到 0.6.0——它拷了一份完整 manifest，版本落后会让版本漂移错误一起冒出来、稀释该 fixture 的隔离性（同一问题 ADR-0005 那轮已处置过一次）。

9. **课程筛选与跨平台匹配按真实数据定，留退路。** Canvas 的 active courses 混着学生门户、院系 dashboard、往年考试壳，按「字母紧跟数字」的课号形状过滤（悉尼 `COMP2022`、墨大 `COMP30022`、Monash `FIT1045` 都能过），一个都没剩就说明这学校课号写法不同，直接把原始列表给用户挑，不能静默交出空工作区。Ed 的 `session` 要 Ed 自己的写法（`Semester 2`，不是 Canvas 的 `S2C`），过滤不中会返回空，空结果按「写法不对」重试不带 `session` 的调用，不能当成「这门课没有 Ed」。分页默认值全部显式抬到 100：`canvas_list_courses`、`canvas_list_assignments`、`canvas_list_modules` 默认都是 20，周测型课程一门就能撑破。

## 后果

- 「重跑 = 增量刷新」的语义落在每一步里：Step 1 认工作区、Step 3 只问新课、Step 4 合并写课程地图不覆盖、Step 5 只刷考核表、Step 7 空提交跳过。没有单独的「增量模式」分支，重跑路径与首跑是同一段文字，不会两套逻辑各腐烂一半。
- 课程地图是活文件：setup 拥有其中的事实字段，人和后续会话追加的行必须保留。这条靠 SKILL.md 的措辞约束，没有机器校验——课程地图不在插件仓里，validate 够不着。
- 退课不删目录，学期结束整包挪 `archive/<年月-事件>/`，删除动作永远在用户手里。
- 三条静态 skill 之间的分工至此固定：server-install 管装和凭证，setup 管工作区与课程地图，course-playbook 管日常问答路由。加第四种知识层前先回看这条边界。
- 用真实课名收尾、不落 GUIDE 文件：上手例句只出现在对话里，改例句 = 改 SKILL.md 一处。
