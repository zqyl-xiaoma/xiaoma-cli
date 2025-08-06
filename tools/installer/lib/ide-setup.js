const path = require("path");
const fs = require("fs-extra");
const yaml = require("js-yaml");
const chalk = require("chalk");
const inquirer = require("inquirer");
const fileManager = require("./file-manager");
const configLoader = require("./config-loader");
const { extractYamlFromAgent } = require("../../lib/yaml-utils");
const BaseIdeSetup = require("./ide-base-setup");
const resourceLocator = require("./resource-locator");

class IdeSetup extends BaseIdeSetup {
  constructor() {
    super();
    this.ideAgentConfig = null;
  }

  async loadIdeAgentConfig() {
    if (this.ideAgentConfig) return this.ideAgentConfig;
    
    try {
      const configPath = path.join(__dirname, '..', 'config', 'ide-agent-config.yaml');
      const configContent = await fs.readFile(configPath, 'utf8');
      this.ideAgentConfig = yaml.load(configContent);
      return this.ideAgentConfig;
    } catch (error) {
      console.warn('Failed to load IDE agent configuration, using defaults');
      return {
        'roo-permissions': {},
        'cline-order': {}
      };
    }
  }

  async setup(ide, installDir, selectedAgent = null, spinner = null, preConfiguredSettings = null) {
    const ideConfig = await configLoader.getIdeConfiguration(ide);

    if (!ideConfig) {
      console.log(chalk.yellow(`\nNo configuration available for ${ide}`));
      return false;
    }

    switch (ide) {
      case "cursor":
        return this.setupCursor(installDir, selectedAgent);
      case "claude-code":
        return this.setupClaudeCode(installDir, selectedAgent);
      case "windsurf":
        return this.setupWindsurf(installDir, selectedAgent);
      case "trae":
        return this.setupTrae(installDir, selectedAgent);
      case "roo":
        return this.setupRoo(installDir, selectedAgent);
      case "cline":
        return this.setupCline(installDir, selectedAgent);
      case "kilo":
        return this.setupKilocode(installDir, selectedAgent);
      case "gemini":
        return this.setupGeminiCli(installDir, selectedAgent);
      case "github-copilot":
        return this.setupGitHubCopilot(installDir, selectedAgent, spinner, preConfiguredSettings);
      case "qwen-code":
        return this.setupQwenCode(installDir, selectedAgent);
      default:
        console.log(chalk.yellow(`\nIDE ${ide} not yet supported`));
        return false;
    }
  }

  async setupCursor(installDir, selectedAgent) {
    const cursorRulesDir = path.join(installDir, ".cursor", "rules");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    await fileManager.ensureDirectory(cursorRulesDir);

    for (const agentId of agents) {
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const mdcContent = await this.createAgentRuleContent(agentId, agentPath, installDir, 'mdc');
        const mdcPath = path.join(cursorRulesDir, `${agentId}.mdc`);
        await fileManager.writeFile(mdcPath, mdcContent);
        console.log(chalk.green(`✓ Created rule: ${agentId}.mdc`));
      }
    }

