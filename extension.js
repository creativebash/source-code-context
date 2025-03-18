const vscode = require("vscode");
const fs = require("fs").promises;
const path = require("path");
const minimatch = require("minimatch");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "source-code-context.generate",
    async function () {
      try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          vscode.window.showErrorMessage("No workspace folder open");
          return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const config = vscode.workspace.getConfiguration("sourceCodeContext");
        const outputFile = config.get("outputFile");
        const excludeDirs = config.get("excludeDirs");
        const excludeFiles = config.get("excludeFiles");
        const includeExtensions = config.get("includeExtensions");
        const maxFileSizeKB = config.get("maxFileSize") * 1024; // Convert to bytes

        const exclusions = {
          dirs: excludeDirs,
          files: excludeFiles,
        };

        // Show progress notification
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Generating Source Code Context",
            cancellable: true,
          },
          async (progress, token) => {
            token.onCancellationRequested(() => {
              throw new Error("Generation cancelled by user");
            });
            progress.report({ increment: 0 });

            const outputPath = path.join(rootPath, outputFile);
            await generateProjectContext(
              rootPath,
              outputPath,
              exclusions,
              includeExtensions,
              maxFileSizeKB
            );

            progress.report({ increment: 100 });
          }
        );

        vscode.window.showInformationMessage(
          `Source code context generated to ${outputFile}`
        );

        const document = await vscode.workspace.openTextDocument(
          path.join(rootPath, outputFile)
        );
        await vscode.window.showTextDocument(document);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error generating source code context: ${error.message}`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function generateProjectContext(
  dir,
  outputFile,
  exclusions = { dirs: [], files: [] },
  includeExtensions = [],
  maxFileSize = 0
) {
  let output = "Project File Tree:\n";

  async function buildTree(currentDir, prefix = "") {
    const files = await fs.readdir(currentDir, { withFileTypes: true });
    const filteredFiles = files.filter(
      (file) =>
        !isExcluded(path.join(currentDir, file.name), dir, exclusions) &&
        (file.isDirectory() || shouldIncludeFile(file.name, includeExtensions))
    );

    for (let i = 0; i < filteredFiles.length; i++) {
      const file = filteredFiles[i];
      const fullPath = path.join(currentDir, file.name);
      const isLast = i === filteredFiles.length - 1;
      output += `${prefix}${isLast ? "└──" : "├──"} ${file.name}\n`;
      if (file.isDirectory()) {
        await buildTree(fullPath, prefix + (isLast ? "    " : "│   "));
      }
    }
  }

  await buildTree(dir);
  output += "\nFile Contents:\n";

  async function appendContents(currentDir) {
    const files = await fs.readdir(currentDir, { withFileTypes: true });
    const filteredFiles = files.filter(
      (file) =>
        !isExcluded(path.join(currentDir, file.name), dir, exclusions) &&
        (file.isDirectory() || shouldIncludeFile(file.name, includeExtensions))
    );

    for (const file of filteredFiles) {
      const fullPath = path.join(currentDir, file.name);
      if (file.isDirectory()) {
        await appendContents(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        if (maxFileSize > 0 && stats.size > maxFileSize) {
          output += `\n==== ${path.relative(
            dir,
            fullPath
          )} ====\n[File exceeds size limit: ${stats.size} bytes]\n`;
        } else if (await isTextFile(fullPath)) {
          const content = await fs.readFile(fullPath, "utf-8");
          output += `\n==== ${path.relative(dir, fullPath)} (Size: ${
            stats.size
          } bytes) ====\n${content}\n`;
        } else {
          output += `\n==== ${path.relative(
            dir,
            fullPath
          )} ====\n[Binary file omitted]\n`;
        }
      }
    }
  }

  await appendContents(dir);
  await fs.writeFile(outputFile, output);
}

function isExcluded(filePath, rootDir, exclusions) {
  const relativePath = path.relative(rootDir, filePath);
  return (
    exclusions.dirs.some((dir) => relativePath.startsWith(dir)) ||
    exclusions.files.some((pattern) => minimatch(relativePath, pattern))
  );
}

function shouldIncludeFile(fileName, includeExtensions) {
  return (
    includeExtensions.length === 0 ||
    includeExtensions.some((ext) => fileName.endsWith(ext))
  );
}

async function isTextFile(filePath) {
  const binaryExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".mp4",
    ".mp3",
    ".avi",
    ".gif",
    ".bmp",
    ".ico",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".exe",
    ".dll",
    ".bin",
    ".o",
    ".so",
  ];
  if (binaryExtensions.some((ext) => filePath.endsWith(ext))) return false;

  const buffer = await fs.readFile(filePath, { encoding: null });
  // Fix for the deprecated Buffer.slice method
  const sampleBuffer = new Uint8Array(buffer.buffer, buffer.byteOffset, Math.min(512, buffer.length));
  const sample = new TextDecoder().decode(sampleBuffer);
  return !/[\x00-\x08\x0E-\x1F]/.test(sample); // Check for control characters
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};