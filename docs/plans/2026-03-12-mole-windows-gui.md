# Mole Windows GUI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a beautiful Windows GUI wrapper around the Mole CLI system cleaner using Tauri v2 + React + Fluent UI v9.

**Architecture:** Tauri v2 Rust backend calls Mole's existing PowerShell scripts (from the `windows` branch), parses structured output, and sends results to a React frontend via IPC commands. The frontend uses Microsoft Fluent UI v9 components for a native Windows 11 look and feel with glassmorphism effects.

**Tech Stack:** Tauri v2, Rust, React 18, TypeScript, Fluent UI React v9 (`@fluentui/react-components`), Vite, PowerShell 5.1+

---

## Task 1: Clone Mole Windows Branch as Submodule

**Files:**
- Create: `d:\OtherProject\mine\mole_windows\.gitmodules`
- Create: `d:\OtherProject\mine\mole_windows\mole-core\` (submodule directory)

**Step 1: Initialize git repository**

```bash
cd d:\OtherProject\mine\mole_windows
git init
```

**Step 2: Add Mole windows branch as a git submodule**

```bash
git submodule add -b windows https://github.com/tw93/Mole.git mole-core
```

**Step 3: Verify submodule was cloned correctly**

Run: `dir mole-core\bin`
Expected: Should list `clean.ps1`, `uninstall.ps1`, `optimize.ps1`, `purge.ps1`, `analyze.ps1`, `status.ps1`

**Step 4: Commit**

```bash
git add .gitmodules mole-core
git commit -m "chore: add mole windows branch as git submodule"
```

---

## Task 2: Scaffold Tauri v2 + React + TypeScript Project

**Files:**
- Create: `d:\OtherProject\mine\mole_windows\package.json`
- Create: `d:\OtherProject\mine\mole_windows\src-tauri\` (Tauri backend directory)
- Create: `d:\OtherProject\mine\mole_windows\src\` (React frontend directory)
- Create: `d:\OtherProject\mine\mole_windows\vite.config.ts`

**Step 1: Create the Tauri v2 project**

```powershell
cd d:\OtherProject\mine\mole_windows
npm create tauri-app@latest . -- --template react-ts --manager npm
```

> If prompted interactively, select: React, TypeScript, npm.
> If the directory is not empty, the scaffolder may warn. Use `--force` if needed, or scaffold into a temp directory and move files.

**Step 2: Install dependencies**

```powershell
cd d:\OtherProject\mine\mole_windows
npm install
```

**Step 3: Verify Tauri dev server launches**

```powershell
npm run tauri dev
```

Expected: A window opens showing the default React + Tauri starter app. Close it after confirming.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Tauri v2 + React + TypeScript project"
```

---

## Task 3: Install and Configure Tauri Shell Plugin

**Files:**
- Modify: `d:\OtherProject\mine\mole_windows\src-tauri\Cargo.toml`
- Modify: `d:\OtherProject\mine\mole_windows\src-tauri\src\lib.rs` (or `main.rs`)
- Create/Modify: `d:\OtherProject\mine\mole_windows\src-tauri\capabilities\default.json`

**Step 1: Add the shell plugin to Cargo.toml**

```powershell
cd d:\OtherProject\mine\mole_windows\src-tauri
cargo add tauri-plugin-shell
```

**Step 2: Register the plugin in the Tauri builder**

In `src-tauri/src/lib.rs` (or `main.rs`), add the plugin:

```rust
// Add this line to the builder chain
.plugin(tauri_plugin_shell::init())
```

The full builder should look like:

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 3: Add npm shell plugin package**

```powershell
cd d:\OtherProject\mine\mole_windows
npm install @tauri-apps/plugin-shell
```

**Step 4: Configure shell permissions**

Create or modify `src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "shell:allow-execute",
      "allow": [
        {
          "name": "powershell",
          "cmd": "powershell",
          "args": [
            "-ExecutionPolicy", "Bypass",
            "-NoProfile",
            "-File",
            { "validator": ".*\\.ps1$" }
          ],
          "sidecar": false
        }
      ]
    }
  ]
}
```

**Step 5: Verify the build still compiles**

```powershell
cd d:\OtherProject\mine\mole_windows
npm run tauri build -- --debug
```

