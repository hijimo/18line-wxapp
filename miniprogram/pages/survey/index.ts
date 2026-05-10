import { getLatestPreference, addPreference, updatePreference } from '../../services/preference';
import { getDictBatch } from '../../services/dict';

Page({
  data: {
    mode: '',
    preferenceId: 0,
    currentStep: 1,
    selectedIntensity: '',
    intensityOptions: [] as any[],
    selectedFood: '',
    foodOptions: [] as any[],
    selectedAccom: '',
    accomOptions: [] as any[],
    selectedSoul: [] as string[],
    soulOptions: [] as any[],
    blindMode: '0',
  },

  onLoad(options: any) {
    this.loadDictOptions();
    if (options?.mode === 'edit') {
      this.setData({ mode: 'edit' });
      this.loadExistingPreference();
    }
  },

  async loadDictOptions() {
    try {
      const res = await getDictBatch([
        'travel_stamina',
        'travel_tourist_like',
        'travel_food_like',
        'travel_stay_pref',
      ]);
      const dict = res.data || {};

      const intensityOptions = (dict['travel_stamina'] || []).slice(0, 4).map((d) => ({
        id: d.dictValue,
        title: d.dictLabel,
        desc: d.remark || '',
      }));

      const foodOptions = (dict['travel_food_like'] || []).slice(0, 4).map((d) => ({
        id: d.dictValue,
        label: d.dictLabel,
      }));

      const accomOptions = (dict['travel_stay_pref'] || []).slice(0, 4).map((d) => ({
        id: d.dictValue,
        label: d.dictLabel,
      }));

      const soulOptions = (dict['travel_tourist_like'] || []).slice(0, 4).map((d) => ({
        id: d.dictValue,
        label: d.dictLabel,
      }));

      this.setData({
        intensityOptions,
        foodOptions,
        accomOptions,
        soulOptions,
        selectedIntensity: intensityOptions[0]?.id || '',
        selectedFood: foodOptions[0]?.id || '',
        selectedAccom: accomOptions[0]?.id || '',
      });
    } catch (err) {
      console.error('Failed to load dict options:', err);
    }
  },

  async loadExistingPreference() {
    try {
      const res = await getLatestPreference();
      const pref = res.data;
      if (pref) {
        this.setData({
          preferenceId: pref.preferenceId || 0,
          selectedIntensity: pref.stamina || '',
          selectedFood: pref.foodLikes || '',
          selectedAccom: pref.stayPref || '',
          selectedSoul: pref.travelLikes ? pref.travelLikes.split(',') : [],
          blindMode: pref.blindMode || '0',
        });
      }
    } catch (err) {
      console.error('Failed to load preference:', err);
    }
  },

  onSelectIntensity(e: any) {
    this.setData({ selectedIntensity: e.currentTarget.dataset.id });
  },

  onSelectFood(e: any) {
    this.setData({ selectedFood: e.currentTarget.dataset.id });
  },

  onSelectAccom(e: any) {
    this.setData({ selectedAccom: e.currentTarget.dataset.id });
  },

  onSelectSoul(e: any) {
    const id = e.currentTarget.dataset.id;
    const selected = [...this.data.selectedSoul];
    const idx = selected.indexOf(id);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      selected.push(id);
    }
    this.setData({ selectedSoul: selected });
  },

  onSelectBlindMode(e: any) {
    this.setData({ blindMode: e.currentTarget.dataset.mode });
  },

  onNext() {
    const { currentStep } = this.data;
    if (currentStep < 3) {
      this.setData({ currentStep: currentStep + 1 });
    } else {
      this.submitPreference();
    }
  },

  async submitPreference() {
    const { mode, preferenceId, selectedIntensity, selectedFood, selectedAccom, selectedSoul, blindMode } = this.data;
    const params: any = {
      stamina: selectedIntensity,
      foodLikes: selectedFood,
      stayPref: selectedAccom,
      travelLikes: selectedSoul.join(','),
      blindMode: blindMode,
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
    const { currentStep } = this.data;
    if (currentStep > 1) {
      this.setData({ currentStep: currentStep - 1 });
    } else {
      wx.navigateBack({ delta: 1 });
    }
  },
});
