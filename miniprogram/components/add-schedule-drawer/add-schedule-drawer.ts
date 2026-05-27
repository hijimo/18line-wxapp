import { getAttractionList } from '../../services/attraction'
import { getAccommodationList } from '../../services/accommodation'
import { getDiningList } from '../../services/dining'
import { getCarList } from '../../services/car'
import { getPhotographyList } from '../../services/photography'
import {
  updateDayAttractions,
  updateDayAccommodation,
  updateDayDining,
  addCar,
  addPhotography,
} from '../../services/itinerary'

type ScheduleTabId = 'attraction' | 'hotel' | 'dining' | 'car' | 'photography'

type TabKeywordMap = Record<ScheduleTabId, string>

const TAB_IDS: ScheduleTabId[] = ['attraction', 'hotel', 'dining', 'car', 'photography']

const LIST_KEY_MAP: Record<ScheduleTabId, string> = {
  attraction: 'attractionList',
  hotel: 'accommodationList',
  dining: 'diningList',
  car: 'carList',
  photography: 'photographyList',
}

const FILTERED_LIST_KEY_MAP: Record<ScheduleTabId, string> = {
  attraction: 'filteredAttractionList',
  hotel: 'filteredAccommodationList',
  dining: 'filteredDiningList',
  car: 'filteredCarList',
  photography: 'filteredPhotographyList',
}

const TAB_LABEL_MAP: Record<ScheduleTabId, string> = {
  attraction: '景点',
  hotel: '住宿',
  dining: '餐饮',
  car: '包车',
  photography: '跟拍',
}

const SEARCH_FIELD_MAP: Record<ScheduleTabId, string[]> = {
  attraction: [
    'attractionName',
    'attractionShortName',
    'attractionBlurb',
    'attractionDescription',
    'city',
    'district',
  ],
  hotel: ['accommodationName', 'accommodationDesc', 'accommodationType', 'address', 'city', 'district'],
  dining: ['diningName', 'diningDesc', 'diningTips', 'diningNature', 'address', 'city', 'district'],
  car: ['nickname', 'carModel', 'introduction', 'contactInfo'],
  photography: ['nickname', 'introduction', 'equipment', 'contactInfo'],
}

const EMPTY_TAB_KEYWORDS = TAB_IDS.reduce((keywords, tab) => {
  keywords[tab] = ''
  return keywords
}, {} as TabKeywordMap)

function normalizeSearchValue(value: unknown) {
  return value === undefined || value === null ? '' : String(value).toLowerCase()
}

function filterDrawerList(list: any[], tab: ScheduleTabId, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) return list

  const fields = SEARCH_FIELD_MAP[tab]
  return list.filter((item) =>
    fields.some((field) => normalizeSearchValue(item?.[field]).includes(normalizedKeyword)),
  )
}

function getSearchPlaceholder(tab: ScheduleTabId) {
  return `搜索${TAB_LABEL_MAP[tab]}名称或关键词`
}

