const assert=require('assert');
const fs=require('fs');
let page,env='release',loginOptions,requestOptions,loginCalls=0,signedCalls=0,toast='',route='';
const memory={},app={globalData:{child:{}}};
const config={USE_CLOUD_HOSTING:true,BASE_URL:''};
const store={login(){signedCalls++;}};
require.cache[require.resolve('../miniprogram/utils/store')]={exports:store};
require.cache[require.resolve('../miniprogram/utils/api-config')]={exports:config};
require.cache[require.resolve('../miniprogram/utils/cloud-hosting')]={exports:{request(options){requestOptions=options;}}};
global.getApp=()=>app;
global.wx={
  getAccountInfoSync:()=>({miniProgram:{envVersion:env}}),
  login:options=>{loginCalls++; loginOptions=options;},
  request:options=>{requestOptions=options;},
  showToast:options=>{toast=options.title;},showModal(){},
  setStorageSync:(key,value)=>{memory[key]=value;}, removeStorageSync:key=>{delete memory[key];},
  reLaunch:options=>{route=options.url;},switchTab:options=>{route=options.url;}
};
global.Page=value=>{page=value;page.setData=values=>Object.assign(page.data,values);};
require('../miniprogram/pages/login/login');
page.onLoad();assert(!page.data.showDevelopmentPreview);
env='develop';page.onLoad();assert(page.data.showDevelopmentPreview);
page.toggleProfile();assert(page.data.showProfile);
page.onChooseAvatar({detail:{avatarUrl:'test-avatar'}});assert.equal(page.data.avatarUrl,'test-avatar');
page.onNickname({detail:{value:'  测试家长  '}});assert.equal(page.data.nickname,'测试家长');
page.data.nickname='';
page.onWechatLogin();assert.equal(loginCalls,1);assert(page.data.submitting);assert.equal(signedCalls,0);
page.onWechatLogin();assert.equal(loginCalls,1);
page.toggleProfile();assert(page.data.showProfile);
loginOptions.success({code:'test-code'});
assert.equal(requestOptions.path,'/api/auth/wechat/login');
assert.equal(requestOptions.data.loginCode,'test-code');
assert.equal(requestOptions.data.profile.nickname,''); // Profile fields are optional.
assert.equal(signedCalls,0); // A wx.login code alone does not authenticate the app.
requestOptions.success({data:{ok:false,error:{message:'测试认证失败'}}});
assert(!page.data.submitting);assert.equal(signedCalls,0);assert.equal(toast,'测试认证失败');
page.onWechatLogin();loginOptions.success({});assert(!page.data.submitting);assert.equal(signedCalls,0);
const originalError=console.error;console.error=()=>{};
page.onWechatLogin();loginOptions.fail({errMsg:'test failure'});assert(!page.data.submitting);assert.equal(signedCalls,0);
page.onWechatLogin();loginOptions.success({code:'test-code'});
requestOptions.fail({errMsg:'test network failure'});
assert(!page.data.submitting);assert.equal(signedCalls,0); // Never silently fall back to local login.
console.error=originalError;
page.onWechatLogin();loginOptions.success({code:'test-code'});
requestOptions.success({data:{ok:true,user:{id:'test-user'},token:'test-token',expiresAt:123}});
assert.equal(signedCalls,1);assert.equal(memory.authToken,'test-token');
assert.equal(memory.childProfile.name,'微信用户');assert.equal(route,'/pages/index/index');assert(!page.data.submitting);
config.USE_CLOUD_HOSTING=false;config.BASE_URL='https://example.invalid';
page.onWechatLogin();loginOptions.success({code:'direct-code'});
assert.equal(requestOptions.url,'https://example.invalid/api/auth/wechat/login');
requestOptions.success({data:{ok:false}});assert(!page.data.submitting);
config.BASE_URL='';const previousLoginCalls=loginCalls;
page.onWechatLogin();assert.equal(loginCalls,previousLoginCalls);assert(!page.data.submitting);
env='release';page.onDevelopmentPreview();assert.equal(signedCalls,1);assert.equal(memory.authToken,'test-token');
env='develop';page.onDevelopmentPreview();assert.equal(signedCalls,2);assert.equal(memory.authToken,undefined);
assert.equal(memory.authExpiresAt,undefined);assert.equal(loginCalls,previousLoginCalls);
route='';const previousSigned=signedCalls;page.skipLogin();
assert.equal(route,'/pages/index/index');assert.equal(signedCalls,previousSigned);
page.data.submitting=true;route='';page.skipLogin();assert.equal(route,'');
const markup=fs.readFileSync('miniprogram/pages/login/login.wxml','utf8'),stack=[];
assert(markup.includes('微信登录'));assert(markup.includes('暂不登录'));assert(markup.includes('选填'));
assert(!markup.includes('getPhoneNumber'));assert(!markup.includes('getUserInfo'));
for(const match of markup.matchAll(/<\/?([\w-]+)\b[^>]*>/g)){
 if(match[0].startsWith('</'))assert.equal(stack.pop(),match[1]);
 else if(!match[0].endsWith('/>'))stack.push(match[1]);
}
assert.equal(stack.length,0);
assert.equal(JSON.parse(fs.readFileSync('miniprogram/pages/login/login.json','utf8')).navigationBarBackgroundColor,'#FFFFFF');
console.log('PASS: minimal login UI, optional profile, duplicate guard, real cloud/direct request, failures without local fallback, token persistence, explicit develop-only preview and skip');
