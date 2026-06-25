#!/usr/bin/env node
const { spawn } = require('child_process')
const path = require('path')
const electron = require('electron')

const appPath = path.join(__dirname, '..')

const proc = spawn(String(electron), [appPath], {
  stdio: 'inherit',
  env: { ...process.env }
})

proc.on('close', (code) => {
  process.exit(code ?? 0)
})
