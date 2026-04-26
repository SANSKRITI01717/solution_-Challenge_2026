const { spawn } = require('child_process')
const path      = require('path')

// Windows uses .exe, Linux (Render) uses no extension
const isWindows   = process.platform === 'win32'
const ENGINE_NAME = isWindows ? 'engine.exe' : 'engine'
const ENGINE_PATH = path.join(__dirname, '../../cpp-engine', ENGINE_NAME)

function runEngine(payload) {
  return new Promise((resolve, reject) => {
    const inputJson = JSON.stringify(payload)
    const child     = spawn(ENGINE_PATH, [], { stdio: ['pipe','pipe','pipe'] })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', d => { stdout += d.toString() })
    child.stderr.on('data', d => { stderr += d.toString() })

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Engine exited ${code}: ${stderr}`))
      }
      try {
        resolve(JSON.parse(stdout))
      } catch (e) {
        reject(new Error(`Engine output parse failed: ${stdout}`))
      }
    })

    child.on('error', (err) => {
      reject(new Error(`Engine spawn error: ${err.message}`))
    })

    child.stdin.write(inputJson)
    child.stdin.end()
  })
}

module.exports = { runEngine }