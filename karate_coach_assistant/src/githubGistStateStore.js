const GITHUB_API_VERSION = '2022-11-28';

function createHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'karate-coach-assistant',
    'X-GitHub-Api-Version': GITHUB_API_VERSION
  };
}

function createNotFoundError(message) {
  const error = new Error(message);
  error.code = 'ENOENT';
  return error;
}

async function parseErrorResponse(response) {
  const responseText = await response.text();
  if (!responseText) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const payload = JSON.parse(responseText);
    return payload.message || `${response.status} ${response.statusText}`;
  } catch {
    return responseText;
  }
}

export async function loadStateFromGitHubGist({ gistId, filename, token }) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: createHeaders(token)
  });

  if (response.status === 404) {
    throw createNotFoundError(`GitHub Gist ${gistId} nebyl nalezen.`);
  }

  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst GitHub Gist stav: ${await parseErrorResponse(response)}`);
  }

  const payload = await response.json();
  const file = payload.files?.[filename];

  if (!file) {
    throw createNotFoundError(`Soubor ${filename} v GitHub Gistu ${gistId} neexistuje.`);
  }

  return file.content || '';
}

export async function saveStateToGitHubGist({ gistId, filename, token, content }) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: createHeaders(token),
    body: JSON.stringify({
      files: {
        [filename]: {
          content
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Nepodařilo se uložit GitHub Gist stav: ${await parseErrorResponse(response)}`);
  }
}