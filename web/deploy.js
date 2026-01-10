import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';

// Configuration
const REPO_URL = 'git@github.com:xli2022/experiment-ai.git';
const BRANCH = 'gh-pages';
const DIST_DIR = 'dist';

console.log('🚀 Starting deployment...');

try {
    // 1. Build the project
    console.log('📦 Building project...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2. Navigate to dist directory logic (simulated by chdir later or cwd option)
    const distPath = resolve(process.cwd(), DIST_DIR);

    if (!existsSync(distPath)) {
        throw new Error('Build failed: dist directory not found.');
    }

    // 3. Initialize git in dist
    console.log('✨ Initializing git in dist...');

    // Helper to run command in dist
    const runInDist = (cmd) => execSync(cmd, { cwd: distPath, stdio: 'inherit' });

    // Clean up existing git if any (though usually dist is fresh from build)
    // But vite build often clears dist. git init is safe.

    // Clean up .git if it exists to ensure a fresh repo
    const gitDir = resolve(distPath, '.git');
    if (existsSync(gitDir)) {
        rmSync(gitDir, { recursive: true, force: true });
    }

    runInDist('git init');
    runInDist('git checkout -B ' + BRANCH);
    runInDist('git add -A');
    runInDist('git commit -m "deploy: ' + new Date().toISOString() + '"');

    // 4. Push to remote
    console.log(`📤 Pushing to ${BRANCH}...`);
    runInDist(`git push -f ${REPO_URL} ${BRANCH}`);

    console.log('✅ Deployment complete!');
} catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
}
