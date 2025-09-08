const fs = require('fs');
const path = require('path');

// Crear el directorio environments si no existe
const envDir = path.join(__dirname, '../src/environments');
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

const devTarget = './src/environments/environment.ts';
const prodTarget = './src/environments/environment.prod.ts';

// Valor recibido desde Railway o desde el entorno local
const apiUrl = process.env.API_URL || 'http://localhost:8000';

const devFile = `export const environment = {
  production: false,
  apiUrl: '${apiUrl}'
};`;

const prodFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};`;

fs.writeFileSync(devTarget, devFile);
fs.writeFileSync(prodTarget, prodFile);

console.log(`✅ Archivos de entorno generados correctamente:
- environment.ts
- environment.prod.ts
Con apiUrl: ${apiUrl}`);
