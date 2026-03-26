# Korean IME for Claude Code CLI

Fixes Korean IME input issues in VSCode/Cursor terminal when using Claude Code CLI.

![Korean IME for Claude](./screenshots/demo.png)

## Problem

Korean IME composition breaks in Cursor/VSCode integrated terminal — characters get duplicated or corrupted when typing Korean in Claude Code CLI.

## Solution

A dedicated input panel at the bottom of the editor. Type Korean in the panel, press Enter, and the fully composed text is sent to the terminal. No more broken characters.

## Features

- **Korean Input Panel** — Bottom panel with proper IME composition support
- **Terminal Integration** — Sends composed text to the active terminal on Enter
- **Mode Switching** — `Shift+Tab` sends mode cycle command to Claude Code CLI
- **Multiline Support** — `Shift+Enter` for line breaks
- **Theme Sync** — Automatically matches terminal background color

## Quick Start

Available on **Cursor** marketplace.

1. Search `jamesoh.korean-ime-terminal` in the Extensions panel and install
2. The **Korean IME** panel appears in the bottom pane alongside Terminal, Problems, etc.
3. Drag the panel tab to reposition it wherever you prefer (e.g., next to the terminal)
4. Open Claude Code CLI in the terminal
5. Type Korean in the **Korean IME** panel
6. Press `Enter` to send to terminal

## Keybindings

| Key | Action |
|---|---|
| `Enter` | Send text to terminal |
| `Shift+Enter` | Insert line break |
| `Shift+Tab` | Cycle Claude Code CLI mode |


## Settings

| Setting | Default | Description |
|---|---|---|
| `koreanIme.sendNewline` | `true` | Automatically sends Enter (newline) after input |

## License

MIT
