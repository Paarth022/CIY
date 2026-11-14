function parsePluginYml(ymlContent) {
  const result = {
    name: 'CraftedPlugin',
    version: '1.0.0',
    description: 'A custom Minecraft plugin created using Craft It Yourself.',
    commands: [],
    permissions: []
  };

  if (!ymlContent) return result;

  const lines = ymlContent.split('\n');
  let currentSection = null;
  let currentItem = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // Matches root properties: name, version, description, commands:, permissions:
    const rootMatch = /^([a-zA-Z0-9-]+)\s*:\s*(.*)$/.exec(line);
    if (rootMatch) {
      const key = rootMatch[1].toLowerCase();
      const val = rootMatch[2].trim();
      
      if (key === 'name') result.name = val.replace(/['"]/g, '');
      else if (key === 'version') result.version = val.replace(/['"]/g, '');
      else if (key === 'description') result.description = val.replace(/['"]/g, '');
      else if (key === 'commands') { currentSection = 'commands'; currentItem = null; }
      else if (key === 'permissions') { currentSection = 'permissions'; currentItem = null; }
      else { currentSection = null; }
      return;
    }

    // Parse commands or permissions subsections
    if (currentSection === 'commands') {
      const cmdMatch = /^ {2}([a-zA-Z0-9-]+)\s*:\s*(.*)$/.exec(line);
      if (cmdMatch) {
        currentItem = { name: cmdMatch[1], description: '', usage: '', aliases: '' };
        result.commands.push(currentItem);
        return;
      }
      
      if (currentItem) {
        const propMatch = /^ {4}([a-zA-Z0-9-]+)\s*:\s*(.*)$/.exec(line);
        if (propMatch) {
          const prop = propMatch[1].toLowerCase();
          const val = propMatch[2].trim().replace(/['"\[\]]/g, '');
          if (prop === 'description') currentItem.description = val;
          else if (prop === 'usage') currentItem.usage = val;
          else if (prop === 'aliases') currentItem.aliases = val;
        }
      }
    } else if (currentSection === 'permissions') {
      const permMatch = /^ {2}([a-zA-Z0-9.-_*]+)\s*:\s*(.*)$/.exec(line);
      if (permMatch) {
        currentItem = { name: permMatch[1], description: '', default: 'op' };
        result.permissions.push(currentItem);
        return;
      }
      
      if (currentItem) {
        const propMatch = /^ {4}([a-zA-Z0-9-]+)\s*:\s*(.*)$/.exec(line);
        if (propMatch) {
          const prop = propMatch[1].toLowerCase();
          const val = propMatch[2].trim().replace(/['"]/g, '');
          if (prop === 'description') currentItem.description = val;
          else if (prop === 'default') currentItem.default = val;
        }
      }
    }
  });

  return result;
}

export function generateReadme(files) {
  const ymlContent = files['plugin.yml'] || files['src/main/resources/plugin.yml'];
  const metadata = parsePluginYml(ymlContent);
  
  let md = `# 📦 ${metadata.name} (v${metadata.version})\n\n`;
  md += `> ${metadata.description}\n\n`;
  md += `This plugin was professionally crafted using the **Craft It Yourself (CIY)** platform.\n\n`;
  
  md += `## ⚡ Features & Capabilities\n\n`;
  md += `- **Automated Thread Safety**: Engineered with async task schedules preventing server thread locks.\n`;
  md += `- **Adventure API Messaging**: Supports modern rich-text, MiniMessage gradients, colors, and styling overlays.\n`;
  md += `- **Dynamic Configuration**: Built with externalized, hot-reloadable \`config.yml\` handles.\n`;
  md += `- **Optimized Events**: Event listeners tuned with priority checking and performance optimizations.\n\n`;
  
  if (metadata.commands.length > 0) {
    md += `## 💻 Commands\n\n`;
    md += `| Command | Description | Usage | Aliases |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    metadata.commands.forEach((cmd) => {
      md += `| \`/${cmd.name}\` | ${cmd.description || 'No description provided.'} | \`${cmd.usage || '/' + cmd.name}\` | ${cmd.aliases ? `\`${cmd.aliases}\`` : 'None'} |\n`;
    });
    md += `\n`;
  }
  
  if (metadata.permissions.length > 0) {
    md += `## 🛡️ Permissions\n\n`;
    md += `| Permission Node | Description | Default Tier |\n`;
    md += `| :--- | :--- | :--- |\n`;
    metadata.permissions.forEach((perm) => {
      md += `| \`${perm.name}\` | ${perm.description || 'Allows standard usage.'} | \`${perm.default}\` |\n`;
    });
    md += `\n`;
  }
  
  md += `## 🛠️ Installation & Setup Guide\n\n`;
  md += `1. **Compile the Binary**: Click **Compile JAR** in the Crafting Station to build the binary.\n`;
  md += `2. **Upload to Server**: Place the downloaded \`${metadata.name.toLowerCase()}-${metadata.version}.jar\` (or the compiled output) into your Minecraft server's \`plugins/\` directory.\n`;
  md += `3. **Start/Reload Server**: Restart your Paper server or run \`/minecraft:reload confirm\` to enable the plugin.\n`;
  md += `4. **Configure Options**: Modify the generated \`plugins/${metadata.name}/config.yml\` file to customize properties, and reload changes dynamically.\n\n`;
  
  md += `---  \n`;
  md += `*Crafted with 💖 by [Craft It Yourself (ciy.gg)](https://ciy.gg)*\n`;
  
  return md;
}

export function applyWatermarks(files, planId) {
  const updatedFiles = { ...files };

  // 1. Compile high-fidelity README.md programmatically (Zero token consumption)
  updatedFiles['README.md'] = generateReadme(updatedFiles);
  // Delete any raw setups or readmes to prevent clutter
  delete updatedFiles['SETUP.md'];

  if (planId === 'master') {
    return updatedFiles; // Master plan gets zero watermarks on code/configs!
  }

  // 2. Add comment headers and console banner logs to Java files for free plans
  Object.keys(updatedFiles).forEach((filePath) => {
    if (filePath.endsWith('.java')) {
      const header = 
        `/*\n` +
        ` * ====================================================================\n` +
        ` * Generated by Craft It Yourself (https://ciy.gg)\n` +
        ` * This plugin is running on the FREE/Hobbyist edition of CIY.\n` +
        ` * Upgrade to our MASTER plan to remove this watermark and customize branding!\n` +
        ` * ====================================================================\n` +
        ` */\n\n`;
      
      let content = updatedFiles[filePath];
      
      // Inject console watermark inside onEnable()
      const onEnableRegex = /(public\s+void\s+onEnable\s*\(\s*\)\s*\{)/i;
      if (onEnableRegex.test(content)) {
        const consoleLog = 
          `\n        getLogger().info("=================================================");\n` +
          `        getLogger().info(" Crafted with Craft It Yourself (https://ciy.gg) ");\n` +
          `        getLogger().info(" Upgrade to MASTER plan to remove this banner! ");\n` +
          `        getLogger().info("=================================================");`;
        
        content = content.replace(onEnableRegex, `$1${consoleLog}`);
      }
      
      updatedFiles[filePath] = header + content;
    }
  });

  // 3. Add watermark to plugin.yml
  if (updatedFiles['plugin.yml']) {
    const watermarkYml = 
      `# =======================================================\n` +
      `# Crafted with Craft It Yourself (https://ciy.gg)\n` +
      `# Upgrade to our MASTER plan to remove this signature!\n` +
      `# =======================================================\n`;
    
    let content = updatedFiles['plugin.yml'];
    // Append/Overwrite description and website metadata
    content = content.replace(/^website:.*$/gm, '');
    content = content.replace(/^description:.*$/gm, '');
    
    content = watermarkYml + content.trim() + 
      `\nwebsite: https://ciy.gg\ndescription: Crafted via Craft It Yourself (ciy.gg). Upgrade to MASTER to customize.\n`;
      
    updatedFiles['plugin.yml'] = content;
  }

  // 4. Add watermark to README.md
  if (updatedFiles['README.md']) {
    const readmeHeader = 
      `# ⚡ Crafted via Craft It Yourself (ciy.gg) — FREE EDITION\n` +
      `> ⚠️ **NOTICE**: This plugin was generated using a Free/Hobbyist plan. To remove this header and unlock custom branding, upgrade to our **MASTER** plan at [ciy.gg](https://ciy.gg)!\n\n` +
      `---\n\n`;
      
    const readmeFooter = 
      `\n\n---\n` +
      `*Plugin crafted with 💖 using the Free Edition of [Craft It Yourself (ciy.gg)](https://ciy.gg). Upgrade to **MASTER** to unlock custom branding and remove all watermarks.*`;
      
    updatedFiles['README.md'] = readmeHeader + updatedFiles['README.md'] + readmeFooter;
  }

  return updatedFiles;
}
