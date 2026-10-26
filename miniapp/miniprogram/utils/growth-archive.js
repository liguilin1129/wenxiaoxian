const KEY = 'growthArchives';
const MAX_RECORDS = 52;

function list() {
  const value = wx.getStorageSync(KEY);
  return Array.isArray(value) ? value : [];
}

function save(snapshot) {
  const records = list();
  const record = Object.assign({}, snapshot, { id: 'archive_' + Date.now() });
  records.unshift(record);
  wx.setStorageSync(KEY, records.slice(0, MAX_RECORDS));
  return record;
}

function remove(id) {
  wx.setStorageSync(KEY, list().filter(item => item.id !== id));
}

module.exports = { list, save, remove };
