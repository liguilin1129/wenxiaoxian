const MOCK_FEED = [
  { id: '1', name: '贤妈', avatar: '贤', text: '小贤这周连续晨读经典 5 天，专注力肉眼可见地提升啦📖', time: '10 分钟前', likes: 12, comments: 3, liked: false, tag: '打卡' },
  { id: '2', name: '乐乐爸', avatar: '乐', text: '分享一个亲子沟通小技巧：多用「我看到…」句式，少说「你为什么…」，孩子更愿意听。', time: '1 小时前', likes: 28, comments: 9, liked: false, tag: '经验' },
  { id: '3', name: '糖糖妈', avatar: '糖', text: '今天带娃完成好习惯挑战，顺利兑换了心心念念的乐高🎉 积分制真香！', time: '今天 09:20', likes: 45, comments: 6, liked: false, tag: '成长' }
];

function getCommunityFeed() {
  const user = wx.getStorageSync('communityUserPosts') || [];
  return user.concat(MOCK_FEED).map(item => Object.assign({}, item, { id: String(item.id) }));
}

function findCommunityPost(id) {
  return getCommunityFeed().find(item => String(item.id) === String(id)) || null;
}

module.exports = { getCommunityFeed, findCommunityPost };
