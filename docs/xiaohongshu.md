# 小红书发布素材:提示词 + 取 token 图文文案

发布用定稿(issue #6)。三块内容:用户复制的提示词、配图分步文案、必须保留的警告。发布前唯一要核对的事:仓库已合入 `plugin/skills/server-install/SKILL.md`,提示词里的 raw 链接能打开。

## 一、提示词正文(用户整段复制,贴给自己的 AI)

```text
我想装一个大学课程 AI 助手(uni-mcp),我不懂命令行,请你全程替我操作:

1. 先按 https://github.com/r1ckyIn/uni-mcp 的 README 把 uni-mcp 插件装进你这边;你自己跑不了的命令,就把要输入的内容一条一条发给我照抄。
2. 然后打开 https://raw.githubusercontent.com/r1ckyIn/uni-mcp/main/plugin/skills/server-install/SKILL.md,严格按里面的步骤把课程服务器装好、引导我配置凭证、验证能用。
3. 每一步用大白话告诉我你在干什么;需要我动手的事(比如去网页取 token)一次只说一件。
4. 我贴的 token 只能存进系统钥匙串(Windows 用环境变量),不许写进任何文件,存好后也不要再显示它。
```

适用对象:Claude Code 或 ChatGPT 桌面版(Codex 视图)的用户,Mac 为主,Windows 也能走(AI 会自动改用环境变量方案)。

## 二、Canvas 取 token 配图文案(六图)

1. 打开 Canvas 网页版,点左侧栏你的头像(Account)。
2. 点 Settings(设置)。
3. 页面一直拉到最底,找到 Approved Integrations 区块。
4. 点 + New Access Token。
5. Purpose 随便填(比如 uni-mcp),过期时间不用改(学校最长只给 90 天),点 Generate Token。
6. 复制弹窗里的一长串 token——它只显示这一次,关掉就再也看不到了。复制完直接贴给你的 AI。

## 三、Ed 取 token 配图文案(五图)

1. 搜「ed api」,进 edstem.org 的 API Tokens 设置页。
2. 页面先让你选区域:选你学校 Ed 所在的区域(选错会登录不上)。
3. 登录你的 Ed 账号。
4. 在 API Tokens 页面新建一个 token。
5. 复制 token——同样只显示这一次。复制完直接贴给你的 AI。

## 四、警告文案(帖子里原样保留,不许删改)

> ⚠️ 谁拿着 token,谁就能查你的课表、以你的身份操作。除了你自己的 AI,别把它发给任何人。Canvas token 最长 90 天自动过期;万一泄露或弄丢,去原页面删掉旧的、重新生成一个就行。

## 五、发帖备注(可选,放正文末尾或评论区)

- 90 天后 Canvas token 过期,对 AI 说「我的 Canvas token 过期了」,它会带你走一遍刷新,不用重装。
- token 全程只存系统钥匙串(Windows 存环境变量),不写进文件,AI 后续也不会再显示它。
- 目前 Canvas 侧默认悉尼大学;其他学校的网址支持在做,进度见仓库 issue #8。
