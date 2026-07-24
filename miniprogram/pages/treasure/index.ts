import { getAccommodationList } from '../../services/accommodation'
import { getDiningList } from '../../services/dining'
import { getCarList } from '../../services/car'
import { getPhotographyList } from '../../services/photography'
import type { AccommodationListParams } from '../../types/accommodation'
import type { DiningListParams } from '../../types/dining'
import type { CarListParams } from '../../types/car'
import type { PhotographyListParams } from '../../services/photography'

type ServiceType = 'hotel' | 'dining' | 'car' | 'photography'

const TABS: { id: ServiceType; label: string }[] = [
  { id: 'hotel', label: '住宿' },
  { id: 'dining', label: '餐饮' },
  { id: 'car', label: '包车' },
  { id: 'photography', label: '跟拍' },
]

const REGION_PARAMS = {
  province: '330000',
  city: '331100',
  district: '331124',
}

Page({
  data: {
    tabs: TABS,
    activeType: 'hotel' as ServiceType,
    list: [] as any[],
    loading: false,
    showIntroType: '' as ServiceType | '',
    introData: {} as any,
  },

  onLoad() {
    this.loadList('hotel')
  },

  onTabTap(e: any) {
    const type = e.currentTarget.dataset.type as ServiceType
    if (type === this.data.activeType) return
    this.setData({ activeType: type, list: [] })
    this.loadList(type)
  },

  async loadList(type: ServiceType) {
    this.setData({ loading: true })
    try {
      const params = { ...REGION_PARAMS, pageNum: 1, pageSize: 50 }
      let res: any
      switch (type) {
        case 'hotel':
          res = await getAccommodationList(params as AccommodationListParams)
          break
        case 'dining':
          res = await getDiningList(params as DiningListParams)
          break
        case 'car':
          res = await getCarList(params as CarListParams)
          break
        case 'photography':
          res = await getPhotographyList(params as PhotographyListParams)
          break
      }
      this.setData({ list: res?.rows || [] })
    } catch (err) {
      console.error('[market] loadList error:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onItemTap(e: any) {
    const item = e.currentTarget.dataset.item
    this.setData({
      showIntroType: this.data.activeType,
      introData: item,
    })
  },

  onIntroClose() {
    this.setData({ showIntroType: '', introData: {} })
  },
})
