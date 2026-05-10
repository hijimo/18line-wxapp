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
    listLoading: false,
    mealType: '',
  },

  observers: {
    show(val: boolean) {
      if (val) {
        this.loadTabData()
      }
    },
  },

  lifetimes: {
    attached() {
      this._debounceTimer = null
      this._pendingAttractionIds = [] as number[]
    },
  },

  methods: {
    onTabChange(e: any) {
      const tab = e.currentTarget.dataset.tab
      this.setData({ activeTab: tab })
      const listMap: Record<string, string> = {
        attraction: 'attractionList',
        hotel: 'accommodationList',
        dining: 'diningList',
        car: 'carList',
        photography: 'photographyList',
      }
      const listKey = listMap[tab]
      if (listKey && (this.data as any)[listKey].length === 0) {
        this.loadTabData()
      }
    },

    async loadTabData() {
      const { activeTab } = this.data
      this.setData({ listLoading: true })
      try {
        let res: any
        switch (activeTab) {
          case 'attraction':
            res = await getAttractionList()
            this.setData({ attractionList: res.data || [] })
            break
          case 'hotel':
            res = await getAccommodationList()
            this.setData({ accommodationList: res.data || [] })
            break
          case 'dining':
            res = await getDiningList()
            this.setData({ diningList: res.data || [] })
            break
          case 'car':
            res = await getCarList()
            this.setData({ carList: res.data || [] })
            break
          case 'photography':
            res = await getPhotographyList()
            this.setData({ photographyList: res.data || [] })
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

      try {
        switch (activeTab) {
          case 'attraction':
            this._pendingAttractionIds.push(item.attractionId)
            if (this._debounceTimer) {
              clearTimeout(this._debounceTimer)
            }
            this._debounceTimer = setTimeout(async () => {
              const ids = this._pendingAttractionIds.join(',')
              await updateDayAttractions({ itineraryId, dayNumber, attractionIds: ids })
              this._pendingAttractionIds = []
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
            await addCar(itineraryId, item.carId)
            break
          case 'photography':
            await addPhotography(itineraryId, item.photographyId)
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
