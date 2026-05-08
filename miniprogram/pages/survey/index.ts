import { getLatestPreference, addPreference, updatePreference } from '../../services/preference';
import type { PreferenceParams } from '../../types/preference';

Page({
  data: {
    mode: '',
    preferenceId: 0,
    currentStep: 1,
    // Step 1: intensity selection
    selectedIntensity: 'steady',
    intensityOptions: [
      { id: 'leisure', title: '悠闲漫步', desc: '轻量步行，风景路线，坡度极小。', icon: 'http://localhost:3845/assets/505c117a2da087e1c9b7a051901d5d250c90fa50.svg' },
      { id: 'steady', title: '稳健探索', desc: '适度远足，2-4小时持续运动。', icon: 'http://localhost:3845/assets/dfa9abe6e76a2c2a741b8b42890886ca86f3bb6e.svg' },
      { id: 'energetic', title: '能量爆发', desc: '陡峭攀登，地形多变，强度较高。', icon: 'http://localhost:3845/assets/166b4e5d7174263b18e2a1047c095804dff7a990.svg' },
      { id: 'extreme', title: '极限先锋', desc: '巅峰表现，耐力挑战，技术路线。', icon: 'http://localhost:3845/assets/bf8367246f1e9382b9405a7d8fd5b1c9d5127375.svg' },
    ],
    // Step 2: food & accommodation
    selectedFood: 'light',
    foodOptions: [
      { id: 'spicy', label: '麻辣鲜香', icon: 'http://localhost:3845/assets/719c2329806755e3a4189afe0557d832c546fb37.svg' },
      { id: 'light', label: '清淡健康', icon: 'http://localhost:3845/assets/d832f30c5b1e23bdb6c0958d25d30221ad960563.svg' },
      { id: 'street', label: '地道街味', icon: 'http://localhost:3845/assets/2e72d9e21b181147ad9751d41d1e5296d62a83ba.svg' },
      { id: 'gourmet', label: '精致探店', icon: 'http://localhost:3845/assets/fa3db80cd866839d27224a87a43b0e7d675a3da5.svg' },
    ],
    selectedAccom: 'heritage',
    accomOptions: [
      { id: 'budget', label: '经济实用', image: 'http://localhost:3845/assets/27b254f67ace60d704b8f00aa6798a31309e7655.png' },
      { id: 'heritage', label: '精品人文', image: 'http://localhost:3845/assets/356fc2c96cf0b956e35ec659c965ad82e7530c2c.png' },
      { id: 'camping', label: '星空露营', image: 'http://localhost:3845/assets/fef5cd82d7957d1081014078d240b4fdf96e0dbd.png' },
      { id: 'luxury', label: '奢华私密', image: 'http://localhost:3845/assets/84ab262a0e6f05651c4ffc932c57a66eb9f68e7c.png' },
    ],
    // Step 3: soul / travel spirit
    selectedSoul: [] as string[],
    soulOptions: [
      { id: 'lens', label: '光影镜头', icon: 'http://localhost:3845/assets/937bbfafeb5ce11dbccfac790309b6d89741fb19.svg' },
      { id: 'history', label: '历史猎人', icon: 'http://localhost:3845/assets/43ca541c0239f8d2238921e5f2fd4c7a9b3f989.svg' },
      { id: 'nature', label: '自然之声', icon: 'http://localhost:3845/assets/a5dd129f3257a247ec84a75357988119ffbe4452.svg' },
      { id: 'local', label: '地道秘境', icon: 'http://localhost:3845/assets/e81c160c29b890c7c75fe41d6c1a9d0716fdec95.svg' },
    ],
    blindMode: 'full',
  },

  onLoad(options: any) {
    if (options?.mode === 'edit') {
      this.setData({ mode: 'edit' });
      this.loadExistingPreference();
    }
  },

  async loadExistingPreference() {
    try {
      const res = await getLatestPreference();
      const pref = res.data;
      if (pref) {
        this.setData({
          preferenceId: pref.preferenceId || 0,
          selectedIntensity: pref.stamina || 'steady',
          selectedFood: pref.foodLikes || 'light',
          selectedAccom: pref.stayPref || 'heritage',
          selectedSoul: pref.travelLikes ? pref.travelLikes.split(',') : [],
          blindMode: pref.healthTags || 'full',
        });
      }
    } catch (err) {
      console.error('Failed to load preference:', err);
    }
  },

  onSelectIntensity(e: any) {
    this.setData({ selectedIntensity: e.currentTarget.dataset.id })
  },

  onSelectFood(e: any) {
    this.setData({ selectedFood: e.currentTarget.dataset.id })
  },

  onSelectAccom(e: any) {
    this.setData({ selectedAccom: e.currentTarget.dataset.id })
  },

  onSelectSoul(e: any) {
    const id = e.currentTarget.dataset.id
    const selected = [...this.data.selectedSoul]
    const idx = selected.indexOf(id)
    if (idx >= 0) {
      selected.splice(idx, 1)
    } else {
      selected.push(id)
    }
    this.setData({ selectedSoul: selected })
  },

  onSelectBlindMode(e: any) {
    this.setData({ blindMode: e.currentTarget.dataset.mode })
  },

  onNext() {
    const { currentStep } = this.data
    if (currentStep < 3) {
      this.setData({ currentStep: currentStep + 1 })
    } else {
      this.submitPreference()
    }
  },

  async submitPreference() {
    const { mode, preferenceId, selectedIntensity, selectedFood, selectedAccom, selectedSoul, blindMode } = this.data;
    const params: any = {
      stamina: selectedIntensity,
      foodLikes: selectedFood,
      stayPref: selectedAccom,
      travelLikes: selectedSoul.join(','),
      healthTags: blindMode,
    };

    try {
      if (mode === 'edit' && preferenceId) {
        params.preferenceId = preferenceId;
        await updatePreference(params);
      } else {
        await addPreference(params);
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
    } catch (err) {
      console.error('Failed to save preference:', err);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  onBack() {
    const { currentStep } = this.data
    if (currentStep > 1) {
      this.setData({ currentStep: currentStep - 1 })
    } else {
      wx.navigateBack({ delta: 1 })
    }
  },
})