function getSearchEmptyText(tab: ScheduleTabId, keyword: string) {
  return keyword.trim() ? `未找到与“${keyword.trim()}”相关的${TAB_LABEL_MAP[tab]}` : ''
}

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    itineraryId: {
      type: Number,
      value: 0,
    },
    dayNumber: {
      type: Number,
      value: 0,
    },
  },

  data: {
    activeTab: 'attraction',
    tabs: [
      { id: 'attraction', label: '景点' },
      { id: 'hotel', label: '住宿' },
      { id: 'dining', label: '餐饮' },
      { id: 'car', label: '包车' },
      { id: 'photography', label: '跟拍' },
    ],
    attractionList: [] as any[],
    accommodationList: [] as any[],
    diningList: [] as any[],
    carList: [] as any[],
    photographyList: [] as any[],
    filteredAttractionList: [] as any[],
    filteredAccommodationList: [] as any[],
    filteredDiningList: [] as any[],
    filteredCarList: [] as any[],
    filteredPhotographyList: [] as any[],
    tabKeywords: { ...EMPTY_TAB_KEYWORDS } as TabKeywordMap,
    currentKeyword: '',
    currentSearchPlaceholder: getSearchPlaceholder('attraction'),
    searchEmptyText: '',
    listLoading: false,
    mealType: '',
  },

  observers: {
    show(val: boolean) {
      if (val) {
        this.loadTabData()
      } else {
        this.resetKeywordSearch()
      }
    },
  },

  lifetimes: {
    attached() {
      const instance = this as any
      instance._debounceTimer = null
      instance._pendingAttractionIds = [] as number[]
    },
  },

  methods: {
    onTabChange(e: any) {
      const tab = e.currentTarget.dataset.tab as ScheduleTabId
      const keyword = (this.data as any).tabKeywords[tab] || ''
      const listKey = LIST_KEY_MAP[tab]
      const filteredListKey = FILTERED_LIST_KEY_MAP[tab]
      const list = ((this.data as any)[listKey] || []) as any[]
      this.setData({
        activeTab: tab,
        currentKeyword: keyword,
        currentSearchPlaceholder: getSearchPlaceholder(tab),
        searchEmptyText: getSearchEmptyText(tab, keyword),
        [filteredListKey]: filterDrawerList(list, tab, keyword),
      })
      if (listKey && (this.data as any)[listKey].length === 0) {
        this.loadTabData()
      }
    },

    onKeywordInput(e: any) {
      const keyword = e.detail.value || ''
      this.updateKeywordSearch(keyword)
    },

    onKeywordClear() {
      this.updateKeywordSearch('')
    },

    updateKeywordSearch(keyword: string) {
      const activeTab = this.data.activeTab as ScheduleTabId
      const listKey = LIST_KEY_MAP[activeTab]
      const filteredListKey = FILTERED_LIST_KEY_MAP[activeTab]
      const list = ((this.data as any)[listKey] || []) as any[]
      const tabKeywords = {
        ...((this.data as any).tabKeywords as TabKeywordMap),
        [activeTab]: keyword,
      }

      this.setData({
        tabKeywords,
        currentKeyword: keyword,
        searchEmptyText: getSearchEmptyText(activeTab, keyword),
        [filteredListKey]: filterDrawerList(list, activeTab, keyword),
      })
    },

    resetKeywordSearch() {
      this.setData({
        tabKeywords: { ...EMPTY_TAB_KEYWORDS },
        currentKeyword: '',
        currentSearchPlaceholder: getSearchPlaceholder(this.data.activeTab as ScheduleTabId),
        searchEmptyText: '',
        filteredAttractionList: this.data.attractionList,
        filteredAccommodationList: this.data.accommodationList,
        filteredDiningList: this.data.diningList,
        filteredCarList: this.data.carList,
        filteredPhotographyList: this.data.photographyList,
      })
    },

    async loadTabData() {
      const activeTab = this.data.activeTab as ScheduleTabId
      const keyword = ((this.data as any).tabKeywords[activeTab] || '') as string
      this.setData({ listLoading: true })
      try {
        let res: any
        switch (activeTab) {
          case 'attraction':
            res = await getAttractionList()
            this.setData({
              attractionList: res.data || [],
              filteredAttractionList: filterDrawerList(res.data || [], activeTab, keyword),
              searchEmptyText: getSearchEmptyText(activeTab, keyword),
            })
            break
          case 'hotel':
            res = await getAccommodationList()
            this.setData({
              accommodationList: res.data || [],
              filteredAccommodationList: filterDrawerList(res.data || [], activeTab, keyword),
              searchEmptyText: getSearchEmptyText(activeTab, keyword),
            })
            break
          case 'dining':
            res = await getDiningList()
            this.setData({
              diningList: res.data || [],
              filteredDiningList: filterDrawerList(res.data || [], activeTab, keyword),
              searchEmptyText: getSearchEmptyText(activeTab, keyword),
            })
            break
          case 'car':
            res = await getCarList()
            this.setData({
              carList: res.data || [],
              filteredCarList: filterDrawerList(res.data || [], activeTab, keyword),
              searchEmptyText: getSearchEmptyText(activeTab, keyword),
            })
            break
          case 'photography':
            res = await getPhotographyList()
            this.setData({
              photographyList: res.data || [],
              filteredPhotographyList: filterDrawerList(res.data || [], activeTab, keyword),
              searchEmptyText: getSearchEmptyText(activeTab, keyword),
            })
            break
        }
      } catch (err) {
        wx.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.setData({ listLoading: false })
      }
    },

    async onItemSelect(e: any) {
      const { item } = e.currentTarget.dataset
      const { activeTab, itineraryId, dayNumber } = this.data as any
      const instance = this as any

      try {
        switch (activeTab) {
          case 'attraction':
            instance._pendingAttractionIds.push(item.attractionId)
            if (instance._debounceTimer) {
              clearTimeout(instance._debounceTimer)
            }
            instance._debounceTimer = setTimeout(async () => {
              const ids = instance._pendingAttractionIds.join(',')
              await updateDayAttractions({ itineraryId, dayNumber, attractionIds: ids })
              instance._pendingAttractionIds = []
              this.triggerEvent('refresh')
            }, 300)
            return
          case 'hotel':
            await updateDayAccommodation({
              itineraryId,
              dayNumber,
              accommodationId: item.accommodationId,
            })
            break
          case 'dining':
            const { tapIndex } = await new Promise<any>((resolve, reject) => {
              wx.showActionSheet({
                itemList: ['设为早餐', '设为午餐', '设为晚餐'],
                success: resolve,
                fail: reject,
              })
            })
            const mealMap: Record<number, string> = {
              0: 'breakfastId',
              1: 'lunchId',
              2: 'dinnerId',
            }
            const mealKey = mealMap[tapIndex]
            if (mealKey) {
              await updateDayDining({
                itineraryId,
                dayNumber,
                [mealKey]: item.diningId,
              } as any)
            }
            break
          case 'car':
            await addCar({ itineraryId, dayNumber, carId: item.carId })
            break
          case 'photography':
            await addPhotography({ itineraryId, dayNumber, photographyId: item.photographyId })
            break
        }
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.triggerEvent('refresh')
      } catch (err) {
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    },

    onClose() {
      this.triggerEvent('close')
    },
  },
})
