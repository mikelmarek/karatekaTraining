import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
const plannerRoot = path.resolve(workspaceRoot, 'tools', 'training_planner_web');
const plannerDataRoot = path.join(plannerRoot, 'data');
const vercelStaticRoot = path.resolve(workspaceRoot, 'karate_coach_assistant', 'vercel-static');
const vercelDataRoot = path.resolve(workspaceRoot, 'karate_coach_assistant', 'vercel-data');

async function resetDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyFile(relativePath, targetRoot) {
  const sourcePath = path.join(plannerRoot, relativePath);
  const targetPath = path.join(targetRoot, relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.copyFile(sourcePath, targetPath);
}

async function main() {
  await resetDir(vercelStaticRoot);
  await resetDir(vercelDataRoot);

  await Promise.all([
    copyFile('index.html', vercelStaticRoot),
    copyFile('app.js', vercelStaticRoot),
    copyFile('styles.css', vercelStaticRoot)
  ]);

  await Promise.all([
    fs.copyFile(path.join(plannerDataRoot, 'planner-data.json'), path.join(vercelDataRoot, 'planner-data.json')),
    fs.copyFile(path.join(plannerDataRoot, 'shared-state.json'), path.join(vercelDataRoot, 'shared-state.json')).catch((error) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    })
  ]);

  console.log('Vercel static a data soubory byly připravené.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});