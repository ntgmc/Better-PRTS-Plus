const fs = require('node:fs');
const assert = require('node:assert/strict');

async function getResourceUpstream(fetchImpl = fetch) {
  const sources = {
    game_sha: 'Kengxxiao/ArknightsGameData/commits/master',
    operators_sha: 'ZOOT-Plus/zoot-plus-frontend/commits/dev'
  };
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const entries = await Promise.all(Object.entries(sources).map(async ([name, source]) => {
    const response = await fetchImpl(`https://api.github.com/repos/${source}`, {
      headers, signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`Cannot check ${source}: HTTP ${response.status}`);
    const { sha } = await response.json();
    assert(typeof sha === 'string' && sha.length === 40 && /^[a-f0-9]+$/.test(sha), `Invalid upstream commit: ${source}`);
    return [name, sha];
  }));
  return Object.fromEntries(entries);
}

module.exports = { getResourceUpstream };
if (require.main === module) {
  getResourceUpstream().then(refs => {
    const output = Object.entries(refs).map(([name, sha]) => `${name}=${sha}\n`).join('');
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
    process.stdout.write(output);
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
