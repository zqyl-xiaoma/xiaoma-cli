# 🚀 XIAOMA-CLI 快速启动指南

## 项目已成功发布！✅

### 📦 NPM包信息
- 📦 **包名**: `@zeyue0329/xiaoma-cli`
- 🔖 **版本**: `1.0.0`
- 🌐 **仓库**: https://www.npmjs.com/package/@zeyue0329/xiaoma-cli
- ✅ 已发布到npm仓库，可全球下载使用

### 🎯 项目概述
XIAOMA-CLI是一个通用AI代理框架，支持敏捷AI驱动开发。提供专业的AI代理团队来处理项目的各个环节。

## 🔧 安装和使用

### ⚡ 快速开始（推荐）
```bash
# 直接使用，无需安装（推荐方式）
npx @zeyue0329/xiaoma-cli install

# 查看帮助
npx @zeyue0329/xiaoma-cli --help

# 查看版本
npx @zeyue0329/xiaoma-cli --version
```

### 🏗️ 全局安装方式
```bash
# 全局安装
npm install -g @zeyue0329/xiaoma-cli

# 安装后可直接使用命令
xiaoma-cli install
xiaoma-cli --help
xiaoma-cli --version
```

### 📚 CLI命令详情
```bash
# 项目安装 - 在任意项目目录中运行
npx @zeyue0329/xiaoma-cli install

# 查看可用代理列表
npx @zeyue0329/xiaoma-cli list:agents

# 验证配置文件
npx @zeyue0329/xiaoma-cli validate

# 构建所有bundles
npx @zeyue0329/xiaoma-cli build

# 代码库扁平化（用于AI分析）
npx @zeyue0329/xiaoma-cli flatten
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
# 进入你的项目目录
cd /path/to/your/project

# 运行安装命令
npx @zeyue0329/xiaoma-cli install

# 按提示选择：
# - Complete XiaoMa Core (完整安装)
# - Single Agent (单个代理)

# 选择IDE集成：
# - Cursor, Claude Code, Windsurf, VS Code等
```

### 方式2: 获取Web UI Bundles
```bash
# 首先在本地生成bundle文件
npx @zeyue0329/xiaoma-cli build

# bundle文件将生成在项目的dist目录中
# 然后可以上传到以下平台：
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
1. 在项目中安装：`npx @zeyue0329/xiaoma-cli install`
2. 选择IDE集成
3. 使用 `@代理名` 或 `/代理名` 调用代理
4. 按照SM → Dev循环进行开发

### Web UI规划流程
1. 运行：`npx @zeyue0329/xiaoma-cli build` 生成bundle文件
2. 使用 `dist/teams/team-fullstack.txt`
3. 上传到Gemini/ChatGPT
4. 创建PRD和架构文档
5. 切换到IDE进行开发

## 📚 文档资源

- **[用户指南](xiaoma-core/user-guide.md)** - 完整使用教程
- **[架构文档](docs/core-architecture.md)** - 技术架构说明
- **[贡献指南](CONTRIBUTING.md)** - 如何参与贡献
- **[CLAUDE.md](CLAUDE.md)** - Claude Code使用指南

## 🔗 相关链接

- **NPM包**: https://www.npmjs.com/package/@zeyue0329/xiaoma-cli
- **GitHub**: https://github.com/zqyl-xiaoma/xiaoma-cli
- **Issues**: https://github.com/zqyl-xiaoma/xiaoma-cli/issues
- **Discord**: https://discord.gg/gk8jAdXWmj

## 🎉 开始使用

项目已成功发布到npm！现在全球用户都可以通过简单的命令使用XIAOMA-CLI框架。

**建议第一次使用：**
1. 阅读[用户指南](xiaoma-core/user-guide.md)了解工作流程
2. 在测试项目中运行 `npx @zeyue0329/xiaoma-cli install` 
3. 选择您的IDE进行集成
4. 开始您的第一个AI辅助开发项目！

**🚀 一键开始：**
```bash
# 创建新项目目录
mkdir my-ai-project && cd my-ai-project

# 安装XIAOMA-CLI框架
npx @zeyue0329/xiaoma-cli install

# 开始您的AI驱动开发之旅！
```

---

**🎊 祝您使用愉快！XIAOMA-CLI团队为您的开发之旅保驾护航！**