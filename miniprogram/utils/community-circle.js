function call(action, data) {
  return new Promise(resolve => wx.cloud.callFunction({ name: 'communityCircle', data: Object.assign({ action }, data || {}), success: r => resolve(r.result || { ok: false, error: '服务无响应' }), fail: () => resolve({ ok: false, error: '无法连接成长圈服务' }) }));
}
module.exports = { get: () => call('get'), create: name => call('create', { name }), join: inviteCode => call('join', { inviteCode }), update: (name, renewInviteCode) => call('update', { name, renewInviteCode: !!renewInviteCode }) };
