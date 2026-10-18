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
  const source = JSON.parse(fs.readFileSync(path.join(repoRoot, 'releases.json'), 'utf8'));
  if (Array.isArray(source?.releases)) {
    source.releases = source.releases.map(release => {
      if (!release || !Object.hasOwn(release, 'notesFile')) return release;
      const { notesFile, ...record } = release;
      if (typeof notesFile !== 'string' || !notesFile.trim() || Object.hasOwn(record, 'notes')) {
        throw new Error('更新说明应只填写 notesFile 或 notes，不能同时填写。');
      }
      const notesPath = fs.realpathSync(path.resolve(repoRoot, notesFile));
      const relative = path.relative(path.join(repoRoot, 'release-notes'), notesPath);
      if (path.isAbsolute(relative) || relative === '..' || relative.startsWith(`..${path.sep}`) || !relative.endsWith('.md')) {
        throw new Error('notesFile 必须指向 release-notes 目录内的 Markdown 文件。');
      }
      return { ...record, notes: fs.readFileSync(notesPath, 'utf8') };
    });
  }
  const manifest = validateReleaseManifest(source);
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
