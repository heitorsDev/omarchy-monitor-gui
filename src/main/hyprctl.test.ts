import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('child_process', () => ({
  execFileSync: vi.fn()
}))

import { execFileSync } from 'child_process'
import { isHyprctlAvailable } from './hyprctl'

describe('isHyprctlAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when hyprctl is in PATH', () => {
    vi.mocked(execFileSync).mockReturnValue(Buffer.from('/usr/bin/hyprctl'))
    expect(isHyprctlAvailable()).toBe(true)
    expect(execFileSync).toHaveBeenCalledWith('which', ['hyprctl'], { stdio: 'ignore' })
  })

  it('returns false when hyprctl is not in PATH', () => {
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error('not found')
    })
    expect(isHyprctlAvailable()).toBe(false)
  })
})
