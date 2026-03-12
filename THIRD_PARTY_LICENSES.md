# Third-Party Licenses

Prism is built on top of several excellent open-source projects.
Below is the list of major dependencies and their licenses.

---

## Mole (Core Engine)

- **Project**: [Mole](https://github.com/nicholasgasior/mole)
- **License**: MIT
- **Copyright**: Copyright (c) 2025 tw93
- **Usage**: PowerShell-based system cleaning and optimization engine

The full license text is included in the `mole-core/LICENSE` file.

---

## Frontend Dependencies

All frontend dependencies are licensed under the **MIT License** unless noted otherwise.

### Core Framework
| Package | License |
|---------|---------|
| [React](https://github.com/facebook/react) | MIT |
| [React DOM](https://github.com/facebook/react) | MIT |
| [Vite](https://github.com/vitejs/vite) | MIT |
| [TypeScript](https://github.com/microsoft/TypeScript) | Apache-2.0 |

### UI Components
| Package | License |
|---------|---------|
| [@fluentui/react-components](https://github.com/microsoft/fluentui) | MIT |
| [@fluentui/react-icons](https://github.com/microsoft/fluentui-system-icons) | MIT |

### Internationalization
| Package | License |
|---------|---------|
| [i18next](https://github.com/i18next/i18next) | MIT |
| [react-i18next](https://github.com/i18next/react-i18next) | MIT |

---

## Backend Dependencies (Rust/Tauri)

| Package | License |
|---------|---------|
| [Tauri](https://github.com/tauri-apps/tauri) | MIT / Apache-2.0 |
| [serde](https://github.com/serde-rs/serde) | MIT / Apache-2.0 |
| [sysinfo](https://github.com/Guillaume/sysinfo) | MIT |
| [tokio](https://github.com/tokio-rs/tokio) | MIT |

---

All MIT and Apache-2.0 license texts can be found in the respective
package directories under `node_modules/` and in the Cargo registry cache.
