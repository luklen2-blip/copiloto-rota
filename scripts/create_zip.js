const { execSync } = require('child_process');
const path = require('path');

const scriptPath = path.resolve(__dirname, 'create_zip.ps1');
execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { stdio: 'inherit' });
