// test-paths.js
const path = require('path');
const fs = require('fs');

console.log('Current working directory:', process.cwd());
console.log('');

// Check ml directory
const mlDir = path.join(process.cwd(), 'ml');
console.log('ML directory path:', mlDir);
console.log('ML directory exists:', fs.existsSync(mlDir));

if (fs.existsSync(mlDir)) {
  console.log('Contents of ml directory:');
  fs.readdirSync(mlDir).forEach(file => {
    console.log(`  - ${file}`);
  });
}

// Check specific files
const files = [
  'ml/inference.py',
  'ml/best.pt',
  'ml/class_labels.py',
  'tmp'
];

console.log('\nChecking specific files:');
files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  console.log(`${file}: ${fs.existsSync(fullPath) ? 'EXISTS' : 'NOT FOUND'}`);
});

// Check Python
const { exec } = require('child_process');
exec('python --version', (error, stdout, stderr) => {
  if (error) {
    console.log('\nPython check: NOT FOUND or error');
  } else {
    console.log('\nPython version:', stdout || stderr);
  }
});