    console.log(chalk.green(`\n✓ Created Cursor rules in ${cursorRulesDir}`));
    return true;
  }

  async setupClaudeCode(installDir, selectedAgent) {
    // Clean up old BMad commands directory if it exists
    const oldBmadCommandsDir = path.join(installDir, ".claude", "commands", "BMad");
    if (await fileManager.pathExists(oldBmadCommandsDir)) {
      await fileManager.removeDirectory(oldBmadCommandsDir);
      console.log(chalk.dim("  Removed old BMad commands directory"));
    }

    // Setup xiaoma-core commands
    const coreSlashPrefix = await this.getCoreSlashPrefix(installDir);
    const coreAgents = selectedAgent ? [selectedAgent] : await this.getCoreAgentIds(installDir);
    const coreTasks = await this.getCoreTaskIds(installDir);
    await this.setupClaudeCodeForPackage(installDir, "core", coreSlashPrefix, coreAgents, coreTasks, ".xiaoma-core");

    // Setup expansion pack commands
    const expansionPacks = await this.getInstalledExpansionPacks(installDir);
    for (const packInfo of expansionPacks) {
      const packSlashPrefix = await this.getExpansionPackSlashPrefix(packInfo.path);
      const packAgents = await this.getExpansionPackAgents(packInfo.path);
      const packTasks = await this.getExpansionPackTasks(packInfo.path);
      
      if (packAgents.length > 0 || packTasks.length > 0) {
        // Use the actual directory name where the expansion pack is installed
        const rootPath = path.relative(installDir, packInfo.path);
        await this.setupClaudeCodeForPackage(installDir, packInfo.name, packSlashPrefix, packAgents, packTasks, rootPath);
      }
    }

    return true;
  }

  async setupClaudeCodeForPackage(installDir, packageName, slashPrefix, agentIds, taskIds, rootPath) {
    const commandsBaseDir = path.join(installDir, ".claude", "commands", slashPrefix);
    const agentsDir = path.join(commandsBaseDir, "agents");
    const tasksDir = path.join(commandsBaseDir, "tasks");

    // Ensure directories exist
    await fileManager.ensureDirectory(agentsDir);
    await fileManager.ensureDirectory(tasksDir);

    // Setup agents
    for (const agentId of agentIds) {
      // Find the agent file - for expansion packs, prefer the expansion pack version
      let agentPath;
      if (packageName !== "core") {
        // For expansion packs, first try to find the agent in the expansion pack directory
        const expansionPackPath = path.join(installDir, rootPath, "agents", `${agentId}.md`);
        if (await fileManager.pathExists(expansionPackPath)) {
          agentPath = expansionPackPath;
        } else {
          // Fall back to core if not found in expansion pack
          agentPath = await this.findAgentPath(agentId, installDir);
        }
      } else {
        // For core, use the normal search
        agentPath = await this.findAgentPath(agentId, installDir);
      }
      
      const commandPath = path.join(agentsDir, `${agentId}.md`);

      if (agentPath) {
        // Create command file with agent content
        let agentContent = await fileManager.readFile(agentPath);
        
        // Replace {root} placeholder with the appropriate root path for this context
        agentContent = agentContent.replace(/{root}/g, rootPath);

        // Add command header
        let commandContent = `# /${agentId} Command\n\n`;
        commandContent += `When this command is used, adopt the following agent persona:\n\n`;
        commandContent += agentContent;

        await fileManager.writeFile(commandPath, commandContent);
        console.log(chalk.green(`✓ Created agent command: /${agentId}`));
      }
    }

    // Setup tasks
    for (const taskId of taskIds) {
      // Find the task file - for expansion packs, prefer the expansion pack version
      let taskPath;
      if (packageName !== "core") {
        // For expansion packs, first try to find the task in the expansion pack directory
        const expansionPackPath = path.join(installDir, rootPath, "tasks", `${taskId}.md`);
        if (await fileManager.pathExists(expansionPackPath)) {
          taskPath = expansionPackPath;
        } else {
          // Fall back to core if not found in expansion pack
          taskPath = await this.findTaskPath(taskId, installDir);
        }
      } else {
        // For core, use the normal search
        taskPath = await this.findTaskPath(taskId, installDir);
      }
      
      const commandPath = path.join(tasksDir, `${taskId}.md`);

      if (taskPath) {
        // Create command file with task content
        let taskContent = await fileManager.readFile(taskPath);
        
        // Replace {root} placeholder with the appropriate root path for this context
        taskContent = taskContent.replace(/{root}/g, rootPath);

        // Add command header
        let commandContent = `# /${taskId} Task\n\n`;
        commandContent += `When this command is used, execute the following task:\n\n`;
        commandContent += taskContent;

        await fileManager.writeFile(commandPath, commandContent);
        console.log(chalk.green(`✓ Created task command: /${taskId}`));
      }
    }

    console.log(chalk.green(`\n✓ Created Claude Code commands for ${packageName} in ${commandsBaseDir}`));
    console.log(chalk.dim(`  - Agents in: ${agentsDir}`));
    console.log(chalk.dim(`  - Tasks in: ${tasksDir}`));
  }

  async setupWindsurf(installDir, selectedAgent) {
    const windsurfRulesDir = path.join(installDir, ".windsurf", "rules");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    await fileManager.ensureDirectory(windsurfRulesDir);

    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        const mdPath = path.join(windsurfRulesDir, `${agentId}.md`);

        // Create MD content (similar to Cursor but without frontmatter)
        let mdContent = `# ${agentId.toUpperCase()} Agent Rule\n\n`;
        mdContent += `This rule is triggered when the user types \`@${agentId}\` and activates the ${await this.getAgentTitle(
          agentId,
          installDir
        )} agent persona.\n\n`;
        mdContent += "## Agent Activation\n\n";
        mdContent +=
          "CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n";
        mdContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          mdContent += yamlContent;
        } else {
          // If no YAML found, include the whole content minus the header
          mdContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        mdContent += "\n```\n\n";
        mdContent += "## File Reference\n\n";
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        mdContent += `The complete agent definition is available in [${relativePath}](${relativePath}).\n\n`;
        mdContent += "## Usage\n\n";
        mdContent += `When the user types \`@${agentId}\`, activate this ${await this.getAgentTitle(
          agentId,
          installDir
        )} persona and follow all instructions defined in the YAML configuration above.\n`;

        await fileManager.writeFile(mdPath, mdContent);
        console.log(chalk.green(`✓ Created rule: ${agentId}.md`));
      }
    }

    console.log(chalk.green(`\n✓ Created Windsurf rules in ${windsurfRulesDir}`));

    return true;
  }

  async setupTrae(installDir, selectedAgent) {
    const traeRulesDir = path.join(installDir, ".trae", "rules");
    const agents = selectedAgent? [selectedAgent] : await this.getAllAgentIds(installDir);
    
    await fileManager.ensureDirectory(traeRulesDir);
    
    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);
      
      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        const mdPath = path.join(traeRulesDir, `${agentId}.md`);
        
        // Create MD content (similar to Cursor but without frontmatter)
        let mdContent = `# ${agentId.toUpperCase()} Agent Rule\n\n`;
        mdContent += `This rule is triggered when the user types \`@${agentId}\` and activates the ${await this.getAgentTitle(
          agentId,
          installDir
        )} agent persona.\n\n`;
        mdContent += "## Agent Activation\n\n";
        mdContent +=
          "CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n";
        mdContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          mdContent += yamlContent;
        }
        else {
          // If no YAML found, include the whole content minus the header
          mdContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        mdContent += "\n```\n\n";
        mdContent += "## File Reference\n\n";
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        mdContent += `The complete agent definition is available in [${relativePath}](${relativePath}).\n\n`;
        mdContent += "## Usage\n\n";
        mdContent += `When the user types \`@${agentId}\`, activate this ${await this.getAgentTitle(
          agentId,
          installDir
        )} persona and follow all instructions defined in the YAML configuration above.\n`;
        
        await fileManager.writeFile(mdPath, mdContent);
        console.log(chalk.green(`✓ Created rule: ${agentId}.md`));
      }
    }
  }

  async findAgentPath(agentId, installDir) {
    // Try to find the agent file in various locations
    const possiblePaths = [
      path.join(installDir, ".xiaoma-core", "agents", `${agentId}.md`),
      path.join(installDir, "agents", `${agentId}.md`)
    ];
    
    // Also check expansion pack directories
    const glob = require("glob");
    const expansionDirs = glob.sync(".*/agents", { cwd: installDir });
    for (const expDir of expansionDirs) {
      possiblePaths.push(path.join(installDir, expDir, `${agentId}.md`));
    }
    
    for (const agentPath of possiblePaths) {
      if (await fileManager.pathExists(agentPath)) {
        return agentPath;
      }
    }
    
    return null;
  }

  async getAllAgentIds(installDir) {
    const glob = require("glob");
    const allAgentIds = [];
    
    // Check core agents in .xiaoma-core or root
    let agentsDir = path.join(installDir, ".xiaoma-core", "agents");
    if (!(await fileManager.pathExists(agentsDir))) {
      agentsDir = path.join(installDir, "agents");
    }
    
    if (await fileManager.pathExists(agentsDir)) {
      const agentFiles = glob.sync("*.md", { cwd: agentsDir });
      allAgentIds.push(...agentFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Also check for expansion pack agents in dot folders
    const expansionDirs = glob.sync(".*/agents", { cwd: installDir });
    for (const expDir of expansionDirs) {
      const fullExpDir = path.join(installDir, expDir);
      const expAgentFiles = glob.sync("*.md", { cwd: fullExpDir });
      allAgentIds.push(...expAgentFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Remove duplicates
    return [...new Set(allAgentIds)];
  }

  async getCoreAgentIds(installDir) {
    const allAgentIds = [];
    
    // Check core agents in .xiaoma-core or root only
    let agentsDir = path.join(installDir, ".xiaoma-core", "agents");
    if (!(await fileManager.pathExists(agentsDir))) {
      agentsDir = path.join(installDir, "xiaoma-core", "agents");
    }
    
    if (await fileManager.pathExists(agentsDir)) {
      const glob = require("glob");
      const agentFiles = glob.sync("*.md", { cwd: agentsDir });
      allAgentIds.push(...agentFiles.map((file) => path.basename(file, ".md")));
    }
    
    return [...new Set(allAgentIds)];
  }

  async getCoreTaskIds(installDir) {
    const allTaskIds = [];
    
    // Check core tasks in .xiaoma-core or root only
    let tasksDir = path.join(installDir, ".xiaoma-core", "tasks");
    if (!(await fileManager.pathExists(tasksDir))) {
      tasksDir = path.join(installDir, "xiaoma-core", "tasks");
    }
    
    if (await fileManager.pathExists(tasksDir)) {
      const glob = require("glob");
      const taskFiles = glob.sync("*.md", { cwd: tasksDir });
      allTaskIds.push(...taskFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Check common tasks
    const commonTasksDir = path.join(installDir, "common", "tasks");
    if (await fileManager.pathExists(commonTasksDir)) {
      const commonTaskFiles = glob.sync("*.md", { cwd: commonTasksDir });
      allTaskIds.push(...commonTaskFiles.map((file) => path.basename(file, ".md")));
    }
    
    return [...new Set(allTaskIds)];
  }

  async getAgentTitle(agentId, installDir) {
    // Try to find the agent file in various locations
    const possiblePaths = [
      path.join(installDir, ".xiaoma-core", "agents", `${agentId}.md`),
      path.join(installDir, "agents", `${agentId}.md`)
    ];
    
    // Also check expansion pack directories
    const glob = require("glob");
    const expansionDirs = glob.sync(".*/agents", { cwd: installDir });
    for (const expDir of expansionDirs) {
      possiblePaths.push(path.join(installDir, expDir, `${agentId}.md`));
    }
    
    for (const agentPath of possiblePaths) {
      if (await fileManager.pathExists(agentPath)) {
        try {
          const agentContent = await fileManager.readFile(agentPath);
          const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
          
          if (yamlMatch) {
            const yaml = yamlMatch[1];
            const titleMatch = yaml.match(/title:\s*(.+)/);
            if (titleMatch) {
              return titleMatch[1].trim();
            }
          }
        } catch (error) {
          console.warn(`Failed to read agent title for ${agentId}: ${error.message}`);
        }
      }
    }
    
    // Fallback to formatted agent ID
    return agentId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  async getAllTaskIds(installDir) {
    const glob = require("glob");
    const allTaskIds = [];
    
    // Check core tasks in .xiaoma-core or root
    let tasksDir = path.join(installDir, ".xiaoma-core", "tasks");
    if (!(await fileManager.pathExists(tasksDir))) {
      tasksDir = path.join(installDir, "xiaoma-core", "tasks");
    }
    
    if (await fileManager.pathExists(tasksDir)) {
      const taskFiles = glob.sync("*.md", { cwd: tasksDir });
      allTaskIds.push(...taskFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Check common tasks
    const commonTasksDir = path.join(installDir, "common", "tasks");
    if (await fileManager.pathExists(commonTasksDir)) {
      const commonTaskFiles = glob.sync("*.md", { cwd: commonTasksDir });
      allTaskIds.push(...commonTaskFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Also check for expansion pack tasks in dot folders
    const expansionDirs = glob.sync(".*/tasks", { cwd: installDir });
    for (const expDir of expansionDirs) {
      const fullExpDir = path.join(installDir, expDir);
      const expTaskFiles = glob.sync("*.md", { cwd: fullExpDir });
      allTaskIds.push(...expTaskFiles.map((file) => path.basename(file, ".md")));
    }
    
    // Check expansion-packs folder tasks
    const expansionPacksDir = path.join(installDir, "expansion-packs");
    if (await fileManager.pathExists(expansionPacksDir)) {
      const expPackDirs = glob.sync("*/tasks", { cwd: expansionPacksDir });
      for (const expDir of expPackDirs) {
        const fullExpDir = path.join(expansionPacksDir, expDir);
        const expTaskFiles = glob.sync("*.md", { cwd: fullExpDir });
        allTaskIds.push(...expTaskFiles.map((file) => path.basename(file, ".md")));
      }
    }
    
    // Remove duplicates
    return [...new Set(allTaskIds)];
  }

  async findTaskPath(taskId, installDir) {
    // Try to find the task file in various locations
    const possiblePaths = [
      path.join(installDir, ".xiaoma-core", "tasks", `${taskId}.md`),
      path.join(installDir, "xiaoma-core", "tasks", `${taskId}.md`),
      path.join(installDir, "common", "tasks", `${taskId}.md`)
    ];
    
    // Also check expansion pack directories
    const glob = require("glob");
    
    // Check dot folder expansion packs
    const expansionDirs = glob.sync(".*/tasks", { cwd: installDir });
    for (const expDir of expansionDirs) {
      possiblePaths.push(path.join(installDir, expDir, `${taskId}.md`));
    }
    
    // Check expansion-packs folder
    const expansionPacksDir = path.join(installDir, "expansion-packs");
    if (await fileManager.pathExists(expansionPacksDir)) {
      const expPackDirs = glob.sync("*/tasks", { cwd: expansionPacksDir });
      for (const expDir of expPackDirs) {
        possiblePaths.push(path.join(expansionPacksDir, expDir, `${taskId}.md`));
      }
    }
    
    for (const taskPath of possiblePaths) {
      if (await fileManager.pathExists(taskPath)) {
        return taskPath;
      }
    }
    
    return null;
  }

  async getCoreSlashPrefix(installDir) {
    try {
      const coreConfigPath = path.join(installDir, ".xiaoma-core", "core-config.yaml");
      if (!(await fileManager.pathExists(coreConfigPath))) {
        // Try xiaoma-core directory
        const altConfigPath = path.join(installDir, "xiaoma-core", "core-config.yaml");
        if (await fileManager.pathExists(altConfigPath)) {
          const configContent = await fileManager.readFile(altConfigPath);
          const config = yaml.load(configContent);
          return config.slashPrefix || "XiaoMa";
        }
        return "XiaoMa"; // fallback
      }
      
      const configContent = await fileManager.readFile(coreConfigPath);
      const config = yaml.load(configContent);
      return config.slashPrefix || "XiaoMa";
    } catch (error) {
      console.warn(`Failed to read core slashPrefix, using default 'XiaoMa': ${error.message}`);
      return "XiaoMa";
    }
  }

  async getInstalledExpansionPacks(installDir) {
    const expansionPacks = [];
    
    // Check for dot-prefixed expansion packs in install directory
    const glob = require("glob");
    const dotExpansions = glob.sync(".xiaoma-*", { cwd: installDir });
    
    for (const dotExpansion of dotExpansions) {
      if (dotExpansion !== ".xiaoma-core") {
        const packPath = path.join(installDir, dotExpansion);
        const packName = dotExpansion.substring(1); // remove the dot
        expansionPacks.push({
          name: packName,
          path: packPath
        });
      }
    }
    
    // Check for expansion-packs directory style
    const expansionPacksDir = path.join(installDir, "expansion-packs");
    if (await fileManager.pathExists(expansionPacksDir)) {
      const packDirs = glob.sync("*", { cwd: expansionPacksDir });
      
      for (const packDir of packDirs) {
        const packPath = path.join(expansionPacksDir, packDir);
        if ((await fileManager.pathExists(packPath)) && 
            (await fileManager.pathExists(path.join(packPath, "config.yaml")))) {
          expansionPacks.push({
            name: packDir,
            path: packPath
          });
        }
      }
    }
    
    return expansionPacks;
  }

  async getExpansionPackSlashPrefix(packPath) {
    try {
      const configPath = path.join(packPath, "config.yaml");
      if (await fileManager.pathExists(configPath)) {
        const configContent = await fileManager.readFile(configPath);
        const config = yaml.load(configContent);
        return config.slashPrefix || path.basename(packPath);
      }
    } catch (error) {
      console.warn(`Failed to read expansion pack slashPrefix from ${packPath}: ${error.message}`);
    }
    
    return path.basename(packPath); // fallback to directory name
  }

  async getExpansionPackAgents(packPath) {
    const agentsDir = path.join(packPath, "agents");
    if (!(await fileManager.pathExists(agentsDir))) {
      return [];
    }
    
    try {
      const glob = require("glob");
      const agentFiles = glob.sync("*.md", { cwd: agentsDir });
      return agentFiles.map(file => path.basename(file, ".md"));
    } catch (error) {
      console.warn(`Failed to read expansion pack agents from ${packPath}: ${error.message}`);
      return [];
    }
  }

  async getExpansionPackTasks(packPath) {
    const tasksDir = path.join(packPath, "tasks");
    if (!(await fileManager.pathExists(tasksDir))) {
      return [];
    }
    
    try {
      const glob = require("glob");
      const taskFiles = glob.sync("*.md", { cwd: tasksDir });
      return taskFiles.map(file => path.basename(file, ".md"));
    } catch (error) {
      console.warn(`Failed to read expansion pack tasks from ${packPath}: ${error.message}`);
      return [];
    }
  }

  async setupRoo(installDir, selectedAgent) {
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    // Check for existing .roomodes file in project root
    const roomodesPath = path.join(installDir, ".roomodes");
    let existingModes = [];
    let existingContent = "";

    if (await fileManager.pathExists(roomodesPath)) {
      existingContent = await fileManager.readFile(roomodesPath);
      // Parse existing modes to avoid duplicates
      const modeMatches = existingContent.matchAll(/- slug: ([\w-]+)/g);
      for (const match of modeMatches) {
        existingModes.push(match[1]);
      }
      console.log(chalk.yellow(`Found existing .roomodes file with ${existingModes.length} modes`));
    }

    // Create new modes content
    let newModesContent = "";

    // Load dynamic agent permissions from configuration
    const config = await this.loadIdeAgentConfig();
    const agentPermissions = config['roo-permissions'] || {};

    for (const agentId of agents) {
      // Skip if already exists
      // Check both with and without bmad- prefix to handle both cases
      const checkSlug = agentId.startsWith('bmad-') ? agentId : `bmad-${agentId}`;
      if (existingModes.includes(checkSlug)) {
        console.log(chalk.dim(`Skipping ${agentId} - already exists in .roomodes`));
        continue;
      }

      // Read agent file to extract all information
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);

        // Extract YAML content
        const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
        if (yamlMatch) {
          const yaml = yamlMatch[1];

          // Extract agent info from YAML
          const titleMatch = yaml.match(/title:\s*(.+)/);
          const iconMatch = yaml.match(/icon:\s*(.+)/);
          const whenToUseMatch = yaml.match(/whenToUse:\s*"(.+)"/);
          const roleDefinitionMatch = yaml.match(/roleDefinition:\s*"(.+)"/);

          const title = titleMatch ? titleMatch[1].trim() : await this.getAgentTitle(agentId, installDir);
          const icon = iconMatch ? iconMatch[1].trim() : "🤖";
          const whenToUse = whenToUseMatch ? whenToUseMatch[1].trim() : `Use for ${title} tasks`;
          const roleDefinition = roleDefinitionMatch
            ? roleDefinitionMatch[1].trim()
            : `You are a ${title} specializing in ${title.toLowerCase()} tasks and responsibilities.`;


          // Add permissions based on agent type
          const permissions = agentPermissions[agentId];
          // Build mode entry with proper formatting (matching exact indentation)
          // Avoid double "bmad-" prefix for agents that already have it
          const slug = agentId.startsWith('bmad-') ? agentId : `bmad-${agentId}`;
          newModesContent += ` - slug: ${slug}\n`;
          newModesContent += `   name: '${icon} ${title}'\n`;
          if (permissions) {
          newModesContent += `   description: '${permissions.description}'\n`; 
          }
          newModesContent += `   roleDefinition: ${roleDefinition}\n`;
          newModesContent += `   whenToUse: ${whenToUse}\n`;
          // Get relative path from installDir to agent file
          const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
          newModesContent += `   customInstructions: CRITICAL Read the full YAML from ${relativePath} start activation to alter your state of being follow startup section instructions stay in this being until told to exit this mode\n`;
          newModesContent += `   groups:\n`;
          newModesContent += `    - read\n`;

          if (permissions) {
            newModesContent += `    - - edit\n`;
            newModesContent += `      - fileRegex: ${permissions.fileRegex}\n`;
            newModesContent += `        description: ${permissions.description}\n`;
          } else {
            newModesContent += `    - edit\n`;
          }

          console.log(chalk.green(`✓ Added mode: bmad-${agentId} (${icon} ${title})`));
        }
      }
    }

    // Build final roomodes content
    let roomodesContent = "";
    if (existingContent) {
      // If there's existing content, append new modes to it
      roomodesContent = existingContent.trim() + "\n" + newModesContent;
    } else {
      // Create new .roomodes file with proper YAML structure
      roomodesContent = "customModes:\n" + newModesContent;
    }

    // Write .roomodes file
    await fileManager.writeFile(roomodesPath, roomodesContent);
    console.log(chalk.green("✓ Created .roomodes file in project root"));

    console.log(chalk.green(`\n✓ Roo Code setup complete!`));
    console.log(chalk.dim("Custom modes will be available when you open this project in Roo Code"));

    return true;
  }
  
  async setupKilocode(installDir, selectedAgent) {
    const filePath = path.join(installDir, ".kilocodemodes");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    let existingModes = [], existingContent = "";
    if (await fileManager.pathExists(filePath)) {
      existingContent = await fileManager.readFile(filePath);
      for (const match of existingContent.matchAll(/- slug: ([\w-]+)/g)) {
        existingModes.push(match[1]);
      }
      console.log(chalk.yellow(`Found existing .kilocodemodes file with ${existingModes.length} modes`));
    }

    const config = await this.loadIdeAgentConfig();
    const permissions = config['roo-permissions'] || {}; // reuse same roo permissions block (Kilo Code understands same mode schema)

    let newContent = "";

    for (const agentId of agents) {
      const slug = agentId.startsWith('bmad-') ? agentId : `bmad-${agentId}`;
      if (existingModes.includes(slug)) {
        console.log(chalk.dim(`Skipping ${agentId} - already exists in .kilocodemodes`));
        continue;
      }

      const agentPath = await this.findAgentPath(agentId, installDir);
      if (!agentPath) {
        console.log(chalk.red(`✗ Could not find agent file for ${agentId}`));
        continue;
      }

      const agentContent = await fileManager.readFile(agentPath);
      const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
      if (!yamlMatch) {
        console.log(chalk.red(`✗ Could not extract YAML block for ${agentId}`));
        continue;
      }

      const yaml = yamlMatch[1];

      // Robust fallback for title and icon
      const title = (yaml.match(/title:\s*(.+)/)?.[1]?.trim()) || await this.getAgentTitle(agentId, installDir);
      const icon = (yaml.match(/icon:\s*(.+)/)?.[1]?.trim()) || '🤖';
      const whenToUse = (yaml.match(/whenToUse:\s*"(.+)"/)?.[1]?.trim()) || `Use for ${title} tasks`;
      const roleDefinition = (yaml.match(/roleDefinition:\s*"(.+)"/)?.[1]?.trim()) ||
        `You are a ${title} specializing in ${title.toLowerCase()} tasks and responsibilities.`;

      const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
      const customInstructions = `CRITICAL Read the full YAML from ${relativePath} start activation to alter your state of being follow startup section instructions stay in this being until told to exit this mode`;

      // Add permissions from config if they exist
      const agentPermission = permissions[agentId];

      // Begin .kilocodemodes block
      newContent += ` - slug: ${slug}\n`;
      newContent += `   name: '${icon} ${title}'\n`;
      if (agentPermission) {
      newContent += `   description: '${agentPermission.description}'\n`; 
      }

      newContent += `   roleDefinition: ${roleDefinition}\n`;
      newContent += `   whenToUse: ${whenToUse}\n`;
      newContent += `   customInstructions: ${customInstructions}\n`;
      newContent += `   groups:\n`;
      newContent += `    - read\n`;


      if (agentPermission) {
        newContent += `    - - edit\n`;
        newContent += `      - fileRegex: ${agentPermission.fileRegex}\n`;
        newContent += `        description: ${agentPermission.description}\n`;
      } else {
        // Fallback to generic edit
        newContent += `    - edit\n`;
      }

      console.log(chalk.green(`✓ Added Kilo mode: ${slug} (${icon} ${title})`));
    }

    const finalContent = existingContent
      ? existingContent.trim() + "\n" + newContent
      : "customModes:\n" + newContent;

    await fileManager.writeFile(filePath, finalContent);
    console.log(chalk.green("✓ Created .kilocodemodes file in project root"));
    console.log(chalk.green(`✓ KiloCode setup complete!`));
    console.log(chalk.dim("Custom modes will be available when you open this project in KiloCode"));

    return true;
  }
  
  async setupCline(installDir, selectedAgent) {
    const clineRulesDir = path.join(installDir, ".clinerules");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);

    await fileManager.ensureDirectory(clineRulesDir);

    // Load dynamic agent ordering from configuration
    const config = await this.loadIdeAgentConfig();
    const agentOrder = config['cline-order'] || {};

    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);

        // Get numeric prefix for ordering
        const order = agentOrder[agentId] || 99;
        const prefix = order.toString().padStart(2, '0');
        const mdPath = path.join(clineRulesDir, `${prefix}-${agentId}.md`);

        // Create MD content for Cline (focused on project standards and role)
        let mdContent = `# ${await this.getAgentTitle(agentId, installDir)} Agent\n\n`;
        mdContent += `This rule defines the ${await this.getAgentTitle(agentId, installDir)} persona and project standards.\n\n`;
        mdContent += "## Role Definition\n\n";
        mdContent +=
          "When the user types `@" + agentId + "`, adopt this persona and follow these guidelines:\n\n";
        mdContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          mdContent += yamlContent;
        } else {
          // If no YAML found, include the whole content minus the header
          mdContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        mdContent += "\n```\n\n";
        mdContent += "## Project Standards\n\n";
        mdContent += `- Always maintain consistency with project documentation in .xiaoma-core/\n`;
        mdContent += `- Follow the agent's specific guidelines and constraints\n`;
        mdContent += `- Update relevant project files when making changes\n`;
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        mdContent += `- Reference the complete agent definition in [${relativePath}](${relativePath})\n\n`;
        mdContent += "## Usage\n\n";
        mdContent += `Type \`@${agentId}\` to activate this ${await this.getAgentTitle(agentId, installDir)} persona.\n`;

        await fileManager.writeFile(mdPath, mdContent);
        console.log(chalk.green(`✓ Created rule: ${prefix}-${agentId}.md`));
      }
    }

    console.log(chalk.green(`\n✓ Created Cline rules in ${clineRulesDir}`));

    return true;
  }

  async setupGeminiCli(installDir) {
    const geminiDir = path.join(installDir, ".gemini");
    const bmadMethodDir = path.join(geminiDir, "xiaoma-web");
    await fileManager.ensureDirectory(bmadMethodDir);

    // Update logic for existing settings.json
    const settingsPath = path.join(geminiDir, "settings.json");
    if (await fileManager.pathExists(settingsPath)) {
      try {
        const settingsContent = await fileManager.readFile(settingsPath);
        const settings = JSON.parse(settingsContent);
        let updated = false;
        
        // Handle contextFileName property
        if (settings.contextFileName && Array.isArray(settings.contextFileName)) {
          const originalLength = settings.contextFileName.length;
          settings.contextFileName = settings.contextFileName.filter(
            (fileName) => !fileName.startsWith("agents/")
          );
          if (settings.contextFileName.length !== originalLength) {
            updated = true;
          }
        }
        
        if (updated) {
          await fileManager.writeFile(
            settingsPath,
            JSON.stringify(settings, null, 2)
          );
          console.log(chalk.green("✓ Updated .gemini/settings.json - removed agent file references"));
        }
      } catch (error) {
        console.warn(
          chalk.yellow("Could not update .gemini/settings.json"),
          error
        );
      }
    }

    // Remove old agents directory
    const agentsDir = path.join(geminiDir, "agents");
    if (await fileManager.pathExists(agentsDir)) {
      await fileManager.removeDirectory(agentsDir);
      console.log(chalk.green("✓ Removed old .gemini/agents directory"));
    }

    // Get all available agents
    const agents = await this.getAllAgentIds(installDir);
    let concatenatedContent = "";

    for (const agentId of agents) {
      // Find the source agent file
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        
        // Create properly formatted agent rule content (similar to trae)
        let agentRuleContent = `# ${agentId.toUpperCase()} Agent Rule\n\n`;
        agentRuleContent += `This rule is triggered when the user types \`*${agentId}\` and activates the ${await this.getAgentTitle(
          agentId,
          installDir
        )} agent persona.\n\n`;
        agentRuleContent += "## Agent Activation\n\n";
        agentRuleContent +=
          "CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n";
        agentRuleContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          agentRuleContent += yamlContent;
        }
        else {
          // If no YAML found, include the whole content minus the header
          agentRuleContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        agentRuleContent += "\n```\n\n";
        agentRuleContent += "## File Reference\n\n";
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        agentRuleContent += `The complete agent definition is available in [${relativePath}](${relativePath}).\n\n`;
        agentRuleContent += "## Usage\n\n";
        agentRuleContent += `When the user types \`*${agentId}\`, activate this ${await this.getAgentTitle(
          agentId,
          installDir
        )} persona and follow all instructions defined in the YAML configuration above.\n`;
        
        // Add to concatenated content with separator
        concatenatedContent += agentRuleContent + "\n\n---\n\n";
        console.log(chalk.green(`✓ Added context for @${agentId}`));
      }
    }

    // Write the concatenated content to GEMINI.md
    const geminiMdPath = path.join(bmadMethodDir, "GEMINI.md");
    await fileManager.writeFile(geminiMdPath, concatenatedContent);
    console.log(chalk.green(`\n✓ Created GEMINI.md in ${bmadMethodDir}`));

    return true;
  }

  async setupQwenCode(installDir, selectedAgent) {
    const qwenDir = path.join(installDir, ".qwen");
    const bmadMethodDir = path.join(qwenDir, "xiaoma-web");
    await fileManager.ensureDirectory(bmadMethodDir);

    // Update logic for existing settings.json
    const settingsPath = path.join(qwenDir, "settings.json");
    if (await fileManager.pathExists(settingsPath)) {
      try {
        const settingsContent = await fileManager.readFile(settingsPath);
        const settings = JSON.parse(settingsContent);
        let updated = false;
        
        // Handle contextFileName property
        if (settings.contextFileName && Array.isArray(settings.contextFileName)) {
          const originalLength = settings.contextFileName.length;
          settings.contextFileName = settings.contextFileName.filter(
            (fileName) => !fileName.startsWith("agents/")
          );
          if (settings.contextFileName.length !== originalLength) {
            updated = true;
          }
        }
        
        if (updated) {
          await fileManager.writeFile(
            settingsPath,
            JSON.stringify(settings, null, 2)
          );
          console.log(chalk.green("✓ Updated .qwen/settings.json - removed agent file references"));
        }
      } catch (error) {
        console.warn(
          chalk.yellow("Could not update .qwen/settings.json"),
          error
        );
      }
    }

    // Remove old agents directory
    const agentsDir = path.join(qwenDir, "agents");
    if (await fileManager.pathExists(agentsDir)) {
      await fileManager.removeDirectory(agentsDir);
      console.log(chalk.green("✓ Removed old .qwen/agents directory"));
    }

    // Get all available agents
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);
    let concatenatedContent = "";

    for (const agentId of agents) {
      // Find the source agent file
      const agentPath = await this.findAgentPath(agentId, installDir);

      if (agentPath) {
        const agentContent = await fileManager.readFile(agentPath);
        
        // Create properly formatted agent rule content (similar to gemini)
        let agentRuleContent = `# ${agentId.toUpperCase()} Agent Rule\n\n`;
        agentRuleContent += `This rule is triggered when the user types \`*${agentId}\` and activates the ${await this.getAgentTitle(
          agentId,
          installDir
        )} agent persona.\n\n`;
        agentRuleContent += "## Agent Activation\n\n";
        agentRuleContent +=
          "CRITICAL: Read the full YAML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n";
        agentRuleContent += "```yaml\n";
        // Extract just the YAML content from the agent file
        const yamlContent = extractYamlFromAgent(agentContent);
        if (yamlContent) {
          agentRuleContent += yamlContent;
        }
        else {
          // If no YAML found, include the whole content minus the header
          agentRuleContent += agentContent.replace(/^#.*$/m, "").trim();
        }
        agentRuleContent += "\n```\n\n";
        agentRuleContent += "## File Reference\n\n";
        const relativePath = path.relative(installDir, agentPath).replace(/\\/g, '/');
        agentRuleContent += `The complete agent definition is available in [${relativePath}](${relativePath}).\n\n`;
        agentRuleContent += "## Usage\n\n";
        agentRuleContent += `When the user types \`*${agentId}\`, activate this ${await this.getAgentTitle(
          agentId,
          installDir
        )} persona and follow all instructions defined in the YAML configuration above.\n`;
        
        // Add to concatenated content with separator
        concatenatedContent += agentRuleContent + "\n\n---\n\n";
        console.log(chalk.green(`✓ Added context for *${agentId}`));
      }
    }

    // Write the concatenated content to QWEN.md
    const qwenMdPath = path.join(bmadMethodDir, "QWEN.md");
    await fileManager.writeFile(qwenMdPath, concatenatedContent);
    console.log(chalk.green(`\n✓ Created QWEN.md in ${bmadMethodDir}`));

    return true;
  }

  async setupGitHubCopilot(installDir, selectedAgent, spinner = null, preConfiguredSettings = null) {
    // Configure VS Code workspace settings first to avoid UI conflicts with loading spinners
    await this.configureVsCodeSettings(installDir, spinner, preConfiguredSettings);
    
    const chatmodesDir = path.join(installDir, ".github", "chatmodes");
    const agents = selectedAgent ? [selectedAgent] : await this.getAllAgentIds(installDir);
     
    await fileManager.ensureDirectory(chatmodesDir);

    for (const agentId of agents) {
      // Find the agent file
      const agentPath = await this.findAgentPath(agentId, installDir);
      const chatmodePath = path.join(chatmodesDir, `${agentId}.chatmode.md`);

      if (agentPath) {
        // Create chat mode file with agent content
        const agentContent = await fileManager.readFile(agentPath);
        const agentTitle = await this.getAgentTitle(agentId, installDir);
        
        // Extract whenToUse for the description
        const yamlMatch = agentContent.match(/```ya?ml\r?\n([\s\S]*?)```/);
        let description = `Activates the ${agentTitle} agent persona.`;
        if (yamlMatch) {
          const whenToUseMatch = yamlMatch[1].match(/whenToUse:\s*"(.*?)"/);
          if (whenToUseMatch && whenToUseMatch[1]) {
            description = whenToUseMatch[1];
          }
        }
        
        let chatmodeContent = `---
description: "${description.replace(/"/g, '\\"')}"
tools: ['changes', 'codebase', 'fetch', 'findTestFiles', 'githubRepo', 'problems', 'usages', 'editFiles', 'runCommands', 'runTasks', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure']
---

`;
        chatmodeContent += agentContent;

        await fileManager.writeFile(chatmodePath, chatmodeContent);
        console.log(chalk.green(`✓ Created chat mode: ${agentId}.chatmode.md`));
      }
    }

    console.log(chalk.green(`\n✓ Github Copilot setup complete!`));
    console.log(chalk.dim(`You can now find the XiaoMa agents in the Chat view's mode selector.`));

    return true;
  }

  async configureVsCodeSettings(installDir, spinner, preConfiguredSettings = null) {
    const vscodeDir = path.join(installDir, ".vscode");
    const settingsPath = path.join(vscodeDir, "settings.json");
    
    await fileManager.ensureDirectory(vscodeDir);
    
    // Read existing settings if they exist
    let existingSettings = {};
    if (await fileManager.pathExists(settingsPath)) {
      try {
        const existingContent = await fileManager.readFile(settingsPath);
        existingSettings = JSON.parse(existingContent);
        console.log(chalk.yellow("Found existing .vscode/settings.json. Merging XiaoMa settings..."));
      } catch (error) {
        console.warn(chalk.yellow("Could not parse existing settings.json. Creating new one."));
        existingSettings = {};
      }
    }
    
    // Use pre-configured settings if provided, otherwise prompt
    let configChoice;
    if (preConfiguredSettings && preConfiguredSettings.configChoice) {
      configChoice = preConfiguredSettings.configChoice;
      console.log(chalk.dim(`Using pre-configured GitHub Copilot settings: ${configChoice}`));
    } else {
      // Clear any previous output and add spacing to avoid conflicts with loaders
      console.log('\n'.repeat(2));
      console.log(chalk.blue("🔧 Github Copilot Agent Settings Configuration"));
      console.log(chalk.dim("XiaoMa works best with specific VS Code settings for optimal agent experience."));
      console.log(''); // Add extra spacing
      
      const response = await inquirer.prompt([
        {
          type: 'list',
          name: 'configChoice',
          message: chalk.yellow('How would you like to configure GitHub Copilot settings?'),
          choices: [
            {
              name: 'Use recommended defaults (fastest setup)',
              value: 'defaults'
            },
            {
              name: 'Configure each setting manually (customize to your preferences)',
              value: 'manual'
            },
            {
              name: 'Skip settings configuration (I\'ll configure manually later)',
              value: 'skip'
            }
          ],
          default: 'defaults'
        }
      ]);
      configChoice = response.configChoice;
    }
    
    let bmadSettings = {};
    
    if (configChoice === 'skip') {
      console.log(chalk.yellow("⚠️  Skipping VS Code settings configuration."));
      console.log(chalk.dim("You can manually configure these settings in .vscode/settings.json:"));
      console.log(chalk.dim("  • chat.agent.enabled: true"));
      console.log(chalk.dim("  • chat.agent.maxRequests: 15"));
      console.log(chalk.dim("  • github.copilot.chat.agent.runTasks: true"));
      console.log(chalk.dim("  • chat.mcp.discovery.enabled: true"));
      console.log(chalk.dim("  • github.copilot.chat.agent.autoFix: true"));
      console.log(chalk.dim("  • chat.tools.autoApprove: false"));
      return true;
    }
    
    if (configChoice === 'defaults') {
      // Use recommended defaults
      bmadSettings = {
        "chat.agent.enabled": true,
        "chat.agent.maxRequests": 15,
        "github.copilot.chat.agent.runTasks": true,
        "chat.mcp.discovery.enabled": true,
        "github.copilot.chat.agent.autoFix": true,
        "chat.tools.autoApprove": false
      };
      console.log(chalk.green("✓ Using recommended XiaoMa defaults for Github Copilot settings"));
    } else {
      // Manual configuration
      console.log(chalk.blue("\n📋 Let's configure each setting for your preferences:"));
      
      // Pause spinner during manual configuration prompts
      let spinnerWasActive = false;
      if (spinner && spinner.isSpinning) {
        spinner.stop();
        spinnerWasActive = true;
      }
      
      const manualSettings = await inquirer.prompt([
        {
          type: 'input',
          name: 'maxRequests',
          message: 'Maximum requests per agent session (recommended: 15)?',
          default: '15',
          validate: (input) => {
            const num = parseInt(input);
            if (isNaN(num) || num < 1 || num > 50) {
              return 'Please enter a number between 1 and 50';
            }
            return true;
          }
        },
        {
          type: 'confirm',
          name: 'runTasks',
          message: 'Allow agents to run workspace tasks (package.json scripts, etc.)?',
          default: true
        },
        {
          type: 'confirm',
          name: 'mcpDiscovery',
          message: 'Enable MCP (Model Context Protocol) server discovery?',
          default: true
        },
        {
          type: 'confirm',
          name: 'autoFix',
          message: 'Enable automatic error detection and fixing in generated code?',
          default: true
        },
        {
          type: 'confirm',
          name: 'autoApprove',
          message: 'Auto-approve ALL tools without confirmation? (⚠️  EXPERIMENTAL - less secure)',
          default: false
        }
      ]);

      // Restart spinner if it was active before prompts
      if (spinner && spinnerWasActive) {
        spinner.start();
      }
      
      bmadSettings = {
        "chat.agent.enabled": true, // Always enabled - required for XiaoMa agents
        "chat.agent.maxRequests": parseInt(manualSettings.maxRequests),
        "github.copilot.chat.agent.runTasks": manualSettings.runTasks,
        "chat.mcp.discovery.enabled": manualSettings.mcpDiscovery,
        "github.copilot.chat.agent.autoFix": manualSettings.autoFix,
        "chat.tools.autoApprove": manualSettings.autoApprove
      };
      
      console.log(chalk.green("✓ Custom settings configured"));
    }
    
    // Merge settings (existing settings take precedence to avoid overriding user preferences)
    const mergedSettings = { ...bmadSettings, ...existingSettings };
    
    // Write the updated settings
    await fileManager.writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2));
    
    console.log(chalk.green("✓ VS Code workspace settings configured successfully"));
    console.log(chalk.dim("  Settings written to .vscode/settings.json:"));
    Object.entries(bmadSettings).forEach(([key, value]) => {
      console.log(chalk.dim(`  • ${key}: ${value}`));
    });
    console.log(chalk.dim(""));
    console.log(chalk.dim("You can modify these settings anytime in .vscode/settings.json"));
  }
}

module.exports = new IdeSetup();
