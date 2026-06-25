interface ElectronAPI {
  readMonitorsConf(): Promise<string>
  writeMonitorsConf(content: string): Promise<void>
  getHyprctlMonitors(): Promise<string>
  hyprctlReload(): Promise<void>
}

interface Window {
  electronAPI: ElectronAPI
}
