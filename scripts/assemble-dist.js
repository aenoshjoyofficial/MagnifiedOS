import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const userDist = path.join(rootDir, 'User', 'dist');
const adminDist = path.join(rootDir, 'Admin', 'dist');

// Recursive copy function
function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

console.log('📦 Assembling production build directories...');

// Clear root dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

// Copy User build to root dist/
if (fs.existsSync(userDist)) {
  copyFolderSync(userDist, distDir);
  console.log('✅ User app copied to root dist/');
}

// Copy Admin build to root dist/admin/
if (fs.existsSync(adminDist)) {
  copyFolderSync(adminDist, path.join(distDir, 'admin'));
  console.log('✅ Admin app copied to root dist/admin/');
}

console.log('✨ Build assembly finished successfully.');
