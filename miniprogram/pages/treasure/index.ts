Page({
  data: {
    currentTab: 'nearby',
    currentLocation: '杭州市西湖区',
    nearbyTreasures: [
      {
        id: 'hidden-well',
        name: '隐泉古井',
        hint: '在灵隐寺后山的竹林深处，有一口千年古井...',
        rarity: 'rare',
        rarityLabel: '稀有',
        distance: '1.2km',
      },
      {
        id: 'stone-carving',
        name: '飞来峰石刻',
        hint: '第三层石窟中隐藏着一处不为人知的宋代石刻',
        rarity: 'epic',
        rarityLabel: '史诗',
        distance: '2.4km',
      },
      {
        id: 'tea-garden',
        name: '秘境茶园',
        hint: '龙井村最高处的一片私人茶园，只有本地人知道',
        rarity: 'common',
        rarityLabel: '普通',
        distance: '3.8km',
      },
      {
        id: 'ancient-bridge',
        name: '断桥残雪秘境',
        hint: '断桥下方有一条隐秘的石阶通往湖心小岛',
        rarity: 'rare',
        rarityLabel: '稀有',
        distance: '4.1km',
      },
      {
        id: 'bamboo-path',
        name: '云栖竹径暗道',
        hint: '竹林尽头的石壁后，藏着一条通往山顶的古道',
        rarity: 'legendary',
        rarityLabel: '传说',
        distance: '5.6km',
      },
    ],
    myTreasures: [
      {
        id: 'hidden-well',
        name: '隐泉古井',
        hint: '在灵隐寺后山的竹林深处，有一口千年古井...',
        rarity: 'rare',
        rarityLabel: '稀有',
      },
      {
        id: 'bamboo-path',
        name: '云栖竹径暗道',
        hint: '竹林尽头的石壁后，藏着一条通往山顶的古道',
        rarity: 'legendary',
        rarityLabel: '传说',
      },
    ],
    foundTreasures: [] as any[],
  },

  onLoad() {
    // no-op
  },

  switchTab(e: any) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  onTreasureTap(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '宝藏详情开发中', icon: 'none' });
    console.log('Treasure tap:', id);
  },

  onBellTap() {
    wx.showToast({ title: '暂无通知', icon: 'none' });
  },
});
