const assert=require('assert');
const fs=require('fs');
const RealDate=Date;
let now=new RealDate(2026,9,19,12).getTime();
global.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
const memory={signed:true};let failStorage=false,app;
const clone=value=>JSON.parse(JSON.stringify(value));
global.wx={getStorageSync:key=>memory[key]===undefined?'':clone(memory[key]),setStorageSync:(key,value)=>{
  if(failStorage&&key==='checkInState')throw new Error('模拟存储失败');memory[key]=clone(value);
}};
require.cache[require.resolve('../miniprogram/utils/cloud-data')]={exports:{schedulePush(){}}};
const mock=require('../miniprogram/utils/mock');
global.getApp=()=>app;
const store=require('../miniprogram/utils/store');
function boot(){app={globalData:{signed:true,child:clone(mock.child),dimensions:clone(mock.dimensions),todayTasks:clone(mock.todayTasks),tasks:clone(mock.tasks),taskDetail:clone(mock.taskDetail),classics:clone(mock.classics),rewards:clone(mock.rewards),meetings:[]}};store.initCheckIns(app);}
boot();assert(!store.getMakeupStatus().eligible);
const once=store.addCustomTask({name:'单次整理',points:8,dim:'habit',frequency:'once',deadline:'2026-10-30'});
const retired=store.addCustomTask({name:'后来移除',points:3,dim:'habit',frequency:'daily',deadline:'2026-10-30'});
now=new RealDate(2026,9,22,12).getTime();store.getTodayTasks();store.removeCustomTask(retired.id);
now=new RealDate(2026,9,27,12).getTime();
const status=store.getMakeupStatus();assert(status.eligible);assert.equal(status.remaining,1);
const eligibleJournal=clone(app.globalData._ci.taskJournal);
assert(status.items.every(item=>item.date>='2026-10-20'&&item.date<='2026-10-26'));
assert.equal(status.items.filter(item=>item.id===once.id).length,1);
assert(status.items.filter(item=>item.id===retired.id).every(item=>item.date<'2026-10-22'));
assert(store.getSmartReminders().some(item=>item.target==='makeup'));
const keys=['2026-10-20|t4','2026-10-21|t4',status.items.find(item=>item.id===once.id).key];
const balance=app.globalData.child.points,entryCount=app.globalData._ci.taskJournal.entries.length;
assert.throws(()=>store.submitMakeup([keys[0],keys[0]],'duplicate'),/重复/);
assert.throws(()=>store.submitMakeup(['2026-10-28|t4'],'future'),/状态/);
assert.equal(app.globalData._ci.taskJournal.entries.length,entryCount);
failStorage=true;assert.throws(()=>store.submitMakeup(keys,'batch1'),/存储/);failStorage=false;
assert.equal(store.getMakeupStatus().remaining,1);assert.equal(app.globalData.child.points,balance);
const batch=store.submitMakeup(keys,'batch1');assert.equal(batch.count,3);assert.equal(batch.points,28);
assert.equal(app.globalData.child.points,balance+28);
assert(!store.getTodayTasks().some(item=>item.id===once.id));
assert.equal(store.getMakeupStatus().remaining,0);assert.equal(app.globalData.child.streak,0);
assert.equal(store.todayGain(),0); // 补卡属于原任务日期，不伪装成今日正常完成。
assert.equal(store.getTaskHistory().filter(item=>item.source==='makeup').length,3);
assert(store.getTaskHistory().filter(item=>item.source==='makeup').every(item=>item.recordedAt.slice(0,10)==='2026-10-27'));
assert(!store.getSmartReminders().some(item=>item.target==='makeup'));
store.submitMakeup(keys,'batch1');assert.equal(app.globalData.child.points,balance+28);
assert.throws(()=>store.submitMakeup([keys[0]],'batch1'),/更换/);
assert.throws(()=>store.submitMakeup(['2026-10-22|t4'],'batch2'),/已使用/);
boot();assert.equal(store.getMakeupStatus().remaining,0);assert.equal(app.globalData.child.points,balance+28);
store.submitMakeup(keys,'batch1');assert.equal(app.globalData.child.points,balance+28);
memory.localAppMode='child';assert(store.getSmartReminders().every(item=>['checkin','makeup'].includes(item.target)));
memory.localAppMode='parent';
store.getTodayTasks().filter(item=>!item.done).forEach(item=>store.setTaskDone(item.id,true));
assert(!store.getSmartReminders().some(item=>item.target==='checkin'));
const extra=store.addCustomTask({name:'新任务',points:5,dim:'habit',frequency:'once'});
const reminder=store.getSmartReminders().find(item=>item.target==='checkin');assert(reminder);
store.markReminderRead(reminder.id);assert(store.getSmartReminders().some(item=>item.id===reminder.id)); // 已读不代表已完成。
store.setTaskDone(extra.id,true);assert(!store.getSmartReminders().some(item=>item.target==='checkin'));
let page;global.Page=value=>{page=value;value.setData=values=>Object.assign(value.data,values);};
require('../miniprogram/pages/report/report');page.onShow();assert.equal(page.data.makeupCount,3);assert.equal(page.data.makeupPoints,28);
require('../miniprogram/pages/checkin-record/checkin-record');page.refresh(2026,9);assert(page.data.calendar.find(item=>item.day===20).done);
// 正常打过卡的七天窗口不能使用集中补卡。
const makeup=require('../miniprogram/utils/task-makeup');
eligibleJournal.externalDays=['2026-10-26'];assert(!makeup.status(eligibleJournal,'2026-10-27').eligible);
const journal=clone(app.globalData._ci.taskJournal);journal.makeup={used:0,batches:{}};
assert(!makeup.status(journal,'2026-10-28').eligible);
for(const route of ['pages/makeup-checkin/makeup-checkin','pages/tasks/tasks','pages/checkin-record/checkin-record','pages/report/report']){
 const text=fs.readFileSync('miniprogram/'+route+'.wxml','utf8').replace(/<!--[\s\S]*?-->/g,''),stack=[];
 for(const match of text.matchAll(/<\/?([\w-]+)\b[^>]*>/g)){if(match[0].startsWith('</'))assert.equal(stack.pop(),match[1]);else if(!match[0].endsWith('/>'))stack.push(match[1]);}assert.equal(stack.length,0);
}
console.log('PASS: seven-day eligibility, known plans, once-only tasks, retired tasks, quota, idempotency, invalid dates, storage failure atomicity, restart, streak separation, reminder lifecycle, report and calendar');
// 页面层：批量选择、消费次数确认与重复点击防护。
const realStatus=store.getMakeupStatus,realSubmit=store.submitMakeup;
store.getMakeupStatus=()=>({eligible:true,remaining:1,reason:'',items:[{key:'k1',date:'2026-10-20',name:'运动',points:10},{key:'k2',date:'2026-10-21',name:'阅读',points:5}]});
let submitted,modal,modalCount=0;
store.submitMakeup=(keys,id)=>{submitted={keys,id};return{count:keys.length,points:15};};
global.wx.showModal=options=>{modal=options;modalCount++;};global.wx.showToast=()=>{};
require('../miniprogram/pages/makeup-checkin/makeup-checkin');page.onShow();page.selectAll();
assert.equal(page.data.selectedCount,2);assert.equal(page.data.selectedPoints,15);
page.submit();page.submit();assert.equal(modalCount,1);assert(modal.content.includes('使用 1 次'));
modal.success({confirm:true});modal.complete();assert.deepEqual(submitted.keys,['k1','k2']);assert(submitted.id);
assert.equal(page.data.selectedCount,0);assert(!page.data.submitting);
store.getMakeupStatus=realStatus;store.submitMakeup=realSubmit;
console.log('PASS: makeup page selection, confirmation, request identity and duplicate-dialog protection');
// 补卡推进当前阶段，但不把后来解锁的新阶段倒排到历史日期。
Object.keys(memory).forEach(key=>delete memory[key]);memory.signed=true;
now=new RealDate(2026,9,19,12).getTime();boot();
const goal=store.createGrowthGoal({dim:'heart'}),oldStageTask=goal.taskId;
now=new RealDate(2026,9,27,12).getTime();store.getTodayTasks();
store.submitMakeup(['2026-10-20|'+oldStageTask,'2026-10-21|'+oldStageTask,'2026-10-22|'+oldStageTask],'goal-batch');
const updated=store.getGrowthGoals().find(item=>item.id===goal.id);
assert.equal(updated.currentStage,1);assert.notEqual(updated.taskId,oldStageTask);
assert.equal(store.getTaskHistory().filter(item=>item.taskId===oldStageTask&&item.source==='makeup').length,3);
assert(!store.getMakeupStatus().items.some(item=>item.id===updated.taskId));
const goalBalance=app.globalData.child.points;boot();assert.equal(app.globalData.child.points,goalBalance);
console.log('PASS: makeup goal progression, no retroactive future-stage assignments and restart reconstruction');
