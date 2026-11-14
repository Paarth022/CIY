const MAX_PARSE_BYTES = 2_000_000;

export function parseGeneratedCode(text, defaultName = 'GeneratedPlugin') {
  const files = {};
  const safeText = typeof text === 'string' ? text.slice(0, MAX_PARSE_BYTES) : '';
  const regex = /===\s*(.*?)\s*===[\r\n]+([\s\S]*?)===\s*END\s*===/g;
  let match;
  let pluginName = defaultName;

  while ((match = regex.exec(safeText)) !== null) {
    const fileName = match[1].trim();
    let content = match[2].trim();

    if (content.startsWith('```')) {
      const nl = content.indexOf('\n');
      const lb = content.lastIndexOf('```');
      if (nl !== -1 && lb !== -1) {
        content = content.substring(nl + 1, lb).trim();
      }
    }

    // Zip-slip defence — reject unsafe filenames coming back from the model.
    if (!fileName || fileName.length > 256) continue;
    if (fileName.includes('..') || fileName.includes('\0')) continue;
    if (fileName.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(fileName)) continue;

    files[fileName] = content;

    if (fileName.endsWith('.java')) {
      const m = content.match(/public\s+(?:final\s+)?class\s+(\w+)/);
      if (m) pluginName = m[1];
    }
  }
  return { files, pluginName };
}
