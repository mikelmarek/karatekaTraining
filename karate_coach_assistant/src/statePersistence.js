import fs from 'node:fs/promises';
import { loadStateFromGitHubGist, saveStateToGitHubGist } from './githubGistStateStore.js';

function resolveStateTarget(stateTarget) {
  if (typeof stateTarget === 'string') {
    return {
      stateBackend: 'local',
      stateFile: stateTarget,
      githubStateGistId: null,
      githubStateFilename: null,
      githubStateToken: null
    };
  }

  return {
    stateBackend: stateTarget.stateBackend || 'local',
    stateFile: stateTarget.stateFile,
    githubStateGistId: stateTarget.githubStateGistId || null,
    githubStateFilename: stateTarget.githubStateFilename || null,
    githubStateToken: stateTarget.githubStateToken || null
  };
}

export async function readPersistedState(stateTarget) {
  const target = resolveStateTarget(stateTarget);

  if (target.stateBackend === 'github-gist') {
    return loadStateFromGitHubGist({
      gistId: target.githubStateGistId,
      filename: target.githubStateFilename,
      token: target.githubStateToken
    });
  }

  return fs.readFile(target.stateFile, 'utf8');
}

export async function writePersistedState(stateTarget, content) {
  const target = resolveStateTarget(stateTarget);

  if (target.stateBackend === 'github-gist') {
    await saveStateToGitHubGist({
      gistId: target.githubStateGistId,
      filename: target.githubStateFilename,
      token: target.githubStateToken,
      content
    });
    return;
  }

  await fs.writeFile(target.stateFile, content, 'utf8');
}

export async function readBootstrapStateFile(stateFile) {
  return fs.readFile(stateFile, 'utf8');
}