Expected: Build succeeds without errors.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Tauri shell plugin for PowerShell execution"
```

---

## Task 4: Install Fluent UI v9 and Set Up Theme

**Files:**
- Modify: `d:\OtherProject\mine\mole_windows\package.json`
- Create: `d:\OtherProject\mine\mole_windows\src\theme.ts`
- Modify: `d:\OtherProject\mine\mole_windows\src\App.tsx`
- Modify: `d:\OtherProject\mine\mole_windows\src\index.css`

**Step 1: Install Fluent UI React v9**

```powershell
cd d:\OtherProject\mine\mole_windows
npm install @fluentui/react-components @fluentui/react-icons
```

**Step 2: Create the theme file**

Create `src/theme.ts`:

```typescript
import {
  createDarkTheme,
  createLightTheme,
  BrandVariants,
} from '@fluentui/react-components';

const moleBrand: BrandVariants = {
  10: '#020305',
  20: '#111723',
  30: '#16263D',
  40: '#193253',
  50: '#1B3F6A',
  60: '#1B4C82',
  70: '#18599B',
  80: '#1267B4',
  90: '#3174C2',
  100: '#4F82C8',
  110: '#6790CE',
  120: '#7E9ED5',
  130: '#94ACDB',
  140: '#A9BBE1',
  150: '#BEC9E8',
  160: '#D2D8EE',
};

export const moleLightTheme = createLightTheme(moleBrand);
export const moleDarkTheme = createDarkTheme(moleBrand);
```

**Step 3: Wrap App with FluentProvider**

Replace `src/App.tsx` with:

```tsx
import { FluentProvider } from '@fluentui/react-components';
import { moleDarkTheme } from './theme';
import './index.css';

function App() {
  return (
    <FluentProvider theme={moleDarkTheme}>
      <div className="app-container">
        <h1>🐹 Mole for Windows</h1>
        <p>System cleaner & optimizer</p>
      </div>
    </FluentProvider>
  );
}

export default App;
```

**Step 4: Set up base CSS**

Replace `src/index.css` with:

```css
:root {
  font-family: 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif;
  color-scheme: dark;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
}

