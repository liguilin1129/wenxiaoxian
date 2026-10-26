// 任务定义、按日快照与追加式计分分开保存；历史不依赖当前任务列表。
function dayKey(value) {
  const d = value ? new Date(value) : new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function legacyDay(value, reference) {
  const ref = /^\d{4}-\d{2}-\d{2}$/.test(reference || '') ? reference : dayKey();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value;
  if (!/^\d{2}-\d{2}$/.test(value || '')) return ref;
  let result = ref.slice(0, 4) + '-' + value;
  if (result > ref) result = String(Number(ref.slice(0, 4)) - 1) + '-' + value;
  return result;
}
function schedule(journal, task, day) {
  if (!journal.schedules[day]) journal.schedules[day] = {};
  if (!journal.records[day + '|' + task.id]) journal.schedules[day][task.id] = {
    id: task.id, name: task.name, dim: task.dim || 'habit', points: Number(task.points) || 0,
    assignee: task.assignee || '', frequency: task.frequency || (task.fromMeeting ? 'once' : 'daily'),
    goalId: task.goalId || '', goalStage: task.goalStage || 0, external: !!task.fromAiCheckin,
    source: task.source || (task.goalId ? 'goal' : task.fromMeeting ? 'meeting' : task.fromCustomTask ? 'custom' : 'daily')
  };
}
function setDone(journal, task, day, done, origin) {
  schedule(journal, task, day);
  const key = day + '|' + task.id;
  const previous = journal.records[key];
  if (!!(previous && previous.done) === !!done) return { changed: false, delta: 0, done: !!done };
  const snapshot = previous || journal.schedules[day][task.id];
  const points = Number(snapshot.points) || 0;
  const revision = previous ? previous.revision + 1 : 1;
  const delta = done ? points : -points;
  const flowId = key + ':' + revision;
  const at = new Date().toISOString();
  journal.entries.push({ id: flowId, bizId: flowId, taskId: task.id, title: snapshot.name,
    dim: snapshot.dim, date: day, delta, source: origin || 'checkin', recordedAt: at,
    refFlowId: !done && previous ? previous.flowId : '' });
  journal.records[key] = Object.assign({}, snapshot, { done: !!done, revision, flowId, source: origin || 'checkin', updatedAt: at });
  return { changed: true, delta, done: !!done };
}
function migrate(st, definitions) {
  if (st.taskJournal && st.taskJournal.version === 1) return st.taskJournal;
  const reference = st.date || dayKey();
  const journal = { version: 1, migratedAt: new Date().toISOString(), entries: [], records: {}, schedules: {}, templates: {} };
  st.taskMigrationBackup = JSON.parse(JSON.stringify({ date: st.date, daily: st.daily || {}, center: st.center || {}, customApprovals: st.customApprovals || {} }));
  const find = id => definitions.find(task => task.id === id);
  Object.keys(st.daily || {}).forEach(id => {
    const task = find(id);
    if (task) setDone(journal, task, legacyDay(st.daily[id], reference), true, 'legacy');
  });
  Object.keys(st.center || {}).forEach(id => {
    const record = st.center[id], task = find(id);
    if (!task || !record || !['approved', 'pending'].includes(record.status)) return;
    const date = legacyDay(record.date, reference);
    setDone(journal, task, date, true, record.status === 'pending' ? 'legacy_pending' : 'legacy');
    journal.templates[id] = { startsOn: date };
  });
  Object.keys(st.customApprovals || {}).forEach(id => {
    const record = st.customApprovals[id], task = find(id);
    if (task && record && ['pending', 'approved'].includes(record.status)) {
      setDone(journal, task, legacyDay(record.date, reference), true, record.status === 'pending' ? 'legacy_pending' : 'legacy');
    }
  });
  st.taskJournal = journal;
  return journal;
}
function isDone(journal, id, day) { const record = journal.records[day + '|' + id]; return !!(record && record.done); }
module.exports = { dayKey, legacyDay, schedule, setDone, migrate, isDone };
