# Convert to Folder

[![CI](https://github.com/swisstool-io/vscode-convert-to-folder/actions/workflows/ci.yml/badge.svg)](https://github.com/swisstool-io/vscode-convert-to-folder/actions/workflows/ci.yml)
[![Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/swisstool-io.convert-to-folder.svg?color=blue)](https://marketplace.visualstudio.com/items?itemName=swisstool-io.convert-to-folder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)


Ever typed a name like `api` or `routes`, hit *Enter*, and realized you just created a **file** instead of a **folder**?  
Then you delete it, make a folder, and start over — two steps too many.

**Convert to Folder** fixes that. One small, quiet improvement that makes your workflow smoother.


## ✨ Features

- Converts any file into a folder with the same name  
- If the file has content, it becomes `index` inside the new folder  
- If the file is empty, only the folder is created  
- Works on Linux, macOS and Windows

---

## 🚀 Usage

1. In the **Explorer**, right-click a file.  
2. Choose **“Convert to Folder”**.  
3. The file is replaced by a folder:
   - Has content → creates `index` inside  
   - Empty → creates folder only

**Command:**  
`convertToFolder.convert`

You can also run it from the Command Palette (`Ctrl+Shift+P` / `⇧⌘P`).


## 🧩 Installation

**From Marketplace:**
```bash
ext install swisstool-io.convert-to-folder
````

**From source:**

```bash
git clone https://github.com/swisstool-io/vscode-convert-to-folder
cd vscode-convert-to-folder
npm ci
npm run compile
npm run build:test
npm test
```


## 🧪 Requirements

| Platform          | Version               |
| ----------------- | --------------------- |
| VS Code           | 1.80+                 |
| OS                | macOS, Windows, Linux |
| Node.js (for dev) | 20.x                  |

---

## 🛠️ Development

To run locally:

```bash
npm run compile
code .
# Press F5 to start the Extension Host
```

## 🛠️ Part of the SwissTool Collection

A set of small, focused developer tools for VS Code — each designed to solve one problem cleanly and get out of your way.

Explore more at [swisstool.io](https://github.com/swisstool-io).


## 🤝 Contributing

Open source contributions are welcome. If you’d like to improve this extension or report an issue, feel free to open a pull request or discussion.

See [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon) for guidelines.


---

**License:** [MIT](LICENSE) © 2025 — made with ❤️ by [Soufiane Rafik](https://github.com/soufrafik), part of [Swisstool.io](https://github.com/swisstool-io)