/* Glassmorphism card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}
```

**Step 5: Verify the themed app renders**

```powershell
npm run tauri dev
```

Expected: Window shows "🐹 Mole for Windows" text with dark Fluent UI theme styling.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Fluent UI v9 dark theme with glassmorphism base CSS"
```

---

## Task 5: Build Sidebar Navigation + Page Layout

**Files:**
- Create: `d:\OtherProject\mine\mole_windows\src\components\Sidebar.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\components\Sidebar.css`
- Create: `d:\OtherProject\mine\mole_windows\src\pages\Dashboard.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\pages\Cleaner.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\pages\Uninstaller.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\pages\Optimizer.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\pages\Analyzer.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\pages\Monitor.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\pages\Purger.tsx`
- Modify: `d:\OtherProject\mine\mole_windows\src\App.tsx`

**Step 1: Create the Sidebar component**

Create `src/components/Sidebar.tsx`:

```tsx
import {
  Home24Regular,
  Delete24Regular,
  AppsList24Regular,
  Flash24Regular,
  HardDrive24Regular,
  PulseSquare24Regular,
  FolderZip24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import './Sidebar.css';

export type PageId =
  | 'dashboard'
  | 'cleaner'
  | 'uninstaller'
  | 'optimizer'
  | 'analyzer'
  | 'monitor'
  | 'purger';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '總覽', icon: <Home24Regular /> },
  { id: 'cleaner', label: '深度清理', icon: <Delete24Regular /> },
  { id: 'uninstaller', label: '解安裝', icon: <AppsList24Regular /> },
  { id: 'optimizer', label: '優化', icon: <Flash24Regular /> },
  { id: 'analyzer', label: '磁碟分析', icon: <HardDrive24Regular /> },
  { id: 'monitor', label: '系統監控', icon: <PulseSquare24Regular /> },
  { id: 'purger', label: '構建清理', icon: <FolderZip24Regular /> },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">🐹</span>
        <span className="sidebar-title">Mole</span>
      </div>
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="sidebar-item">
          <span className="sidebar-item-icon"><Settings24Regular /></span>
          <span className="sidebar-item-label">設定</span>
        </button>
      </div>
    </nav>
  );
}
```

**Step 2: Create Sidebar CSS**

Create `src/components/Sidebar.css`:

```css
.sidebar {
  width: 220px;
  min-width: 220px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(30px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 8px;
  gap: 4px;
  -webkit-app-region: drag;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 20px;
}

.sidebar-logo { font-size: 28px; }

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  -webkit-app-region: no-drag;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s ease;
  -webkit-app-region: no-drag;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.sidebar-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-weight: 600;
}

.sidebar-item-icon { display: flex; align-items: center; font-size: 20px; }
.sidebar-item-label { white-space: nowrap; }

.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 8px;
  -webkit-app-region: no-drag;
}
```

**Step 3: Create placeholder pages**

Create each file with a simple export:

`src/pages/Dashboard.tsx`:
```tsx
export function Dashboard() {
  return <div className="page"><h2>系統總覽</h2><p>儀表板即將在此顯示。</p></div>;
}
```

`src/pages/Cleaner.tsx`:
```tsx
export function Cleaner() {
  return <div className="page"><h2>深度清理</h2><p>掃描並清除系統垃圾。</p></div>;
}
```

`src/pages/Uninstaller.tsx`:
```tsx
export function Uninstaller() {
  return <div className="page"><h2>應用程式解安裝</h2><p>智慧移除 App + 殘留。</p></div>;
}
```

`src/pages/Optimizer.tsx`:
```tsx
export function Optimizer() {
  return <div className="page"><h2>系統優化</h2><p>重建快取、刷新服務。</p></div>;
}
```

`src/pages/Analyzer.tsx`:
```tsx
export function Analyzer() {
  return <div className="page"><h2>磁碟空間分析</h2><p>視覺化磁碟使用量。</p></div>;
}
```

`src/pages/Monitor.tsx`:
```tsx
export function Monitor() {
  return <div className="page"><h2>系統監控</h2><p>即時 CPU/記憶體/磁碟監控。</p></div>;
}
```

`src/pages/Purger.tsx`:
```tsx
export function Purger() {
  return <div className="page"><h2>構建產物清理</h2><p>清理 node_modules、build 等。</p></div>;
}
```

**Step 4: Update App.tsx with layout and routing**

Replace `src/App.tsx`:

```tsx
import { useState } from 'react';
import { FluentProvider } from '@fluentui/react-components';
import { moleDarkTheme } from './theme';
import { Sidebar, PageId } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Cleaner } from './pages/Cleaner';
import { Uninstaller } from './pages/Uninstaller';
import { Optimizer } from './pages/Optimizer';
import { Analyzer } from './pages/Analyzer';
import { Monitor } from './pages/Monitor';
import { Purger } from './pages/Purger';
import './index.css';

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'cleaner': return <Cleaner />;
      case 'uninstaller': return <Uninstaller />;
      case 'optimizer': return <Optimizer />;
      case 'analyzer': return <Analyzer />;
      case 'monitor': return <Monitor />;
      case 'purger': return <Purger />;
    }
  };

  return (
    <FluentProvider theme={moleDarkTheme}>
      <div className="app-layout">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="main-content">{renderPage()}</main>
      </div>
    </FluentProvider>
  );
}

export default App;
```

Add to `src/index.css`:

```css
.app-layout {
  display: flex;
  height: 100%;
  width: 100%;
}

.main-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.15);
}

.page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page h2 {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}
```

**Step 5: Verify sidebar navigation works**

```powershell
npm run tauri dev
```

Expected: Sidebar on the left with 7 nav items. Clicking each shows a different page heading.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add sidebar navigation and page layout with Fluent UI icons"
```

---

## Task 6: Implement Rust PowerShell Bridge (Core Backend)

**Files:**
- Create: `d:\OtherProject\mine\mole_windows\src-tauri\src\commands\mod.rs`
- Create: `d:\OtherProject\mine\mole_windows\src-tauri\src\commands\mole_bridge.rs`
- Modify: `d:\OtherProject\mine\mole_windows\src-tauri\src\lib.rs` (or `main.rs`)

**Step 1: Create the commands module**

Create `src-tauri/src/commands/mod.rs`:

```rust
pub mod mole_bridge;
```

**Step 2: Create the Mole PowerShell bridge**

Create `src-tauri/src/commands/mole_bridge.rs`:

```rust
use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Serialize, Clone)]
pub struct MoleResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

/// Get the path to the mole-core scripts directory
fn get_mole_core_path() -> PathBuf {
    let exe_dir = std::env::current_exe()
        .expect("Failed to get executable path")
        .parent()
        .expect("Failed to get parent directory")
        .to_path_buf();

    // In dev mode, mole-core is at project root
    let dev_path = exe_dir
        .ancestors()
        .find(|p| p.join("mole-core").join("bin").exists())
        .map(|p| p.join("mole-core"));

    dev_path.unwrap_or_else(|| exe_dir.join("mole-core"))
}

/// Run a Mole PowerShell script with optional arguments
fn run_mole_script(script_name: &str, args: &[&str]) -> Result<MoleResult, String> {
    let mole_path = get_mole_core_path();
    let script_path = mole_path.join("bin").join(script_name);

    if !script_path.exists() {
        return Err(format!("Script not found: {}", script_path.display()));
    }

    let mut cmd = Command::new("powershell");
    cmd.arg("-ExecutionPolicy").arg("Bypass")
       .arg("-NoProfile")
       .arg("-NonInteractive")
       .arg("-File").arg(&script_path);

    for arg in args {
        cmd.arg(arg);
    }

    cmd.current_dir(&mole_path);

    let output = cmd.output().map_err(|e| format!("Failed to execute: {}", e))?;

    Ok(MoleResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code(),
    })
}

#[tauri::command]
pub async fn mole_clean(dry_run: bool) -> Result<MoleResult, String> {
    let args: Vec<&str> = if dry_run { vec!["--dry-run"] } else { vec![] };
    run_mole_script("clean.ps1", &args)
}

#[tauri::command]
pub async fn mole_optimize(dry_run: bool) -> Result<MoleResult, String> {
    let args: Vec<&str> = if dry_run { vec!["--dry-run"] } else { vec![] };
    run_mole_script("optimize.ps1", &args)
}

#[tauri::command]
pub async fn mole_purge(dry_run: bool) -> Result<MoleResult, String> {
    let args: Vec<&str> = if dry_run { vec!["--dry-run"] } else { vec![] };
    run_mole_script("purge.ps1", &args)
}

#[tauri::command]
pub async fn mole_status() -> Result<MoleResult, String> {
    run_mole_script("status.ps1", &[])
}
```

**Step 3: Register commands in Tauri builder**

Update `src-tauri/src/lib.rs` (or `main.rs`):

```rust
mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::mole_bridge::mole_clean,
            commands::mole_bridge::mole_optimize,
            commands::mole_bridge::mole_purge,
            commands::mole_bridge::mole_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 4: Verify the build compiles**

```powershell
cd d:\OtherProject\mine\mole_windows
npm run tauri dev
```

Expected: Compiles without errors. Window displays the sidebar app.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement Rust PowerShell bridge for Mole scripts"
```

---

## Task 7: Implement Dashboard Page with Health Score

**Files:**
- Modify: `d:\OtherProject\mine\mole_windows\src\pages\Dashboard.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\pages\Dashboard.css`
- Create: `d:\OtherProject\mine\mole_windows\src\components\HealthScore.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\components\HealthScore.css`
- Create: `d:\OtherProject\mine\mole_windows\src\components\StatCard.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\hooks\useSystemInfo.ts`

**Step 1: Create the useSystemInfo hook**

Create `src/hooks/useSystemInfo.ts`:

```typescript
import { useState, useEffect } from 'react';

export interface SystemInfo {
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  healthScore: number;
}

export function useSystemInfo(refreshInterval = 3000) {
  const [info, setInfo] = useState<SystemInfo>({
    cpuUsage: 0, memoryUsed: 0, memoryTotal: 0,
    diskUsed: 0, diskTotal: 0, healthScore: 85,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        // Mock data for initial version — replace with Rust invoke later
        setInfo({
          cpuUsage: Math.round(20 + Math.random() * 30),
          memoryUsed: 12.4, memoryTotal: 32,
          diskUsed: 280, diskTotal: 460, healthScore: 85,
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to get system info:', err);
      }
    };
    fetchInfo();
    const timer = setInterval(fetchInfo, refreshInterval);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  return { info, loading };
}
```

**Step 2: Create the HealthScore component**

Create `src/components/HealthScore.tsx`:

```tsx
import './HealthScore.css';

interface HealthScoreProps { score: number; }

export function HealthScore({ score }: HealthScoreProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#4caf50' : score >= 60 ? '#ff9800' : '#f44336';

  return (
    <div className="health-score glass-card">
      <svg viewBox="0 0 120 120" className="health-ring">
        <circle cx="60" cy="60" r="54" className="health-ring-bg" />
        <circle cx="60" cy="60" r="54" className="health-ring-fill"
          style={{ strokeDasharray: circumference, strokeDashoffset: offset, stroke: color }} />
      </svg>
      <div className="health-score-value">
        <span className="health-score-number" style={{ color }}>{score}</span>
        <span className="health-score-label">健康分數</span>
      </div>
    </div>
  );
}
```

Create `src/components/HealthScore.css`:

```css
.health-score {
  position: relative; display: flex;
  align-items: center; justify-content: center;
  width: 200px; height: 200px;
}
.health-ring { width: 160px; height: 160px; transform: rotate(-90deg); }
.health-ring-bg { fill: none; stroke: rgba(255,255,255,0.08); stroke-width: 8; }
.health-ring-fill {
  fill: none; stroke-width: 8; stroke-linecap: round;
  transition: stroke-dashoffset 0.8s ease;
}
.health-score-value {
  position: absolute; display: flex; flex-direction: column; align-items: center;
}
.health-score-number { font-size: 42px; font-weight: 800; letter-spacing: -2px; }
.health-score-label { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: -4px; }
```

**Step 3: Create the StatCard component**

Create `src/components/StatCard.tsx`:

```tsx
interface StatCardProps {
  icon: React.ReactNode; label: string; value: string; sub?: string; color?: string;
}

export function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="glass-card stat-card">
      <div className="stat-card-icon" style={{ color: color || '#60a5fa' }}>{icon}</div>
      <div className="stat-card-info">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
        {sub && <span className="stat-card-sub">{sub}</span>}
      </div>
    </div>
  );
}
```

**Step 4: Build the Dashboard page**

Replace `src/pages/Dashboard.tsx`:

```tsx
import { Button } from '@fluentui/react-components';
import { HealthScore } from '../components/HealthScore';
import { StatCard } from '../components/StatCard';
import { useSystemInfo } from '../hooks/useSystemInfo';
import './Dashboard.css';

export function Dashboard() {
  const { info } = useSystemInfo();
  return (
    <div className="page dashboard">
      <h2>系統總覽</h2>
      <div className="dashboard-top">
        <HealthScore score={info.healthScore} />
        <div className="dashboard-stats">
          <StatCard icon="💻" label="CPU 使用率" value={`${info.cpuUsage}%`} color="#60a5fa" />
          <StatCard icon="🧠" label="記憶體"
            value={`${info.memoryUsed} / ${info.memoryTotal} GB`}
            sub={`${Math.round((info.memoryUsed/info.memoryTotal)*100)}% 已使用`} color="#a78bfa" />
          <StatCard icon="💽" label="磁碟空間"
            value={`${info.diskUsed} / ${info.diskTotal} GB`}
            sub={`${Math.round((info.diskUsed/info.diskTotal)*100)}% 已使用`} color="#f59e0b" />
          <StatCard icon="🌐" label="網路" value="連線正常" color="#34d399" />
        </div>
      </div>
      <div className="dashboard-actions">
        <Button appearance="primary" size="large">🧹 一鍵掃描</Button>
        <Button appearance="outline" size="large">⚡ 快速優化</Button>
      </div>
    </div>
  );
}
```

Create `src/pages/Dashboard.css`:

```css
.dashboard-top { display: flex; gap: 32px; align-items: flex-start; }
.dashboard-stats { flex: 1; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.stat-card { display: flex; align-items: center; gap: 16px; }
.stat-card-icon { font-size: 28px; display: flex; }
.stat-card-info { display: flex; flex-direction: column; }
.stat-card-value { font-size: 18px; font-weight: 700; color: #fff; }
.stat-card-label { font-size: 13px; color: rgba(255,255,255,0.5); }
.stat-card-sub { font-size: 12px; color: rgba(255,255,255,0.35); }
.dashboard-actions { display: flex; gap: 16px; }
```

**Step 5: Verify Dashboard renders**

```powershell
npm run tauri dev
```

Expected: Dashboard shows health score ring, 4 stat cards, and 2 action buttons.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement Dashboard with health score and stat cards"
```

---

## Task 8: Implement Cleaner Page (Scan + Clean)

**Files:**
- Modify: `d:\OtherProject\mine\mole_windows\src\pages\Cleaner.tsx`
- Create: `d:\OtherProject\mine\mole_windows\src\pages\Cleaner.css`

**Step 1: Build the Cleaner page**

Replace `src/pages/Cleaner.tsx`:

```tsx
import { useState } from 'react';
import { Button, ProgressBar, Spinner } from '@fluentui/react-components';
import { invoke } from '@tauri-apps/api/core';
import './Cleaner.css';

interface MoleResult { success: boolean; stdout: string; stderr: string; exit_code: number | null; }

export function Cleaner() {
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState('');

  const handleScan = async () => {
    setScanning(true); setResult('');
    try {
      const res = await invoke<MoleResult>('mole_clean', { dryRun: true });
      setResult(res.stdout || res.stderr);
      setScanned(true);
    } catch (err) { setResult(`Error: ${err}`); }
    finally { setScanning(false); }
  };

  const handleClean = async () => {
    setCleaning(true);
    try {
      const res = await invoke<MoleResult>('mole_clean', { dryRun: false });
      setResult(res.stdout || res.stderr);
    } catch (err) { setResult(`Error: ${err}`); }
    finally { setCleaning(false); }
  };

  return (
    <div className="page cleaner">
      <h2>🧹 深度清理</h2>
      <p className="page-desc">掃描並清除快取、日誌、瀏覽器殘留及暫存檔案，釋放磁碟空間。</p>

      {scanning && (
        <div className="glass-card"><Spinner size="small" label="正在掃描系統..." /><ProgressBar /></div>
      )}

      {result && (
        <div className="glass-card result-output"><pre>{result}</pre></div>
      )}

      <div className="cleaner-actions">
        <Button appearance="primary" size="large" onClick={handleScan} disabled={scanning || cleaning}>
          {scanning ? '掃描中...' : '🔍 掃描'}
        </Button>
        {scanned && (
          <Button appearance="primary" size="large" onClick={handleClean} disabled={scanning || cleaning}>
            {cleaning ? '清理中...' : '🗑️ 開始清理'}
          </Button>
        )}
      </div>
    </div>
  );
}
```

Create `src/pages/Cleaner.css`:

```css
.page-desc { color: rgba(255,255,255,0.6); font-size: 14px; }
.result-output { max-height: 300px; overflow-y: auto; }
.result-output pre {
  font-family: 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px; color: rgba(255,255,255,0.7); white-space: pre-wrap;
}
.cleaner-actions { display: flex; gap: 16px; }
```

**Step 2: Verify Cleaner page works**

```powershell
npm run tauri dev
```

Expected: Click "深度清理" in sidebar → shows UI. Click "掃描" → invokes PowerShell and shows output.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement Cleaner page with scan/clean via Mole bridge"
```

---

## Task 9: Configure Window Properties

**Files:**
- Modify: `d:\OtherProject\mine\mole_windows\src-tauri\tauri.conf.json`

**Step 1: Update window configuration**

In `src-tauri/tauri.conf.json`, set:

```json
{
  "app": {
    "windows": [
      {
        "title": "Mole - System Cleaner & Optimizer",
        "width": 1024, "height": 680,
        "minWidth": 800, "minHeight": 600,
        "center": true, "decorations": true,
        "transparent": false, "resizable": true
      }
    ]
  }
}
```

**Step 2: Verify**

```powershell
npm run tauri dev
```

Expected: Window opens centered, 1024x680, titled "Mole - System Cleaner & Optimizer".

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: configure window properties"
```

---

## Task 10: Production Build and Verification

**Step 1: Production build**

```powershell
cd d:\OtherProject\mine\mole_windows
npm run tauri build
```

Expected: Produces installer in `src-tauri/target/release/bundle/`.

**Step 2: Check bundle size**

```powershell
dir src-tauri\target\release\bundle\nsis\
```

Expected: Installer ~5-15 MB.

**Step 3: Run production build**

```powershell
src-tauri\target\release\mole-windows.exe
```

Expected: Full app works — sidebar, dashboard, cleaner.

**Step 4: Tag release**

```bash
git add -A
git commit -m "chore: verify production build"
git tag v0.1.0-alpha
```

---

## Verification Plan

### Automated Tests
- `cd src-tauri && cargo test` — verifies Rust bridge compiles
- Future: `npx vitest run` for React component tests

### Manual Verification
1. **Launch**: `npm run tauri dev` → window opens with sidebar + dashboard
2. **Navigation**: Click each sidebar item → correct page heading
3. **Cleaner**: Click "掃描" → invokes PowerShell, shows output
4. **Theme**: Dark Fluent UI styling, glassmorphism cards visible
5. **Window**: Resizable, centered, proper title
6. **Build**: `npm run tauri build` → installer < 15 MB
