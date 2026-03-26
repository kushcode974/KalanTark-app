const { execSync } = require('child_process');

try {
  // Find PID listening on 3000
  const output = execSync('netstat -ano | findstr :3000').toString();
  const lines = output.trim().split('\n');
  if (lines.length > 0) {
    const parts = lines[0].trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') {
      console.log(`Killing process on port 3000 (PID: ${pid})`);
      execSync(`taskkill /F /PID ${pid}`);
    }
  }
} catch (e) {
  console.log('No process found on port 3000 or failed to kill.');
}

console.log('Running build...');
try {
  const buildOutput = execSync('npx prisma generate && node node_modules/next/dist/bin/next build', { encoding: 'utf-8', stdio: 'inherit' });
  console.log(buildOutput);
} catch (e) {
  console.error('Build failed', e.message);
}
