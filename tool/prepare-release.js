const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const [version, outputDirectory, level = 'normal'] = process.argv.slice(2);
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(repoRoot, 'src/core/release-manifest.js'), 'utf8') +
  '\nglobalThis.api = { parseScriptVersion, validateReleaseManifest, compareScriptVersions, RELEASE_LEVELS };', context);
const { parseScriptVersion, validateReleaseManifest, compareScriptVersions, RELEASE_LEVELS } = context.api;

function initializeRelease(source, nextVersion, nextLevel) {
  parseScriptVersion(nextVersion);
  if (!Object.hasOwn(RELEASE_LEVELS, nextLevel)) throw new Error('更新级别必须为 normal、important 或 urgent。');
  const current = source.releases.find(release => compareScriptVersions(release.version, nextVersion) === 0);
  if (current) {
    if (current.version !== nextVersion) throw new Error(`已存在等价版本 ${current.version}，请使用该版本号。`);
    console.log(`${nextVersion} 已登记（${current.level}），保留现有更新说明。`);
    return;
  }
  const notesFile = `release-notes/${nextVersion}.md`;
  const notesPath = path.join(repoRoot, notesFile);
  fs.mkdirSync(path.dirname(notesPath), { recursive: true });
  if (!fs.existsSync(notesPath)) fs.writeFileSync(notesPath, '', { flag: 'wx' });
  source.releases.unshift({ version: nextVersion, level: nextLevel, notesFile });
  fs.writeFileSync(path.join(repoRoot, 'releases.json'), JSON.stringify(source, null, 2) + '\n');
  console.log(`已登记 ${nextVersion}（${nextLevel}），请在 ${notesFile} 填写更新说明后发布。`);
}

try {
  const source = JSON.parse(fs.readFileSync(path.join(repoRoot, 'releases.json'), 'utf8'));
  if (source?.schemaVersion !== 1 || !Array.isArray(source.releases)) throw new Error('更新说明格式无效');
  if (version === '--init') {
    initializeRelease(source, outputDirectory, level);
  } else {
    parseScriptVersion(version);
    source.releases = source.releases.filter(release => compareScriptVersions(release?.version, version) <= 0).map(release => {
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
      const notes = fs.readFileSync(notesPath, 'utf8');
      if (!notes.trim()) throw new Error(`请先在 ${notesFile} 填写更新说明后再发布。`);
      return { ...record, notes };
    });
    const manifest = validateReleaseManifest(source);
    const current = manifest.releases.find(release => release.version === version);
    if (!current) throw new Error(`缺少 ${version} 的更新说明；请运行 node tool/prepare-release.js --init ${version}。`);
    if (outputDirectory) {
      const output = path.resolve(outputDirectory);
      fs.mkdirSync(output, { recursive: true });
      const published = {
        schemaVersion: 1,
        // 已安装的旧版脚本仍会校验 humanWritten，发布时自动补齐以兼容更新提示。
        releases: manifest.releases.map(release => ({ ...release, humanWritten: true }))
      };
      fs.writeFileSync(path.join(output, 'update.json'), JSON.stringify(published, null, 2) + '\n');
      fs.writeFileSync(path.join(output, 'RELEASE_NOTES.md'),
        `## ${current.version} · ${RELEASE_LEVELS[current.level]}\n\n${current.notes.trim()}\n`);
    }
    console.log(`Validated release notes for ${version}.`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
