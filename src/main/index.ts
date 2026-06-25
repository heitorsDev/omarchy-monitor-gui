import { app, BrowserWindow, dialog } from 'electron'
import { join } from 'path'
import { isHyprctlAvailable } from './hyprctl'
import { registerIpcHandlers } from './ipc'

const PRELOAD = join(__dirname, '..', 'preload', 'index.js')

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '..', 'renderer', 'index.html'))
  }

  return win
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  let mainWindow: BrowserWindow | null = null

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    if (!isHyprctlAvailable()) {
      dialog.showErrorBox(
        'hyprctl not found',
        'omarchy-monitor-gui requires Hyprland. hyprctl was not found in PATH.\n\nPlease run this app inside a Hyprland session.'
      )
      app.exit(1)
      return
    }

    registerIpcHandlers()
    mainWindow = createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
