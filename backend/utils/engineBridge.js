const { spawn } = require('child_process');
const path = require('path');

const isWindows  = process.platform === 'win32'
const ENGINE_PATH = path.join(__dirname, '../../cpp-engine', isWindows ? 'engine.exe' : 'engine')
/**
 * Run C++ allocation engine.
 * Works in both online mode (called via API) and
 * offline mode (called directly from CLI/local script).
 *
 * @param {Object} payload  - { zones: [...], volunteers: [...] }
 * @returns {Promise<Object>} - parsed JSON result from C++ engine
 */
function runEngine(payload) {
  return new Promise((resolve, reject) => {
    const inputJson = JSON.stringify(payload);
    const child     = spawn(ENGINE_PATH, [], { stdio: ['pipe','pipe','pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Engine exited ${code}: ${stderr}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Engine output parse failed: ${stdout}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Engine spawn error: ${err.message}`));
    });

    // Send input to C++ stdin
    child.stdin.write(inputJson);
    child.stdin.end();
  });
}

module.exports = { runEngine };
