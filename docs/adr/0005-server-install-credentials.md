# ADR-0005: server 安装走独立 server-install skill，凭证只存钥匙串

- 日期：2026-08-14
- 状态：已定（issue #6）；沿用 ADR-0002 的 `plugin/` 布局

## 决策

1. **独立 skill，不并入 setup（#7）。** 安装与凭证有自己的触发场景（90 天过期刷新、换机重装、「插件在但工具不在」），setup 的连通检查发现缺凭证时也复用同一流程；独立成文还让安装流程能被 raw 链接单独抓取（见第 5 条）。
2. **约定位置 `~/.uni-mcp/canvas-ed-mcp` + 克隆内专用 venv。** 家目录隐藏目录，宿主无关、与课程工作区解耦；venv 绕开 Homebrew/系统 Python 拒绝全局 pip 安装的问题（PEP 668），并守住「canvas-ed-mcp 不加打包配置」的既定边界——`pip install -r requirements.txt` 原样可用。
3. **凭证唯一持久副本在 macOS 钥匙串，注入走启动命令替换。** MCP 注册命令是 `/bin/sh -c` 包装：启动时 `security find-generic-password` 现读钥匙串，配置文件里零明文。用 `/bin/sh` 而非 zsh，因为 zsh 连非交互 `-c` 也会 source 用户的 `~/.zshenv`，里面任何一句 stdout 输出都会插进 MCP 的 stdio 流、破坏 JSON-RPC 握手；包装命令本身是纯 POSIX。包装再做三件事：必需凭证读空即报错退出（宿主当场显示连接失败，好过 49 个工具静默报「未配置」）；`cd "$HOME"` 后再 exec（下载类工具按 cwd 落盘，落点可预期且可写）；钥匙串条目一律不带 `-a` 账户字段（GUI 启动的宿主环境里 `USER` 未设，带账户查询会全部落空——实测 `env -i` 下 `$USER` 为空；登录钥匙串本就按用户隔离，账户字段冗余）。`security add-generic-password -U` 原地更新即 90 天刷新路径，刷新不碰注册。包装命令预读 Gradescope 两项凭证（缺失得空串，server 视为未配置），之后补配 Gradescope 无需重注册。Windows 退 `setx` 用户级环境变量，skill 里明说保护级别低于钥匙串。
4. **插件不随附 .mcp.json，注册在安装时由 AI 执行。** server 路径与凭证都是用户机器上的事实，无法随插件预置；插件带死配置会让没装 server 的用户每次开 session 看到报错。`claude mcp add --scope user` 与 `codex mcp add` 各注册一次（注册前先 remove 同名旧条目，保证重跑后恰好一份），ChatGPT 桌面与 Codex CLI 共享 `~/.codex/config.toml`，天然一次覆盖。
5. **小红书提示词是薄引导，流程唯一真源是 SKILL.md。** 提示词只做三件事：按 README 装插件、抓 raw SKILL.md 照做、约束语气与凭证纪律；安装流程本体不写进提示词，改流程只改 skill 一处。文案定稿在 [docs/xiaohongshu.md](../xiaohongshu.md)。
6. **验证两段式。** 存 token 前后都用 curl 冒烟（token 经钥匙串命令替换进请求头、不进命令文本），已存条目在收集阶段先冒烟、过期的当场换新；注册后新 session 用 `canvas_list_courses` / `ed_get_user_info` 只读端到端验证。Canvas 网址仍写死悉尼，可配性归 #8。

## 后果

- token 的落盘面收敛到钥匙串一处（用户把 token 贴进聊天产生的会话转录不在本插件控制范围，设计定案接受该形态）；skill、配置文件、命令输出全程无明文回显。
- 已知并接受的残余暴露：存储命令把 token 作为 `security` 的参数传入，命令执行的一瞬对本机进程表（`ps`）可见。这与聊天转录同源——只要走「贴聊天里、agent 代存」的流程就绕不开（`-w` 不带值的交互式输入在无 tty 的 agent 环境不可用），单用户 Mac 上风险窗口毫秒级，兜底仍是「随时撤销重生成 + Canvas 90 天自动过期」。
- 非悉尼 Canvas 用户要等 #8；server-install 开头已留指路链接。
- 提示词发布后，raw 链接锚定 `main` 分支的 skill 路径；skill 改名或挪位会把已发布帖子的链接打断，挪位必须同步 docs/xiaohongshu.md。
- 取 token 的分步操作在 SKILL.md Step 4（给执行 AI）与 docs/xiaohongshu.md 二、三节（给发帖配图）各有一份呈现，这是发布素材的固有形态：改任一处的步骤必须同步另一处。
