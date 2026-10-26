const journalTools = require('./task-journal');
// 开发版可配置免费额度；不包含价格、购买或支付能力。
const RULES = { version: 1, freeBatches: 1, windowDays: 7, silentDays: 7 };
function shift(day, amount) { const parts = day.split('-').map(Number); const date = new Date(parts[0],parts[1]-1,parts[2]); date.setDate(date.getDate()+amount); return journalTools.dayKey(date); }
function rememberPlans(journal, tasks, day) {
  if (!journal.startedOn) journal.startedOn = Object.keys(journal.schedules).sort()[0] || day;
  if (!journal.plans) journal.plans = {};
  const active = {};
  tasks.filter(task => !task.fromAiCheckin).forEach(task => {
    active[task.id] = true;
    const snapshot = { id: task.id, name: task.name, dim: task.dim, points: Number(task.points) || 0,
      frequency: task.frequency || (task.fromMeeting ? 'once' : 'daily'), deadline: task.deadline || (task.fromMeeting ? day : ''),
      assignee: task.assignee || '', goalId: task.goalId || '', goalStage: task.goalStage || 0,
      source: task.source || (task.fromMeeting ? 'meeting' : 'daily') };
    const versions = journal.plans[task.id] || (journal.plans[task.id] = []);
    const previous = versions[versions.length-1];
    if (!previous || !previous.active || JSON.stringify(previous.task) !== JSON.stringify(snapshot)) versions.push({ effectiveOn:day, active:true, task:snapshot });
  });
  Object.keys(journal.plans).forEach(id => {
    const versions = journal.plans[id], previous = versions[versions.length-1];
    if (!active[id] && previous.active) versions.push({effectiveOn:day,active:false,task:previous.task});
  });
}
function candidates(journal, today) {
  const items = [], once = new Set();
  for (let offset=RULES.windowDays;offset>=1;offset--) {
    const day=shift(today,-offset), snapshots=journal.schedules[day] || {};
    const ids=new Set(Object.keys(snapshots).concat(Object.keys(journal.plans || {})));
    ids.forEach(id => {
      const version=(journal.plans && journal.plans[id] || []).filter(item=>item.effectiveOn<=day).slice(-1)[0];
      if (version && (!version.active || (version.task.deadline && version.task.deadline<day))) return;
      const task=snapshots[id] || (version && version.task);
      if (!task || journalTools.isDone(journal,id,day) || task.external || id.indexOf('ai_checkin_')===0) return;
      const frequency=task.frequency || (version && version.task.frequency) || 'daily';
      if (frequency==='once') {
        if (once.has(id) || Object.keys(journal.records).some(key=>journal.records[key].id===id && journal.records[key].done)) return;
        once.add(id);
      }
      items.push(Object.assign({},task,{date:day,key:day+'|'+id}));
    });
  }
  return items;
}
function status(journal, today) {
  const used=journal.makeup ? journal.makeup.used : 0;
  const items=candidates(journal,today);
  const start=shift(today,-RULES.silentDays), end=shift(today,-1);
  const hasCheckin=Object.keys(journal.records).some(key=>key.slice(0,10)>=start && key.slice(0,10)<=end && journal.records[key].done && journal.records[key].source!=='makeup') || (journal.externalDays || []).some(day=>day>=start && day<=end);
  const tracked=!!journal.startedOn && journal.startedOn<=start;
  const remaining=Math.max(0,RULES.freeBatches-used);
  const eligible=tracked && !hasCheckin && remaining>0 && items.length>0;
  const reason=!remaining ? '免费集中补卡机会已使用，暂未开放购买' : !tracked ? '记录满七天后可检查集中补卡资格' : hasCheckin ? '最近七天有正常打卡记录，暂不符合集中补卡条件' : !items.length ? '最近七天没有可补打卡的任务' : '';
  return { eligible, reason, remaining, used, start, end, items, rules:Object.assign({},RULES) };
}
function submit(journal, today, keys, requestId) {
  if (!requestId || typeof requestId!=='string' || requestId.length>100) throw new Error('提交标识无效');
  if (journal.makeup && journal.makeup.batches[requestId]) {
    const previous=journal.makeup.batches[requestId];
    if (!Array.isArray(keys) || keys.slice().sort().join(',')!==previous.keys.slice().sort().join(',')) throw new Error('同一提交不能更换补卡任务');
    return { journal, batch:previous, repeated:true };
  }
  const current=status(journal,today);
  if (!current.eligible) throw new Error(current.reason);
  if (!Array.isArray(keys) || !keys.length || new Set(keys).size!==keys.length) throw new Error('请选择未重复的补卡任务');
  const selected=keys.map(key=>current.items.find(item=>item.key===key));
  if (selected.some(item=>!item)) throw new Error('任务状态已变化，请刷新后重新选择');
  const draft=JSON.parse(JSON.stringify(journal));
  let points=0;
  selected.forEach(task=>{ points+=journalTools.setDone(draft,task,task.date,true,'makeup').delta; });
  if (!draft.makeup) draft.makeup={used:0,batches:{}};
  const batch={id:requestId,count:selected.length,points,createdAt:new Date().toISOString(),ruleVersion:RULES.version,keys:keys.slice()};
  draft.makeup.used+=1; draft.makeup.batches[requestId]=batch;
  return {journal:draft,batch,repeated:false,selected};
}
module.exports={RULES,shift,rememberPlans,candidates,status,submit};
