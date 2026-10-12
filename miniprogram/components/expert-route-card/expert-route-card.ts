/**
 * 达人路线卡片 —— 达人 tab 双列瀑布流与「我喜欢的路线」单列列表共用。
 *
 * 设计文档：docs/architecture/expert-route-design.md §6.6 / §14.12
 * 视觉规范：.kiro/steering/design.md（纸张层级、24rpx 圆角、No-Line Rule、
 *          爱心激活色 secondary #944a00）
 *
 * ⚠️ 组件只负责渲染，不做任何业务判断：
 *    - `item` 是页面构造好的视图模型（含 metaText / coverFallback / authorText）
 *    - 收藏状态切换由页面做乐观更新 + 失败回滚，组件只把点击事件抛出去
 *
 * ⚠️ 事件名用 `cardtap` / `favoritetap`，**不用 `tap`**：
 *    triggerEvent('tap') 会与原生冒泡的 tap 同时命中父级 bind:tap，导致处理器执行两次。
 * ⚠️ 爱心用 `catchtap`：否则点爱心会连带触发整卡跳详情（§6.6 点名的坑）。
 */

import { HEART_ICONS } from '../../utils/expert-route-view';

Component({
  properties: {
    /** ExpertRouteCardView（由 utils/expert-route-view.ts 构造） */
    item: {
      type: Object,
      value: {},
    },
    /** 是否显示爱心收藏按钮（浏览态可关，收藏页常开） */
    showFavorite: {
      type: Boolean,
      value: true,
    },
    /** 'grid' 双列瀑布流 | 'list' 单列大卡 */
    layout: {
      type: String,
      value: 'grid',
    },
  },

  data: {
    heartOutlineIcon: HEART_ICONS.ossOutline as string,
    heartFilledIcon: HEART_ICONS.ossFilled as string,
  },

  methods: {
    onCardTap() {
      this.triggerEvent('cardtap', { item: this.data.item });
    },

    onFavoriteTap() {
      this.triggerEvent('favoritetap', { item: this.data.item });
    },

    /** OSS 图标不可用时回落到包内本地文件，避免弱网/未上传时爱心空白 */
    onHeartIconError() {
      if (this.data.heartOutlineIcon === HEART_ICONS.localOutline) return;
      this.setData({
        heartOutlineIcon: HEART_ICONS.localOutline,
        heartFilledIcon: HEART_ICONS.localFilled,
      });
    },
  },
});
