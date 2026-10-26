// Entry shell only. Challenge publishing, family creation and participation
// will be connected in a subsequent iteration; no sample activities or rewards.
Page({
  data: { activeTab: 'official' },
  onLoad(options) {
    this.setData({ activeTab: options && options.tab === 'family' ? 'family' : 'official' });
  },
  selectTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === 'official' || tab === 'family') this.setData({ activeTab: tab });
  }
});
