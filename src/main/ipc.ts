import { ipcMain } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { homedir } from 'os'
import { join } from 'path'

const execFileAsync = promisify(execFile)
const MONITORS_CONF = join(homedir(), '.config', 'hypr', 'monitors.conf')

export function registerIpcHandlers(): void {
  ipcMain.handle('monitors-conf:read', async () => {
    try {
      return await readFile(MONITORS_CONF, 'utf-8')
    } catch {
      return ''
    }
  })

  ipcMain.handle('monitors-conf:write', async (_event, content: string) => {
    await writeFile(MONITORS_CONF, content, 'utf-8')
  })

  ipcMain.handle('hyprctl:monitors', async () => {
    const { stdout } = await execFileAsync('hyprctl', ['monitors', '-j'])
    return stdout
  })

  ipcMain.handle('hyprctl:reload', async () => {
    await execFileAsync('hyprctl', ['reload'])
  })
}
