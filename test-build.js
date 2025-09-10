// Simple test to verify module resolution
const path = require('path');
const fs = require('fs');

console.log('Current directory:', process.cwd());
console.log('Checking for src directory:', fs.existsSync('./src'));
console.log('Checking tsconfig.json:', fs.existsSync('./tsconfig.json'));

// Read tsconfig
try {
  const tsconfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
  console.log('TSConfig paths:', tsconfig.compilerOptions.paths);
} catch (e) {
  console.error('Error reading tsconfig:', e.message);
}

// Check if components exist
const componentsPath = './src/components';
console.log('Components directory exists:', fs.existsSync(componentsPath));

if (fs.existsSync(componentsPath)) {
  const items = fs.readdirSync(componentsPath);
  console.log('Items in components:', items);
}