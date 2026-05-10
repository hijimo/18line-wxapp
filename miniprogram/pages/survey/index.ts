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
      { id: 'leisure', title: '悠闲漫步', desc: '轻量步行，风景路线，坡度极小。', icon: '/assets/images/icon-intensity-leisure.svg' },
      { id: 'steady', title: '稳健探索', desc: '适度远足，2-4小时持续运动。', icon: '/assets/images/icon-intensity-steady.svg' },
      { id: 'energetic', title: '能量爆发', desc: '陡峭攀登，地形多变，强度较高。', icon: '/assets/images/icon-intensity-energetic.svg' },
      { id: 'extreme', title: '极限先锋', desc: '巅峰表现，耐力挑战，技术路线。', icon: '/assets/images/icon-intensity-extreme.svg' },
    ],
    // Step 2: food & accommodation
    selectedFood: 'light',
    foodOptions: [
      { id: 'spicy', label: '麻辣鲜香', icon: '/assets/images/icon-food-spicy.svg' },
      { id: 'light', label: '清淡健康', icon: '/assets/images/icon-food-light.svg' },
      { id: 'street', label: '地道街味', icon: '/assets/images/icon-food-street.svg' },
      { id: 'gourmet', label: '精致探店', icon: '/assets/images/icon-food-gourmet.svg' },
    ],
    selectedAccom: 'heritage',
    accomOptions: [
      { id: 'budget', label: '经济实用', image: '/assets/images/accom-budget.png' },
      { id: 'heritage', label: '精品人文', image: '/assets/images/accom-heritage.png' },
      { id: 'camping', label: '星空露营', image: '/assets/images/accom-camping.png' },
      { id: 'luxury', label: '奢华私密', image: '/assets/images/accom-luxury.png' },
    ],
    // Step 3: soul / travel spirit
    selectedSoul: [] as string[],
    soulOptions: [
      { id: 'lens', label: '光影镜头', icon: '/assets/images/icon-soul-lens.svg' },
      { id: 'history', label: '历史猎人', icon: '/assets/images/icon-soul-history.svg' },
      { id: 'nature', label: '自然之声', icon: '/assets/images/icon-soul-nature.svg' },
      { id: 'local', label: '地道秘境', icon: '/assets/images/icon-soul-local.svg' },
    ],
    blindMode: 'clear',
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
