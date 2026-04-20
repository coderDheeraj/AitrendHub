import ghpages from 'gh-pages';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');

console.log('--- Starting Production Deployment ---');
console.log('Deploying from:', distPath);

ghpages.publish(distPath, {
  branch: 'gh-pages',
  repo: 'https://github.com/coderDheeraj/AitrendHub.git',
  dotfiles: true,
  message: 'Production Build: Full Asset Integration'
}, (err) => {
  if (err) {
    console.error('Deployment Failed:', err);
    process.exit(1);
  } else {
    console.log('Deployment Successful! Site is now live.');
  }
});
