# 🚀 XIAOMA-WEB 快速启动指南

## 项目已成功启动！✅

### 📦 当前状态
- ✅ 项目依赖已安装
- ✅ 构建系统正常运行
- ✅ 所有配置文件验证通过
- ✅ CLI工具正常工作
- ✅ dist文件已生成

### 🎯 项目概述
XIAOMA-WEB是一个通用AI代理框架，支持敏捷AI驱动开发。提供专业的AI代理团队来处理项目的各个环节。

## 🔧 可用命令

### 🚨 重要说明
目前XIAOMA-WEB还没有发布到npm仓库，所以需要使用本地安装方式。

### 方法1: 使用本地路径（推荐）
```bash
# 在任何目录中直接使用完整路径
npx /Users/liueryang/Documents/gitlab/xiaoma-web install

# 查看帮助
npx /Users/liueryang/Documents/gitlab/xiaoma-web install --help
```

### 方法2: 全局链接方式
```bash
# 1. 首先在xiaoma-web项目目录中创建全局链接（仅需一次）
cd /Users/liueryang/Documents/gitlab/xiaoma-web
npm link

# 2. 然后在任何目录中使用
xiaoma-web --version
xiaoma-web --help
xiaoma-web install

# 构建所有bundles
npm run build

# 验证配置
npm run validate

# 列出可用代理
npm run list:agents

# 代码扁平化
npm run flatten
```

### 开发命令
```bash
# 只构建代理bundles
npm run build:agents

# 只构建团队bundles  
npm run build:teams

# 安装到项目（使用本地版本）
npm run install:xiaoma

# 格式化markdown
npm run format
```

## 📁 项目结构

```
XIAOMA-WEB/
├── xiaoma-core/           # 核心框架
│   ├── agents/           # AI代理定义
│   ├── agent-teams/      # 代理团队配置
│   ├── templates/        # 文档模板
│   ├── tasks/           # 任务定义
│   ├── workflows/       # 工作流程
│   └── data/            # 知识库
├── dist/                # 构建输出
│   ├── agents/          # 单个代理bundles
│   ├── teams/           # 团队bundles
│   └── expansion-packs/ # 扩展包bundles
├── expansion-packs/     # 扩展包源码
├── tools/              # 构建和工具脚本
└── docs/               # 项目文档
```

## 🎪 使用方式

### 方式1: 在新项目中安装使用
```bash
# 在你的项目目录中


# 选择安装选项：
# - Complete XiaoMa Core (完整安装)
# - Single Agent (单个代理)

# 选择IDE集成：
# - Cursor, Claude Code, Windsurf, VS Code等
```

### 方式2: 使用Web UI Bundles
```bash
# 获取团队bundle文件
cp dist/teams/team-fullstack.txt /path/to/upload/

# 上传到以下平台之一：
# - Gemini (推荐用于规划阶段)
# - ChatGPT
# - Claude Web UI
```

## 🤖 可用代理

### 核心代理
- **analyst** - 业务分析师，市场研究和需求分析
- **pm** - 产品经理，PRD创建和产品规划
- **architect** - 系统架构师，技术架构设计
- **dev** - 开发工程师，代码实现
- **qa** - 质量保证，代码审查和测试
- **sm** - Scrum Master，故事管理和流程协调
- **po** - Product Owner，需求验证和文档分解
- **ux-expert** - UX专家，用户体验设计
- **xiaoma-master** - 万能代理，可执行任何任务
- **xiaoma-orchestrator** - 编排代理，多代理协调

### 团队配置
- **team-fullstack** - 全栈开发团队
- **team-all** - 包含所有代理
- **team-ide-minimal** - IDE最小化配置
- **team-no-ui** - 无UI后端团队

## ⚡ 快速开始

### IDE开发流程
1. 在项目中安装：`npx xiaoma-web install`
2. 选择IDE集成
3. 使用 `@代理名` 或 `/代理名` 调用代理
4. 按照SM → Dev循环进行开发

### Web UI规划流程
1. 使用 `dist/teams/team-fullstack.txt`
2. 上传到Gemini/ChatGPT
3. 创建PRD和架构文档
4. 切换到IDE进行开发

## 📚 文档资源

- **[用户指南](xiaoma-core/user-guide.md)** - 完整使用教程
- **[架构文档](docs/core-architecture.md)** - 技术架构说明
- **[贡献指南](CONTRIBUTING.md)** - 如何参与贡献
- **[CLAUDE.md](CLAUDE.md)** - Claude Code使用指南

## 🔗 相关链接

- **GitHub**: https://github.com/xiaoma-web/xiaoma-web
- **Issues**: https://github.com/xiaoma-web/xiaoma-web/issues
- **Discord**: https://discord.gg/gk8jAdXWmj

## 🎉 开始使用

项目已完全准备就绪！选择您喜欢的方式开始使用XIAOMA-WEB框架。

**建议第一次使用：**
1. 阅读[用户指南](xiaoma-core/user-guide.md)了解工作流程
2. 在测试项目中运行 `npx xiaoma-web install` 
3. 选择您的IDE进行集成
4. 开始您的第一个AI辅助开发项目！

---

**🎊 祝您使用愉快！XIAOMA-WEB团队为您的开发之旅保驾护航！**npx xiaoma-web install