# StreamHaven Desktop - Windows Media Center

A secure desktop application for streaming and downloading media content with built-in player.

## Quick Start

```bash
# Install dependencies
npm install

# Run as desktop app
node electron-start.js

# Or run as web app
npm run dev
```

## Features

- **Built-in Media Player**: Watch content directly in the app
- **Secure Downloads**: Native desktop download management  
- **Source Management**: Add and manage streaming sources
- **Security**: Input validation and XSS protection

## Usage

1. Add sources using the "+" button
2. Click "Watch" to stream content in built-in player
3. Click "Download" to save content locally
4. Manage sources in Settings

Built with React, Electron, and TypeScript for a secure desktop media experience.

# Launching the Desktop App

## Which app.exe should I use?

- **Production/Release:**
  - Use `src-tauri/target/release/app.exe` for daily use and distribution.
  - This version is optimized, secure, and intended for end users.

- **Development/Debug:**
  - Use `src-tauri/target/debug/app.exe` only for development and testing.
  - This version is larger, slower, and includes extra debug features.

## How to Launch

- Double-click `src-tauri/target/release/app.exe` to launch the app.
- (Optional) Create a desktop shortcut to this file for even easier access:
  1. Right-click `app.exe` in the `release` folder.
  2. Select "Send to > Desktop (create shortcut)".

## Automating Build & Launch

- To build the release version, run:
  ```sh
  npm run tauri build
  ```
- To run the debug version, run:
  ```sh
  npm run tauri dev
  ```

---

For more details, see the Tauri documentation or contact the project maintainer.