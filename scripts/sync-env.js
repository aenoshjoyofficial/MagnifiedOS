import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const rootEnvPath = path.join(rootDir, '.env');
const rootEnvExamplePath = path.join(rootDir, '.env.example');
const userEnvPath = path.join(rootDir, 'User', '.env');
const adminEnvPath = path.join(rootDir, 'Admin', '.env');

console.log('🔄 Environment Sync: Starting synchronization...');

let envContent = '';

// Check if root .env exists, if not fall back to .env.example
if (fs.existsSync(rootEnvPath)) {
  console.log(`✅ Environment Sync: Found root '.env' file.`);
  envContent = fs.readFileSync(rootEnvPath, 'utf8');
} else if (fs.existsSync(rootEnvExamplePath)) {
  console.log(`⚠️  Environment Sync: Root '.env' not found. Falling back to '.env.example'.`);
  envContent = fs.readFileSync(rootEnvExamplePath, 'utf8');
  // Write the root .env so user has a starting point
  fs.writeFileSync(rootEnvPath, envContent, 'utf8');
  console.log(`💾 Environment Sync: Created '.env' from '.env.example' at root.`);
} else {
  console.error(`❌ Environment Sync: Error - Neither '.env' nor '.env.example' were found in the root directory!`);
  process.exit(1);
}

// Copy to User directory
try {
  fs.writeFileSync(userEnvPath, envContent, 'utf8');
  console.log(`💾 Environment Sync: Successfully wrote env to User/.env`);
} catch (err) {
  console.error(`❌ Environment Sync: Failed to write User/.env:`, err.message);
  process.exit(1);
}

// Copy to Admin directory
try {
  fs.writeFileSync(adminEnvPath, envContent, 'utf8');
  console.log(`💾 Environment Sync: Successfully wrote env to Admin/.env`);
} catch (err) {
  console.error(`❌ Environment Sync: Failed to write Admin/.env:`, err.message);
  process.exit(1);
}

console.log('✨ Environment Sync: Finished successfully.');
