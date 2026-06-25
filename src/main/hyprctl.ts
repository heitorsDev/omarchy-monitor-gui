import { execFileSync } from 'child_process'

export function isHyprctlAvailable(): boolean {
  try {
    execFileSync('which', ['hyprctl'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}
