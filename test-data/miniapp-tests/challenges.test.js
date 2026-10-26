const assert = require('assert');
const fs = require('fs');
let page;
global.Page = value => { page=value; page.setData=values=>Object.assign(page.data,values); };
require('../miniprogram/pages/challenges/challenges');
assert.equal(page.data.activeTab,'official');
page.onLoad({tab:'family'}); assert.equal(page.data.activeTab,'family');
page.onLoad({tab:'invalid'}); assert.equal(page.data.activeTab,'official');
page.onLoad(); assert.equal(page.data.activeTab,'official');
page.selectTab({currentTarget:{dataset:{tab:'family'}}});
assert.equal(page.data.activeTab,'family');
page.selectTab({currentTarget:{dataset:{tab:'invalid'}}});
assert.equal(page.data.activeTab,'family');
page.selectTab({currentTarget:{dataset:{tab:'official'}}});
assert.equal(page.data.activeTab,'official');
const config=JSON.parse(fs.readFileSync('miniprogram/app.json','utf8'));
assert(config.pages.includes('pages/challenges/challenges'));
assert(!config.tabBar.list.some(item=>item.pagePath==='pages/challenges/challenges'));
JSON.parse(fs.readFileSync('miniprogram/pages/challenges/challenges.json','utf8'));
const markup=fs.readFileSync('miniprogram/pages/challenges/challenges.wxml','utf8'), stack=[];
for(const match of markup.matchAll(/<\/?([\w-]+)\b[^>]*>/g)) {
  if(match[0].startsWith('</')) assert.equal(stack.pop(),match[1]);
  else if(!match[0].endsWith('/>')) stack.push(match[1]);
}
assert.equal(stack.length,0);
assert(markup.includes('官方挑战即将开放'));
assert(markup.includes('家庭挑战即将开放'));
let signed=true, url;
require.cache[require.resolve('../miniprogram/utils/store')]={exports:{isSigned:()=>signed}};
global.wx={navigateTo:options=>{url=options.url;}};
require('../miniprogram/pages/growth-bank/growth-bank');
page.goChallenges({currentTarget:{dataset:{tab:'official'}}});
assert.equal(url,'/pages/challenges/challenges?tab=official');
page.goChallenges({currentTarget:{dataset:{tab:'family'}}});
assert.equal(url,'/pages/challenges/challenges?tab=family');
url=null; page.goChallenges({currentTarget:{dataset:{tab:'invalid'}}}); assert.equal(url,null);
signed=false; page.goChallenges({currentTarget:{dataset:{tab:'family'}}}); assert.equal(url,'/pages/login/login');
const bankMarkup=fs.readFileSync('miniprogram/pages/growth-bank/growth-bank.wxml','utf8');
assert(bankMarkup.includes('家庭自定义挑战')); assert(bankMarkup.includes('data-tab="official" bindtap="goChallenges"'));
for(const match of bankMarkup.matchAll(/<\/?([\w-]+)\b[^>]*>/g)) {
  if(match[0].startsWith('</')) assert.equal(stack.pop(),match[1]);
  else if(!match[0].endsWith('/>')) stack.push(match[1]);
}
assert.equal(stack.length,0);
console.log('PASS: challenge subpage registration, tab switching, invalid input and placeholder markup');
