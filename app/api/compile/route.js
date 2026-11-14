import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { verifyToken } from '@/lib/server/session';
import { captureServerError } from '@/lib/server/sentry';

// Request limits
const MAX_COMPILE_FILES = 80;
const MAX_COMPILE_BYTES = 5_000_000; // 5MB total size limit for incoming text files

function sanitizePomXml(content) {
  if (typeof content !== 'string') return '';

  // 1. Remove all XML comments to prevent comment-nested evasion tricks
  let sanitized = content.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Locate all plugin declarations and wipe any that are not compiler or resources
  const pluginRegex = /<plugin>([\s\S]*?)<\/plugin>/gi;
  sanitized = sanitized.replace(pluginRegex, (match, blockContent) => {
    const artifactIdMatch = /<artifactId>([\s\S]*?)<\/artifactId>/i.exec(blockContent);
    if (!artifactIdMatch) return ''; // Strip invalid/empty plugin constructs
    
    const artifactId = artifactIdMatch[1].replace(/\s/g, '').toLowerCase();
    
    // Strict Whitelist
    if (artifactId !== 'maven-compiler-plugin' && artifactId !== 'maven-resources-plugin') {
      return '';
    }
    
    // Strip executions or configurations inside whitelisted plugin to guarantee inertness
    let cleanBlock = blockContent
      .replace(/<executions>[\s\S]*?<\/executions>/gi, '')
      .replace(/<execution>[\s\S]*?<\/execution>/gi, '')
      .replace(/<configuration>[\s\S]*?<\/configuration>/gi, '')
      .replace(/<goals>[\s\S]*?<\/goals>/gi, '')
      .replace(/<goal>[\s\S]*?<\/goal>/gi, '');
      
    return `<plugin>${cleanBlock}</plugin>`;
  });

  // 3. Purge any stray hazardous tags or wrappers globally
  const hazardousTags = [
    'executions', 'execution', 'configuration', 'goals', 'goal',
    'exec', 'executable', 'argument', 'arguments', 'system', 'command', 'script', 'ant', 'groovy'
  ];
  
  for (const tag of hazardousTags) {
    const tagRegex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(tagRegex, '');
    
    const singleTagRegex = new RegExp(`<${tag}[^>]*\\/>`, 'gi');
    sanitized = sanitized.replace(singleTagRegex, '');
  }

  return sanitized;
}

function checkPomXmlSecurity(content) {
  if (typeof content !== 'string') return 'Invalid pom.xml format.';
  
  const lower = content.toLowerCase();
  const forbidden = [
    'exec-maven-plugin',
    'maven-antrun-plugin',
    'groovy-maven-plugin',
    'gmavenplus-plugin',
    'exec',
    'ant',
    'groovy',
    'system',
    'command',
    'script',
    '<executable',
    '</executable',
    '<argument',
    '</argument',
  ];

  for (const term of forbidden) {
    if (lower.includes(term)) {
      return `Forbidden keyword or tag "${term}" detected in pom.xml. Only standard compiling structures are allowed.`;
    }
  }

  // Verify that if any plugin block exists, it only specifies whitelisted compilation plugins
  const pluginBlockRegex = /<plugin>([\s\S]*?)<\/plugin>/g;
  let blockMatch;
  while ((blockMatch = pluginBlockRegex.exec(content)) !== null) {
    const blockContent = blockMatch[1];
    const idMatch = /<artifactId>([^<]+)<\/artifactId>/.exec(blockContent);
    if (idMatch) {
      const artId = idMatch[1].trim().toLowerCase();
      if (artId !== 'maven-compiler-plugin' && artId !== 'maven-resources-plugin') {
        return `Unauthorized build plugin "${artId}" detected in pom.xml. Only standard compiler/resources plugins are allowed.`;
      }
    }
  }

  return null;
}

