const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const spawnPath = path.resolve(path.join(__dirname, '../src/app.js'));
console.log(`Testing spawn of: ${spawnPath}`);

const child = spawn('node', [spawnPath], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('Spawn error event:', err);
});

child.on('exit', (code, signal) => {
  console.log(`Spawn exit event. Code: ${code}, Signal: ${signal}`);
});

setTimeout(() => {
  console.log('Test complete. Killing child...');
  child.kill();
  process.exit(0);
}, 6000);
