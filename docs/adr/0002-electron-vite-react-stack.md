# Electron + electron-vite + React + Vitest as the application stack

The app uses Electron as the desktop runtime, electron-vite as the build tool, React as the renderer UI framework, and Vitest as the test runner.

**Electron** is the only practical choice for a Wayland/Linux desktop app distributed as an npm global package: it ships a self-contained Chromium + Node runtime, so `npm install -g omarchy-monitor-gui` requires no system GUI toolkit dependencies beyond what Electron bundles.

**electron-vite** replaces the manual multi-config Vite setup with a single `electron.vite.config.ts` that produces three coordinated builds (main, preload, renderer) and provides `npm run dev` hot reload out of the box via `ELECTRON_RENDERER_URL`. The alternative (electron-builder + plain Vite) requires wiring process restart and URL injection manually.

**React** is chosen for the renderer because `@monaco-editor/react` (required by the Config Editor slice) has official React bindings. No other framework has a comparable Monaco integration.

**Vitest** is the natural test runner for a Vite-based project — it shares the same transform pipeline, making mocking of Node built-ins (child_process, fs) straightforward without an extra babel/jest config layer.