export async function POST(req) {
  const tempDir = path.join(process.cwd(), 'scratch', 'builds', crypto.randomUUID());
  
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    }

    const { files, token, pluginName } = body;

    if (!files || typeof files !== 'object' || !token || typeof token !== 'string') {
      return Response.json({ success: false, error: 'Missing required compile parameters.' }, { status: 400 });
    }

    // Security check: Actively sanitize pom.xml against arbitrary execution injection
    if (files['pom.xml']) {
      // 1. Actively strip out non-whitelisted compilation elements
      files['pom.xml'] = sanitizePomXml(files['pom.xml']);
      
      // 2. Perform secondary assertion validator check (Defense-in-Depth)
      const pomError = checkPomXmlSecurity(files['pom.xml']);
      if (pomError) {
        return Response.json(
          { success: false, error: `Security violation: ${pomError}`, code: 'security_violation' },
          { status: 400 }
        );
      }
    }

    // 1. Verify signed session token — check plan level
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return Response.json(
        { success: false, error: 'Your session expired — please sign in again.', code: 'session_expired' },
        { status: 401 }
      );
    }

    // Allow free registered users to compile, requiring at least a valid user session
    if (!payload.uid) {
      return Response.json(
        {
          success: false,
          error: 'Authentication required. Please sign in to compile plugins.',
          code: 'unauthorized'
        },
        { status: 401 }
      );
    }

    // 2. Validate files payload (count, sizing, safety)
    const fileEntries = Object.entries(files);
    if (fileEntries.length === 0) {
      return Response.json({ success: false, error: 'No files provided to compile.' }, { status: 400 });
    }
    if (fileEntries.length > MAX_COMPILE_FILES) {
      return Response.json({ success: false, error: 'Too many files to compile.' }, { status: 400 });
    }

    let totalBytes = 0;
    for (const [filePath, content] of fileEntries) {
      if (typeof filePath !== 'string' || typeof content !== 'string') {
        return Response.json({ success: false, error: 'Invalid file entry formats.' }, { status: 400 });
      }
      totalBytes += content.length;
    }

    if (totalBytes > MAX_COMPILE_BYTES) {
      return Response.json({ success: false, error: 'Files exceed total compile size limit.' }, { status: 400 });
    }

    // 3. Write files safely inside sandboxed scratch directory
    fs.mkdirSync(tempDir, { recursive: true });

    for (const [filePath, content] of fileEntries) {
      // Defense in depth: zip-slip traversal protection
      if (filePath.includes('..') || filePath.includes('\0')) {
        return Response.json({ success: false, error: 'Security violation: directory traversal detected.' }, { status: 400 });
      }
      if (filePath.startsWith('/') || path.isAbsolute(filePath)) {
        return Response.json({ success: false, error: 'Security violation: absolute paths not allowed.' }, { status: 400 });
      }

      const resolvedPath = path.resolve(tempDir, filePath);
      if (!resolvedPath.startsWith(tempDir)) {
        return Response.json({ success: false, error: 'Security violation: path escapes build context.' }, { status: 400 });
      }

      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
      fs.writeFileSync(resolvedPath, content, 'utf8');
    }

    // 4. Run programmatic Maven compilation
    const mvnPromise = new Promise((resolve) => {
      // Using Windows-safe cmd/powershell shell compatibility through shell: true
      exec('mvn clean package', { cwd: tempDir, timeout: 50000, shell: true }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          exitCode: error ? error.code : 0,
          stdout: stdout || '',
          stderr: stderr || '',
        });
      });
    });

    const buildResult = await mvnPromise;

    // 5. If compilation fails, catch errors and return compiler logs for user-review/AI debug
    if (!buildResult.success) {
      return Response.json({
        success: false,
        error: 'Maven compilation failed. Review the compiler errors below.',
        code: 'compilation_failed',
        logs: buildResult.stdout + '\n' + buildResult.stderr
      }, { status: 422 });
    }

    // 6. Find compiled JAR and encode to base64
    const targetDir = path.join(tempDir, 'target');
    if (!fs.existsSync(targetDir)) {
      return Response.json({
        success: false,
        error: 'Maven claimed success, but build target folder does not exist.',
        code: 'no_target_folder'
      }, { status: 500 });
    }

    const targetFiles = fs.readdirSync(targetDir);
    const compiledJar = targetFiles.find(
      (f) => f.endsWith('.jar') && !f.endsWith('-sources.jar') && !f.startsWith('original-')
    );

    if (!compiledJar) {
      return Response.json({
        success: false,
        error: 'Compilation succeeded, but no final compiled JAR was found in target folder.',
        code: 'no_jar_found'
      }, { status: 500 });
    }

    const jarPath = path.join(targetDir, compiledJar);
    const jarBuffer = fs.readFileSync(jarPath);
    const jarBase64 = jarBuffer.toString('base64');

    return Response.json({
      success: true,
      jar: jarBase64,
      filename: compiledJar,
      pluginName: pluginName || compiledJar.replace('.jar', '')
    });

  } catch (error) {
    captureServerError(error, { where: 'compile:post' });
    return Response.json(
      { success: false, error: 'Internal compiler error occurred. Please try again.' },
      { status: 500 }
    );
  } finally {
    // 7. Ensure absolute directory cleanup to prevent disk bloat
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      captureServerError(cleanupError, { where: 'compile:cleanup' });
    }
  }
}
