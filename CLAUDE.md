# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mole Windows is a native Windows system cleaner & optimizer desktop app built with **Tauri 2** (Rust backend) + **React 19** (TypeScript frontend) + **Vite 7**. The app wraps [mole-core](https://github.com/tw93/Mole) PowerShell scripts with a modern glassmorphism dark UI using Fluent UI.

## Commands

```bash
# Development (starts Vite dev server + Tauri window)
npm run tauri dev

# Production build (outputs installer to src-tauri/target/release/bundle/)
npm run tauri build

# Frontend only (browser at http://localhost:1420, no Rust backend)
npm run dev

# Rust check (fast compile check, no binary)
cd src-tauri && cargo check

# TypeScript check
npx tsc --noEmit
```

## Architecture

### Two-Layer Architecture

```
┌─────────────────────────────────┐
│ Frontend (React/TS)             │
│ src/pages/*.tsx → invoke()      │
│ src/hooks/useSystemInfo.ts      │
│ src/components/ (Sidebar, etc.) │
├─────────────────────────────────┤
│ Tauri IPC Bridge                │
│ @tauri-apps/api/core → invoke() │
├─────────────────────────────────┤
│ Rust Backend (src-tauri/)       │
│ commands/system_info.rs (sysinfo│)
│ commands/mole_bridge.rs (PS1)   │
├─────────────────────────────────┤
│ mole-core (git submodule)       │
│ PowerShell scripts in bin/      │
└─────────────────────────────────┘
```

**Frontend → Backend**: All calls use `invoke<T>('command_name', { args })` from `@tauri-apps/api/core`. Types must be manually kept in sync between `src/types.ts` (camelCase) and Rust structs (snake_case via serde).

**Backend → mole-core**: `run_mole_script()` in `mole_bridge.rs` runs PowerShell scripts. All calls **must** be wrapped in `std::thread::spawn` to avoid blocking the Tauri async runtime.

### Registered Tauri Commands

Defined in `src-tauri/src/lib.rs`:
- `get_system_info` — Real-time CPU/RAM/disk/network via `sysinfo` crate
- `mole_clean` / `mole_optimize` / `mole_purge` / `mole_status` / `mole_analyze` — Bridge to mole-core PS1 scripts
- `list_installed_apps` — Windows registry query via PowerShell

### Frontend Pages

State-based routing in `App.tsx` via `PageId` enum. Each page is `src/pages/<Name>.tsx` with co-located CSS:

| Page | Component | Backend Command |
|------|-----------|-----------------|
| Dashboard | `Dashboard.tsx` | `get_system_info` |
| Cleaner | `Cleaner.tsx` | `mole_clean` |
| Uninstaller | `Uninstaller.tsx` | `list_installed_apps` |
| Optimizer | `Optimizer.tsx` | `mole_optimize` |
| Analyzer | `Analyzer.tsx` | `get_system_info` (via hook) |
| Monitor | `Monitor.tsx` | `get_system_info` (via hook) |
| Purger | `Purger.tsx` | `mole_purge` |
| Settings | `Settings.tsx` | (local state only) |

### Design System

All design tokens defined in `src/index.css` `:root` variables (`--color-*`, `--space-*`, `--radius-*`, `--font-size-*`). Shared classes: `.glass-card`, `.page`, `.page-desc`, `.result-output`, `.stagger-N` animations. Theme override for Fluent UI in `src/theme.ts`.

## Key Conventions

- **mole-core** is a git submodule at `./mole-core` (branch `windows`). After cloning: `git submodule update --init`
- **Blocking I/O**: Never call `run_mole_script()` or `Command::new()` directly in a `#[tauri::command]` async fn. Always wrap in `std::thread::spawn` + `handle.join()`.
- **Rust ↔ TS field mapping**: Rust uses `snake_case` (serde default), TypeScript uses `camelCase`. The `useSystemInfo` hook maps fields in `mapRustToTs()`.
- **CSS scope**: Shared styles go in `index.css`. Page-specific styles go in co-located `<Page>.css`.
- **Fluent UI**: Using `@fluentui/react-components` v9 with custom dark theme. Icons from `@fluentui/react-icons`.
