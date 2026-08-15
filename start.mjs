/* ==========================================================================
   SEMS — One-command dev runner
   Starts the Express backend (port 5000) and the frontend static server
   (port 8080) together so the whole app works from a single command.
   ========================================================================== */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const BACKEND = join(ROOT, 'backend');

function start(name, cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, stdio: ['inherit', 'inherit', 'inherit'], shell: process.platform === 'win32' });
  child.on('exit', (code) => {
    console.log(`\n[${name}] exited with code ${code}`);
    process.exit(code);
  });
  return child;
}

console.log('Starting SEMS backend (port 5000) and frontend (port 8080)...\n');
console.log('  Frontend : http://localhost:8080\n  Backend  : http://localhost:5000/api\n');

start('backend', 'node', ['src/server.js'], BACKEND);
start('frontend', 'node', ['dev-server.mjs'], ROOT);