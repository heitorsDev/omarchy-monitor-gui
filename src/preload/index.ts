import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  readMonitorsConf: (): Promise<string> => ipcRenderer.invoke('monitors-conf:read'),
  writeMonitorsConf: (content: string): Promise<void> =>
    ipcRenderer.invoke('monitors-conf:write', content),
  getHyprctlMonitors: (): Promise<string> => ipcRenderer.invoke('hyprctl:monitors'),
  hyprctlReload: (): Promise<void> => ipcRenderer.invoke('hyprctl:reload')
})
