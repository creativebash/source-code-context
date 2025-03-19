# Source Code Context

A Visual Studio Code extension that generates a comprehensive context file of your project's source code for AI tools.

## Features

- Creates a single file containing your project structure and file contents
- Configurable exclusions for directories, files, and wildcards
- Filters out binary files and respects file size limits
- Optional extension-based filtering for relevant code files
- Easily shareable output for AI tools

## Usage

1. Open the Command Palette (Ctrl+Shift+P)
2. Type and select "Generate Source Code Context"
3. The extension will create a file (default: `source_code_context.txt`) in your workspace root
4. The file will be automatically opened once generated

## Extension Settings

This extension contributes the following settings:

- `sourceCodeContext.outputFile`: Name of the output file (default: "project_context.txt")
- `sourceCodeContext.excludeDirs`: Directories to exclude (default includes `node_modules`, `venv`, `vendor`, `target`, `dist`, `.git`, etc.)
- `sourceCodeContext.excludeFiles`: Files to exclude, supports wildcards (default includes `package-lock.json`, `*.log`, `*.png`, etc.)
- `sourceCodeContext.includeExtensions`: File extensions to include (default: [".js", ".ts", ".py", ".java", ".cpp", ".c", ".cs", ".go", ".rb", ".php"])
- `sourceCodeContext.maxFileSize`: Maximum file size in KB to include (default: 1024, set to 0 for no limit)

## Notes

- Binary files (e.g., `.png`, `.pdf`, `.exe`) are automatically omitted.
- Use wildcards (e.g., `*.log`) in `excludeFiles` to exclude patterns.
- Cancel the generation process via the notification if it takes too long.
