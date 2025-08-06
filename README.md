# XiaoMa-Web: Universal AI Agent Framework

[![Version](https://img.shields.io/npm/v/xiaoma-web?color=blue&label=version)](https://www.npmjs.com/package/xiaoma-web)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-7289da?logo=discord&logoColor=white)](https://discord.gg/gk8jAdXWmj)

Foundations in Agentic Agile Driven Development, known as the XiaoMa Method of Agile AI-Driven Development, yet so much more. Transform any domain with specialized AI expertise: software development, entertainment, creative writing, business strategy to personal wellness just to name a few.

**[Subscribe to XiaoMaCode on YouTube](https://www.youtube.com/@XiaoMaCode?sub_confirmation=1)**

**[Join our Discord Community](https://discord.gg/gk8jAdXWmj)** - A growing community for AI enthusiasts! Get help, share ideas, explore AI agents & frameworks, collaborate on tech projects, enjoy hobbies, and help each other succeed. Whether you're stuck on XiaoMa, building your own agents, or just want to chat about the latest in AI - we're here for you! **Some mobile and VPN may have issue joining the discord, this is a discord issue - if the invite does not work, try from your own internet or another network, or non-VPN.**

⭐ **If you find this project helpful or useful, please give it a star in the upper right hand corner!** It helps others discover XiaoMa-Method and you will be notified of updates!

## Overview

**XiaoMa Method's Two Key Innovations:**

**1. Agentic Planning:** Dedicated agents (Analyst, PM, Architect) collaborate with you to create detailed, consistent PRDs and Architecture documents. Through advanced prompt engineering and human-in-the-loop refinement, these planning agents produce comprehensive specifications that go far beyond generic AI task generation.

**2. Context-Engineered Development:** The Scrum Master agent then transforms these detailed plans into hyper-detailed development stories that contain everything the Dev agent needs - full context, implementation details, and architectural guidance embedded directly in story files.

This two-phase approach eliminates both **planning inconsistency** and **context loss** - the biggest problems in AI-assisted development. Your Dev agent opens a story file with complete understanding of what to build, how to build it, and why.

**📖 [See the complete workflow in the User Guide](xiaoma-core/user-guide.md)** - Planning phase, development cycle, and all agent roles

## Quick Navigation

### Understanding the XiaoMa Workflow

**Before diving in, review these critical workflow diagrams that explain how XiaoMa works:**

1. **[Planning Workflow (Web UI)](xiaoma-core/user-guide.md#the-planning-workflow-web-ui)** - How to create PRD and Architecture documents
2. **[Core Development Cycle (IDE)](xiaoma-core/user-guide.md#the-core-development-cycle-ide)** - How SM, Dev, and QA agents collaborate through story files

> ⚠️ **These diagrams explain 90% of XiaoMa Method Agentic Agile flow confusion** - Understanding the PRD+Architecture creation and the SM/Dev/QA workflow and how agents pass notes through story files is essential - and also explains why this is NOT taskmaster or just a simple task runner!

### What would you like to do?

- **[Install and Build software with Full Stack Agile AI Team](#quick-start)** → Quick Start Instruction
- **[Learn how to use XiaoMa](xiaoma-core/user-guide.md)** → Complete user guide and walkthrough
- **[See available AI agents](/xiaoma-core/agents))** → Specialized roles for your team
- **[Explore non-technical uses](#-beyond-software-development---expansion-packs)** → Creative writing, business, wellness, education
- **[Create my own AI agents](#creating-your-own-expansion-pack)** → Build agents for your domain
- **[Browse ready-made expansion packs](expansion-packs/)** → Game dev, DevOps, infrastructure and get inspired with ideas and examples
- **[Understand the architecture](docs/core-architecture.md)** → Technical deep dive
- **[Join the community](https://discord.gg/gk8jAdXWmj)** → Get help and share ideas

## Important: Keep Your XiaoMa Installation Updated

**Stay up-to-date effortlessly!** If you already have XiaoMa-Method installed in your project, simply run:

```bash
npx xiaoma-web install
# OR
git pull
npm run install:bmad
```

This will:

- ✅ Automatically detect your existing v4 installation
- ✅ Update only the files that have changed and add new files
- ✅ Create `.bak` backup files for any custom modifications you've made
- ✅ Preserve your project-specific configurations

This makes it easy to benefit from the latest improvements, bug fixes, and new agents without losing your customizations!

## Quick Start

### One Command for Everything (IDE Installation)

**Just run one of these commands:**

```bash
npx xiaoma-web install
# OR if you already have XiaoMa installed:
git pull
npm run install:bmad
```

This single command handles:

- **New installations** - Sets up XiaoMa in your project
- **Upgrades** - Updates existing installations automatically
- **Expansion packs** - Installs any expansion packs you've added to package.json

> **That's it!** Whether you're installing for the first time, upgrading, or adding expansion packs - these commands do everything.

**Prerequisites**: [Node.js](https://nodejs.org) v20+ required

### Fastest Start: Web UI Full Stack Team at your disposal (2 minutes)

1. **Get the bundle**: Save or clone the [full stack team file](dist/teams/team-fullstack.txt) or choose another team
2. **Create AI agent**: Create a new Gemini Gem or CustomGPT
3. **Upload & configure**: Upload the file and set instructions: "Your critical operating instructions are attached, do not break character as directed"
4. **Start Ideating and Planning**: Start chatting! Type `*help` to see available commands or pick an agent like `*analyst` to start right in on creating a brief.
5. **CRITICAL**: Talk to XiaoMa Orchestrator in the web at ANY TIME (#bmad-orchestrator command) and ask it questions about how this all works!
6. **When to move to the IDE**: Once you have your PRD, Architecture, optional UX and Briefs - its time to switch over to the IDE to shard your docs, and start implementing the actual code! See the [User guide](xiaoma-core/user-guide.md) for more details

### Alternative: Clone and Build

```bash
git clone https://github.com/xiaoma-web/xiaoma-web.git
npm run install:bmad # build and install all to a destination folder
```

## 🌟 Beyond Software Development - Expansion Packs

XiaoMa's natural language framework works in ANY domain. Expansion packs provide specialized AI agents for creative writing, business strategy, health & wellness, education, and more. Also expansion packs can expand the core XiaoMa-Method with specific functionality that is not generic for all cases. [See the Expansion Packs Guide](docs/expansion-packs.md) and learn to create your own!

## Codebase Flattener Tool

The XiaoMa-Method includes a powerful codebase flattener tool designed to prepare your project files for AI model consumption. This tool aggregates your entire codebase into a single XML file, making it easy to share your project context with AI assistants for analysis, debugging, or development assistance.

### Features

- **AI-Optimized Output**: Generates clean XML format specifically designed for AI model consumption
- **Smart Filtering**: Automatically respects `.gitignore` patterns to exclude unnecessary files
- **Binary File Detection**: Intelligently identifies and excludes binary files, focusing on source code
- **Progress Tracking**: Real-time progress indicators and comprehensive completion statistics
- **Flexible Output**: Customizable output file location and naming

### Usage

```bash
# Basic usage - creates flattened-codebase.xml in current directory
npx xiaoma-web flatten

# Specify custom input directory
npx xiaoma-web flatten --input /path/to/source/directory
npx xiaoma-web flatten -i /path/to/source/directory

# Specify custom output file
npx xiaoma-web flatten --output my-project.xml
npx xiaoma-web flatten -o /path/to/output/codebase.xml

# Combine input and output options
npx xiaoma-web flatten --input /path/to/source --output /path/to/output/codebase.xml
```

### Example Output

The tool will display progress and provide a comprehensive summary:

```
📊 Completion Summary:
✅ Successfully processed 156 files into flattened-codebase.xml
📁 Output file: /path/to/your/project/flattened-codebase.xml
📏 Total source size: 2.3 MB
📄 Generated XML size: 2.1 MB
📝 Total lines of code: 15,847
🔢 Estimated tokens: 542,891
📊 File breakdown: 142 text, 14 binary, 0 errors
```

The generated XML file contains all your project's source code in a structured format that AI models can easily parse and understand, making it perfect for code reviews, architecture discussions, or getting AI assistance with your XiaoMa-Method projects.

## Documentation & Resources

### Essential Guides

- 📖 **[User Guide](xiaoma-core/user-guide.md)** - Complete walkthrough from project inception to completion
- 🏗️ **[Core Architecture](docs/core-architecture.md)** - Technical deep dive and system design
- 🚀 **[Expansion Packs Guide](docs/expansion-packs.md)** - Extend XiaoMa to any domain beyond software development

## Support

- 💬 [Discord Community](https://discord.gg/gk8jAdXWmj)
- 🐛 [Issue Tracker](https://github.com/xiaoma-web/xiaoma-web/issues)
- 💬 [Discussions](https://github.com/xiaoma-web/xiaoma-web/discussions)

## Contributing

**We're excited about contributions and welcome your ideas, improvements, and expansion packs!** 🎉

📋 **[Read CONTRIBUTING.md](CONTRIBUTING.md)** - Complete guide to contributing, including guidelines, process, and requirements

## License

MIT License - see [LICENSE](LICENSE) for details.

[![Contributors](https://contrib.rocks/image?repo=xiaoma-web/xiaoma-web)](https://github.com/xiaoma-web/xiaoma-web/graphs/contributors)

<sub>Built with ❤️ for the AI-assisted development community</sub>
