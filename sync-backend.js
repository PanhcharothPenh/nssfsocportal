const fs = require('fs');
const path = require('path');

// Sync all backend .py files and google_credentials.json into api/ so Vercel can bundle them
const backendDir = path.join(__dirname, 'backend');
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

const files = fs.readdirSync(backendDir).filter(f => f.endsWith('.py') || f === 'google_credentials.json');
files.forEach(file => {
  fs.copyFileSync(path.join(backendDir, file), path.join(apiDir, file));
  console.log(`Synced: backend/${file} -> api/${file}`);
});

console.log(`\nSynced ${files.length} backend files to api/`);
