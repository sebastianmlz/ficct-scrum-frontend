const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'http://localhost:8000';
const isProduction = process.env.NODE_ENV === 'production';

const envFileContent = `export const environment = {
  production: ${isProduction},
  apiUrl: '${apiUrl}'
};
`;

const envFilePath = path.join(__dirname, '../src/environments/environment.ts');
fs.writeFileSync(envFilePath, envFileContent);

console.log(`Environment file created with API URL: ${apiUrl}`);
