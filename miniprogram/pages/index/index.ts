Component({
  data: {
    userInfo: {
      avatarUrl: '/assets/images/user-profile.png',
      nickName: '',
    },
    banners: [
      {
        id: 'songyang-3d',
        image: '/assets/images/hero-banner-songyang.png',
        tag: 'NEW EXPEDITION',
        title: '松阳.经典3天2晚\n盲游',
        description: '深入江南最后的秘境，在云端古村开启未知的探索。由寻秘向导为您定制全程惊喜。',
        buttonText: '立即启程',
        priceLabel: 'STARTING FROM',
        price: '¥2,499',
      },
      {
        id: 'lingyin-tour',
        image: '/assets/images/lingyin-temple.png',
        tag: 'HIDDEN JOURNEY',
        title: '灵隐.寻宝之旅',
        description: '跟随千年古刹的指引，在杭州最灵验的寺庙间解锁三件神秘宝物。',
        buttonText: '开始寻宝',
        priceLabel: 'STARTING FROM',
        price: '¥800',
      },
    ],
    journeys: [
      {
        id: 'lingyin',
        title: '灵隐寻宝之旅',
        date: '2025.8.20 - 8.22',
        budget: '¥8000',
        days: [
          { day: 1, label: 'DAY 1', number: '01', status: 'completed' },
          { day: 2, label: 'DAY 2', number: '02', status: 'active' },
          { day: 3, label: 'DAY 3', number: '03', status: 'upcoming' },
        ],
        currentGoal: '永福寺隐秘茶室探寻',
        locations: [
          { image: '/assets/images/lingyin-temple.png' },
          { image: '/assets/images/bamboo-forest.png' },
          { image: '/assets/images/hidden-tea-house.png' },
        ],
      },
      {
        id: 'songyang-blind',
        title: '松阳盲游',
        date: '2025.9.10 - 9.12',
        budget: '¥2499',
        days: [
          { day: 1, label: 'DAY 1', number: '01', status: 'active' },
          { day: 2, label: 'DAY 2', number: '02', status: 'upcoming' },
          { day: 3, label: 'DAY 3', number: '03', status: 'upcoming' },
        ],
        currentGoal: '杨家堂古村探访',
        locations: [
          { image: '/assets/images/yangjiatang.png' },
          { image: '/assets/images/xianfeng-bookstore.png' },
          { image: '/assets/images/huang-family-compound.png' },
        ],
      },
    ],
    inspirationTitle: '地道灵感：探索秘境',
    inspirationCards: [
      {
        id: 'golden-sunset',
        image: '/assets/images/golden-sunset.png',
        rating: '4.9',
        tag: 'PHOTOGRAPHY',
        tagColor: 'green',
        title: '金色落日 (Golden Sunset)',
        description: '在西湖最隐秘的角度，看晚霞染红整座古城。',
      },
      {
        id: 'secret-paddle',
        image: '/assets/images/paddle-boarding.png',
        rating: '4.8',
        tag: 'SPORTY',
        tagColor: 'brown',
        title: '秘境桨板 (Secret Paddle)',
        description: '穿梭在无人的水上森林，感受只有你与自然的静谧。',
      },
      {
        id: 'cloud-trek',
        image: '/assets/images/mountain-trek.png',
        rating: '5.0',
        tag: 'ADVENTUROUS',
        tagColor: 'dark',
        title: '云端漫步 (Cloud Trek)',
        description: '踏上千年古道，感受隐于深山的古朴村落文明。',
      },
    ],
    eggs: [
      {
        id: 'yangjiatang',
        title: '杨家堂 (Yangjiatang)',
        price: '免费',
        description: '江南地区的"布达拉宫"，土黄色的民居错落有致。',
        duration: '1.5h',
        distance: '2.4km',
        image: '/assets/images/yangjiatang.png',
      },
      {
        id: 'xianfeng',
        title: '先锋书店 (Xianfeng)',
        price: '免费',
        description: '陈家铺村里的精神高地，在云雾中阅读时光。',
        duration: '2.0h',
        distance: '3.1km',
        image: '/assets/images/xianfeng-bookstore.png',
      },
      {
        id: 'huang-compound',
        title: '黄家大院',
        price: '¥25',
        description: '木雕艺术的巅峰之作，讲述着松阳望族的兴衰。',
        duration: '1.0h',
        distance: '5.8km',
        image: '/assets/images/huang-family-compound.png',
      },
    ],
    foods: [
      {
        id: 'braised-croaker',
        name: '红烧大黄鱼',
        tag: 'MUST TRY',
        tagType: 'must-try',
        image: '/assets/images/braised-croaker.png',
      },
      {
        id: 'mixed-fish-pot',
        name: '杂鱼煲',
        tag: 'SEASONAL',
        tagType: 'seasonal',
        image: '/assets/images/mixed-fish-pot.png',
      },
    ],
  },
  pageLifetimes: {
    show() {},
  },
  methods: {
    onBannerTap(e: any) {
      const { id } = e.detail
      console.log('Banner tap:', id)
    },
    onViewAll() {
      console.log('View all journeys')
    },
    onInspirationTap(e: any) {
      const { id } = e.detail
      console.log('Inspiration tap:', id)
    },
    onEggTap(e: any) {
      const { id } = e.detail
      console.log('Egg tap:', id)
    },
    onFoodTap(e: any) {
      const { id } = e.detail
      console.log('Food tap:', id)
    },
    onBellTap() {
      console.log('Bell tap')
    },
  },
})