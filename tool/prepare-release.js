const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const [version, outputDirectory] = process.argv.slice(2);
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(repoRoot, 'src/core/release-manifest.js'), 'utf8') +
  '\nglobalThis.api = { validateReleaseManifest, compareScriptVersions, RELEASE_LEVELS };', context);
const { validateReleaseManifest, compareScriptVersions, RELEASE_LEVELS } = context.api;

try {
  const manifest = validateReleaseManifest(JSON.parse(fs.readFileSync(path.join(repoRoot, 'releases.json'), 'utf8')));
  const current = manifest.releases.find(release => release.version === version);
  if (!current) throw new Error(`releases.json 缺少 ${version} 的人工更新说明；请由维护者撰写后再发布。`);
  if (outputDirectory) {
    const output = path.resolve(outputDirectory);
    fs.mkdirSync(output, { recursive: true });
    const published = {
      schemaVersion: 1,
      releases: manifest.releases.filter(release => compareScriptVersions(release.version, version) <= 0)
    };
    fs.writeFileSync(path.join(output, 'update.json'), JSON.stringify(published, null, 2) + '\n');
    fs.writeFileSync(path.join(output, 'RELEASE_NOTES.md'),
      `## ${current.version} · ${RELEASE_LEVELS[current.level]}\n\n${current.notes.trim()}\n`);
  }
  console.log(`Validated handwritten release notes for ${version}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
