const assert = require('assert');
const fs = require('fs');
let page, parent = true, signed = true, url, message;
require.cache[require.resolve('../miniprogram/utils/store')] = { exports: { isSigned: () => signed, isParentMode: () => parent } };
global.Page = value => { page = value; value.setData = values => Object.assign(value.data,values); };
global.wx = { navigateTo: options => { url = options.url; }, showToast: options => { message = options.title; } };
require('../miniprogram/pages/family-education/family-education');
const hub = page; hub.onShow(); assert(hub.data.signed && hub.data.isParent);
assert.deepEqual(hub.data.entries.map(item => item.name), ['家庭会议','成长报告','成长初评','教育模板']);
for (const item of hub.data.entries) { hub.go({currentTarget:{dataset:{key:item.key}}}); assert.equal(url,item.url); }
parent=false; const previous=url; hub.go({currentTarget:{dataset:{key:'meeting'}}}); assert.equal(url,previous); assert(message.includes('家长模式'));
signed=false; hub.go({currentTarget:{dataset:{key:'meeting'}}}); assert.equal(url,'/pages/login/login');
require('../miniprogram/pages/education-templates/education-templates');
page.onShow(); assert(!page.data.allowed);
signed=true; parent=true; page.onShow(); assert(page.data.allowed);
const first=page.data.templates[0]; page.toggle({currentTarget:{dataset:{id:first.id}}}); assert.equal(page.data.expanded,first.id);
page.toggle({currentTarget:{dataset:{id:first.id}}}); assert.equal(page.data.expanded,'');
const config=JSON.parse(fs.readFileSync('miniprogram/app.json','utf8'));
for (const route of ['pages/family-education/family-education','pages/education-templates/education-templates']) {
  assert(config.pages.includes(route));
  for (const ext of ['js','json','wxml','wxss']) assert(fs.existsSync('miniprogram/'+route+'.'+ext));
  const xml=fs.readFileSync('miniprogram/'+route+'.wxml','utf8'), stack=[];
  for (const m of xml.matchAll(/<\/?([\w-]+)\b[^>]*>/g)) {
    if(m[0].startsWith('</')) assert.equal(stack.pop(),m[1]); else if(!m[0].endsWith('/>')) stack.push(m[1]);
  }
  assert.equal(stack.length,0);
}
console.log('PASS: family education routes, login and parent guards, template expansion, page registration and markup');
