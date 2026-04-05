const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { execSync } = require('child_process');
const path = require('path');

// Auto-fix permissions on .next folder so server can read all files
try {
  const nextDir = path.join(__dirname, '.next');
  execSync(`chmod -R 755 "${nextDir}"`, { stdio: 'ignore' });
  console.log('> Permissions fixed on .next');
} catch (e) {
  console.warn('> Could not fix permissions:', e.message);
}

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on port ${port}`);
  });
});
