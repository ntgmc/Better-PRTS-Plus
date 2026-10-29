const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

function buildActivitySchedule(activityTable, zoneTable, stageTable) {
  assert(activityTable.basicInfo && activityTable.zoneToActivity, 'Missing activity data');
  assert(zoneTable.zones && zoneTable.zoneValidInfo, 'Missing zone opening times');
  assert(stageTable.stages && stageTable.stageValidInfo, 'Missing stage data');
  const activities = new Map();
  for (const stage of Object.values(stageTable.stages)) {
    if (!stage.levelId || !stage.code || stage.difficulty !== 'NORMAL') continue;
    const activityId = activityTable.zoneToActivity[stage.zoneId];
    const activity = activityTable.basicInfo[activityId];
    const zone = zoneTable.zones[stage.zoneId];
    const times = zoneTable.zoneValidInfo[stage.zoneId];
    if (!activity?.hasStage || !zone || !times) continue;
    const stageTimes = stageTable.stageValidInfo[stage.stageId];
    const startTime = Math.max(activity.startTime, times.startTs, stageTimes?.startTs || 0);
    const endTime = Math.min(activity.endTime, times.endTs > 0 ? times.endTs : Infinity,
      stageTimes?.endTs > 0 ? stageTimes.endTs : Infinity);
    assert(Number.isSafeInteger(startTime) && startTime > 0 && endTime > startTime, `Invalid times: ${stage.stageId}`);
    if (!activities.has(activityId)) {
      activities.set(activityId, { id: activityId, name: activity.name, startTime: activity.startTime,
        endTime: activity.endTime, groups: [] });
    }
    const kind = /-EX-/.test(stage.code) ? 'EX' : /-S-/.test(stage.code) ? 'S'
      : /^[A-Z\d]+-\d+$/.test(stage.code) ? 'NORMAL' : 'OTHER';
    const id = `${stage.zoneId}:${kind}:${startTime}:${endTime}`;
    const groups = activities.get(activityId).groups;
    let group = groups.find(item => item.id === id);
    if (!group) {
      const name = zone.zoneNameSecond || zone.zoneNameFirst || '';
      group = { id, name: /不展示|不显示/.test(name) ? '' : name, kind, startTime, endTime, stages: [] };
      groups.push(group);
    }
    group.stages.push({ id: stage.stageId, code: stage.code, name: stage.name || stage.code,
      levelId: stage.levelId.toLowerCase() });
  }
  const result = [...activities.values()].sort((a, b) => b.startTime - a.startTime || a.id.localeCompare(b.id));
  assert(result.length, 'No activity stages found');
  for (const activity of result) {
    activity.groups.sort((a, b) => a.startTime - b.startTime ||
      ['NORMAL', 'EX', 'S', 'OTHER'].indexOf(a.kind) - ['NORMAL', 'EX', 'S', 'OTHER'].indexOf(b.kind) || a.id.localeCompare(b.id));
    for (const group of activity.groups) group.stages.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
  }
  return { schemaVersion: 1, activities: result };
}

async function main() {
  const tables = await Promise.all(['activity', 'zone', 'stage'].map(async name => {
    if (process.argv[2]) return JSON.parse(fs.readFileSync(path.join(process.argv[2], `${name}_table.json`), 'utf8'));
    for (const base of ['https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData/master/',
      'https://cdn.jsdelivr.net/gh/Kengxxiao/ArknightsGameData@master/']) {
      try {
        const response = await fetch(`${base}zh_CN/gamedata/excel/${name}_table.json`, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        if (base.includes('cdn.jsdelivr.net')) throw error;
      }
    }
  }));
  const schedule = buildActivitySchedule(...tables);
  fs.writeFileSync(path.join(__dirname, '../resources/activities.json'), `${JSON.stringify(schedule)}\n`);
  console.log(`Generated schedules for ${schedule.activities.length} activities`);
}

module.exports = { buildActivitySchedule };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
