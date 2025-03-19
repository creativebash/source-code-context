const fs = require("fs").promises;
const path = require("path");

async function generateProjectContext(
  dir,
  outputFile,
  exclusions = { dirs: [], files: [] }
) {
  let output = "Project File Tree:\n";

  // Generate tree structure, excluding specified directories and files
  async function buildTree(currentDir, prefix = "") {
    const files = await fs.readdir(currentDir, { withFileTypes: true });
    const filteredFiles = files.filter(
      (file) =>
        !(file.isDirectory() && exclusions.dirs.includes(file.name)) &&
        !(file.isFile() && exclusions.files.includes(file.name))
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

  // Append file contents, excluding specified directories and files
  async function appendContents(currentDir) {
    const files = await fs.readdir(currentDir, { withFileTypes: true });
    const filteredFiles = files.filter(
      (file) =>
        !(file.isDirectory() && exclusions.dirs.includes(file.name)) &&
        !(file.isFile() && exclusions.files.includes(file.name))
    );

    for (const file of filteredFiles) {
      const fullPath = path.join(currentDir, file.name);
      if (file.isDirectory()) {
        await appendContents(fullPath);
      } else {
        const content = await fs.readFile(fullPath, "utf-8");
        output += `\n==== ${path.relative(dir, fullPath)} ====\n${content}\n`;
      }
    }
  }

  await appendContents(dir);
  await fs.writeFile(outputFile, output);
}

// Define exclusions as a single object
const projectExclusions = {
  dirs: ["node_modules", "dist", ".git"],
  files: [
    "package-lock.json",
    ".gitignore",
    "project_context.txt",
    "generateCtx.js",
    "source_code_context.txt",
    "source_code_context-0.1.0.vsix",
  ],
};

// Example usage: pass the exclusions object
generateProjectContext("./", "source_code_context.txt", projectExclusions)
  .then(() => console.log("Done!"))
  .catch((err) => console.error(err));
