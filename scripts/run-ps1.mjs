import { execSync } from 'child_process';
import process from 'process';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("No script provided.");
  process.exit(1);
}

// Try pwsh first, fallback to powershell
let psCmd = 'pwsh';
try {
  execSync('pwsh -Version', { stdio: 'ignore' });
} catch (e) {
  try {
    execSync('powershell -Version', { stdio: 'ignore' });
    psCmd = 'powershell';
  } catch (e2) {
    console.error("Neither pwsh nor powershell is available.");
    process.exit(1);
  }
}

const command = `${psCmd} -NoProfile -ExecutionPolicy Bypass -File ${args.join(' ')}`;
try {
  execSync(command, { stdio: 'inherit' });
} catch (e) {
  process.exit(e.status || 1);
}
