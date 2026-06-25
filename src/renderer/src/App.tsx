import React, { useEffect, useReducer, useState } from 'react'
import Canvas from './Canvas'
import Sidebar from './Sidebar'
import { canvasReducer, initialCanvasState } from './canvasReducer'
import type { Monitor } from './types'

export default function App(): React.ReactElement {
  const [state, dispatch] = useReducer(canvasReducer, initialCanvasState)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI
      .getHyprctlMonitors()
      .then((json) => {
        const monitors = JSON.parse(json) as Monitor[]
        dispatch({ type: 'INIT', monitors })
      })
      .catch((err: unknown) => setError(String(err)))
  }, [])

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'monospace',
          color: '#f87171',
          background: '#0f172a'
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a' }}>
      <Sidebar monitors={state.monitors} selected={state.selected} dispatch={dispatch} />
      <Canvas state={state} dispatch={dispatch} />
    </div>
  )
}
