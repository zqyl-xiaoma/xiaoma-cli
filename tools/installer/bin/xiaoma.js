#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs').promises;
const yaml = require('js-yaml');
const chalk = require('chalk');
const inquirer = require('inquirer');

// Handle both execution contexts (from root via npx or from installer directory)
let version;
let installer;
try {
  // Try installer context first (when run from tools/installer/)
  version = require('../package.json').version;
  installer = require('../lib/installer');
} catch (e) {
  // Fall back to root context (when run via npx from GitHub)
  console.log(`Installer context not found (${e.message}), trying root context...`);
  try {
    version = require('../../../package.json').version;
    installer = require('../../../tools/installer/lib/installer');
  } catch (e2) {
    console.error('Error: Could not load required modules. Please ensure you are running from the correct directory.');
    console.error('Debug info:', {
      __dirname,
      cwd: process.cwd(),
      error: e2.message
    });
    process.exit(1);
  }
}

program
  .version(version)
  .description('XiaoMa Web installer - Universal AI agent framework for any domain');

program
  .command('install')
  .description('Install XiaoMa Web agents and tools')
  .option('-f, --full', 'Install complete XiaoMa Web')
  .option('-x, --expansion-only', 'Install only expansion packs (no xiaoma-core)')
  .option('-d, --directory <path>', 'Installation directory')
  .option('-i, --ide <ide...>', 'Configure for specific IDE(s) - can specify multiple (cursor, claude-code, windsurf, trae, roo, kilo, cline, gemini, qwen-code, github-copilot, other)')
  .option('-e, --expansion-packs <packs...>', 'Install specific expansion packs (can specify multiple)')
  .action(async (options) => {
    try {
      if (!options.full && !options.expansionOnly) {
        // Interactive mode
        const answers = await promptInstallation();
        if (!answers._alreadyInstalled) {
          await installer.install(answers);
          process.exit(0);
        }
      } else {
        // Direct mode
        let installType = 'full';
        if (options.expansionOnly) installType = 'expansion-only';

        const config = {
          installType,
          directory: options.directory || '.',
          ides: (options.ide || []).filter(ide => ide !== 'other'),
          expansionPacks: options.expansionPacks || [],
          // Default web bundles configuration
          includeWebBundles: true,
          webBundleType: 'all',
          webBundlesDirectory: `${options.directory || '.'}/web-bundles`
        };
        await installer.install(config);
        process.exit(0);
      }
    } catch (error) {
      console.error(chalk.red('Installation failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Update existing XiaoMa Web installation')
  .option('--force', 'Force update, overwriting modified files')
  .option('--dry-run', 'Show what would be updated without making changes')
  .action(async () => {
    try {
      await installer.update();
    } catch (error) {
      console.error(chalk.red('Update failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list:expansions')
  .description('List available expansion packs')
  .action(async () => {
    try {
      await installer.listExpansionPacks();
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show installation status')
  .action(async () => {
    try {
      await installer.showStatus();
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('flatten')
  .description('Flatten codebase to XML format')
  .option('-i, --input <path>', 'Input directory to flatten', process.cwd())
  .option('-o, --output <path>', 'Output file path', 'flattened-codebase.xml')
  .action(async (options) => {
    try {
      await installer.flatten(options);
    } catch (error) {
      console.error(chalk.red('Flatten failed:'), error.message);
      process.exit(1);
    }
  });

async function promptInstallation() {
  
  // Display ASCII logo
  console.log(chalk.bold.cyan(`
██╗  ██╗██╗ █████╗  ██████╗ ███╗   ███╗ █████╗       ██╗    ██╗███████╗██████╗ 
╚██╗██╔╝██║██╔══██╗██╔═══██╗████╗ ████║██╔══██╗      ██║    ██║██╔════╝██╔══██╗
 ╚███╔╝ ██║███████║██║   ██║██╔████╔██║███████║█████╗██║ █╗ ██║█████╗  ██████╔╝
 ██╔██╗ ██║██╔══██║██║   ██║██║╚██╔╝██║██╔══██║╚════╝██║███╗██║██╔══╝  ██╔══██╗
██╔╝ ██╗██║██║  ██║╚██████╔╝██║ ╚═╝ ██║██║  ██║      ╚███╔███╔╝███████╗██████╔╝
╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝       ╚══╝╚══╝ ╚══════╝╚═════╝ 
  `));
  
  console.log(chalk.bold.magenta('🚀 Universal AI Agent Framework for Any Domain'));
  console.log(chalk.bold.blue(`✨ Installer v${version}\n`));

  const answers = {};

  // Ask for installation directory first
  const { directory } = await inquirer.prompt([
    {
      type: 'input',
      name: 'directory',
      message: 'Enter the full path to your project directory where XiaoMa Web should be installed:',
      default: process.cwd(),
      validate: (input) => {
        if (!input.trim()) {
          return 'Please enter a valid project path';
        }
        return true;
      }
    }
  ]);
  answers.directory = directory;

  // Detect existing installations
  const installDir = path.resolve(directory);
  const state = await installer.detectInstallationState(installDir);
  
  // Check for existing expansion packs
  const existingExpansionPacks = state.expansionPacks || {};
  
  // Get available expansion packs
  const availableExpansionPacks = await installer.getAvailableExpansionPacks();
  
  // Build choices list
  const choices = [];
  
  // Load core config to get short-title
  const coreConfigPath = path.join(__dirname, '..', '..', '..', 'xiaoma-core', 'core-config.yaml');
  const coreConfig = yaml.load(await fs.readFile(coreConfigPath, 'utf8'));
  const coreShortTitle = coreConfig['short-title'] || 'XiaoMa Agile Core System';
  
  // Add XiaoMa core option
  let bmadOptionText;
  if (state.type === 'v4_existing') {
    const currentVersion = state.manifest?.version || 'unknown';
    const newVersion = version; // Always use package.json version
    const versionInfo = currentVersion === newVersion 
      ? `(v${currentVersion} - reinstall)`
      : `(v${currentVersion} → v${newVersion})`;
    bmadOptionText = `Update ${coreShortTitle} ${versionInfo} .xiaoma-core`;
  } else {
    bmadOptionText = `${coreShortTitle} (v${version}) .xiaoma-core`;
  }
  
  choices.push({
    name: bmadOptionText,
    value: 'xiaoma-core',
    checked: true
  });
  
  // Add expansion pack options
  for (const pack of availableExpansionPacks) {
    const existing = existingExpansionPacks[pack.id];
    let packOptionText;
    
    if (existing) {
      const currentVersion = existing.manifest?.version || 'unknown';
      const newVersion = pack.version;
      const versionInfo = currentVersion === newVersion 
        ? `(v${currentVersion} - reinstall)`
        : `(v${currentVersion} → v${newVersion})`;
      packOptionText = `Update ${pack.shortTitle} ${versionInfo} .${pack.id}`;
    } else {
      packOptionText = `${pack.shortTitle} (v${pack.version}) .${pack.id}`;
    }
    
    choices.push({
      name: packOptionText,
      value: pack.id,
      checked: false
    });
  }
  
  // Ask what to install
  const { selectedItems } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedItems',
      message: 'Select what to install/update (use space to select, enter to continue):',
      choices: choices,
      validate: (selected) => {
        if (selected.length === 0) {
          return 'Please select at least one item to install';
        }
        return true;
      }
    }
  ]);
  
  // Process selections
  answers.installType = selectedItems.includes('xiaoma-core') ? 'full' : 'expansion-only';
  answers.expansionPacks = selectedItems.filter(item => item !== 'xiaoma-core');

  // Set default sharding configuration if installing XiaoMa core
  if (selectedItems.includes('xiaoma-core')) {
    console.log(chalk.cyan('\n📋 Document Organization Settings'));
    console.log(chalk.dim('Using recommended defaults: PRD and architecture will be sharded into multiple files.\n'));
    
    // Use default values without prompting
    answers.prdSharded = true;
    answers.architectureSharded = true;
  }

  // Ask for IDE configuration
  let ides = [];
  let ideSelectionComplete = false;
  
  while (!ideSelectionComplete) {
    console.log(chalk.cyan('\n🛠️  IDE Configuration'));
    console.log(chalk.bold.yellow.bgRed(' ⚠️  IMPORTANT: This is a MULTISELECT! Use SPACEBAR to toggle each IDE! '));
    console.log(chalk.bold.magenta('🔸 Use arrow keys to navigate'));
    console.log(chalk.bold.magenta('🔸 Use SPACEBAR to select/deselect IDEs'));
    console.log(chalk.bold.magenta('🔸 Press ENTER when finished selecting\n'));
    
    const ideResponse = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'ides',
        message: 'Which IDE(s) do you want to configure? (Select with SPACEBAR, confirm with ENTER):',
        choices: [
          { name: 'Cursor', value: 'cursor' },
          { name: 'Claude Code', value: 'claude-code' },
          { name: 'Trae', value: 'trae' }
        ]
      }
    ]);
    
    ides = ideResponse.ides;

    // Confirm no IDE selection if none selected
    if (ides.length === 0) {
      const { confirmNoIde } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmNoIde',
          message: chalk.red('⚠️  You have NOT selected any IDEs. This means NO IDE integration will be set up. Is this correct?'),
          default: false
        }
      ]);
      
      if (!confirmNoIde) {
        console.log(chalk.bold.red('\n🔄 Returning to IDE selection. Remember to use SPACEBAR to select IDEs!\n'));
        continue; // Go back to IDE selection only
      }
    }
    
    ideSelectionComplete = true;
  }

  // Use selected IDEs directly
  answers.ides = ides;


  // Set default web bundles configuration
  console.log(chalk.cyan('\n📦 Web Bundles Configuration'));
  console.log(chalk.dim('Using recommended defaults: Including all available web bundles (agents, teams, expansion packs).\n'));
  
  const includeWebBundles = true;
  const webBundleType = 'all';
  answers.webBundleType = webBundleType;

  // Use default web bundles directory
  const webBundlesDirectory = `${answers.directory}/web-bundles`;
  answers.webBundlesDirectory = webBundlesDirectory;
  answers.includeWebBundles = includeWebBundles;

  return answers;
}

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}