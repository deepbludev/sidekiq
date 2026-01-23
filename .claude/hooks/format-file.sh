#!/bin/bash
# PostToolUse hook: Auto-format files after Edit or Write operations
# Reads JSON input from stdin and extracts the file path

FILE_PATH=$(cat | jq -r '.tool_input.file_path // empty')

if [ -n "$FILE_PATH" ] && [ -f "$FILE_PATH" ]; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0
  pnpm prettier --write "$FILE_PATH" 2>/dev/null || true
fi
