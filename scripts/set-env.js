const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, '../src/environments');
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

const devTarget = './src/environments/environment.ts';
const prodTarget = './src/environments/environment.prod.ts';

const apiUrl = process.env.API_URL || 'http://localhost:8000';
const wsUrl = process.env.WS_URL || 'ws://localhost:6173';

const devFile = `export const environment = {
  production: false,
  apiUrl: '${apiUrl}',
  wsUrl: '${wsUrl}'
};`;

const prodFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}',
  wsUrl: '${wsUrl}'
};`;

fs.writeFileSync(devTarget, devFile);
fs.writeFileSync(prodTarget, prodFile);