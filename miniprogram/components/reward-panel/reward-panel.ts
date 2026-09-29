import { getRewardTiers } from '../../services/reward';
import { ensureLogin } from '../../utils/ensure-login';
import {
  checkVirtualPaymentCapability,
  getPlatform,
  payLineReward,
} from '../../utils/virtual-payment';
import type { RewardPayStage } from '../../utils/virtual-payment';
import type { RewardTier } from '../../types/reward';

/** 阶段文案，避免在支付过程中界面「看起来卡住」 */
const STAGE_TEXT: Record<RewardPayStage, string> = {
  'creating-order': '正在创建订单…',
  'invoking-payment': '正在拉起支付…',
  confirming: '正在确认结果…',
  done: '',
};

interface TierView extends RewardTier {
  /** 展示用金额，如「¥1」 */
  priceText: string;
  /** 是否测试档位（1分档），加角标提示，避免线上用户误以为是真实档位 */
  isTestTier: boolean;
}

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    /** 打赏的业务关联锚点，缺失时禁止下单 */
    lineId: {
      type: Number,
      value: 0,
    },
    lineName: {
      type: String,
      value: '',
    },
    /** 作者昵称，用于「鼓励一下 XX」文案 */
    authorName: {
      type: String,
      value: '线路作者',
    },
  },

  data: {
    tiers: [] as TierView[],
    selectedCode: '',
    selectedTier: null as TierView | null,
    loading: false,
    paying: false,
    stageText: '',
    /** 环境不支持时展示的原因；为空表示支持 */
    unsupportedReason: '',
    loaded: false,
  },

  observers: {
    show(value: boolean) {
      if (value) {
        this.prepare();
      }
    },
  },

  methods: {
    /** 打开面板时准备环境判定与档位数据 */
    async prepare() {
      const capability = checkVirtualPaymentCapability();
      if (!capability.supported) {
        this.setData({
          unsupportedReason: capability.reason || '当前设备暂不支持',
          tiers: [],
          loaded: true,
        });
        return;
      }
      if (this.data.loaded && this.data.tiers.length > 0) {
        return;
      }
      await this.loadTiers();
    },

    async loadTiers() {
      this.setData({ loading: true, unsupportedReason: '' });
      try {
        const res = await getRewardTiers(getPlatform());
        const list = res?.data || [];
        const tiers: TierView[] = list.map((item) => ({
          ...item,
          priceText: `¥${item.priceYuan}`,
          isTestTier: item.isTest === '1',
        }));
        // 默认选中第一个正式档位，减少一次点击
        const first = tiers.find((t) => !t.isTestTier) || tiers[0] || null;
        this.setData({
          tiers,
          selectedCode: first ? first.tierCode : '',
          selectedTier: first,
          loading: false,
          loaded: true,
        });
      } catch (err) {
        // utils/request 已弹过 toast，这里只收敛状态，避免面板停在 loading
        console.error('加载打赏档位失败:', err);
        this.setData({ tiers: [], loading: false, loaded: true });
      }
    },

    onSelectTier(e: any) {
      if (this.data.paying) return;
      const code = e?.currentTarget?.dataset?.code;
      if (!code) return;
      const tier = this.data.tiers.find((t) => t.tierCode === code) || null;
      this.setData({ selectedCode: code, selectedTier: tier });
    },

    async onConfirm() {
      if (this.data.paying) return;

      const tier = this.data.selectedTier;
      const lineId = this.data.lineId;
      if (!tier) {
        wx.showToast({ title: '请先选择档位', icon: 'none' });
        return;
      }
      if (!lineId) {
        // 没有 lineId 就没有业务关联锚点，后端必然拒单，这里直接拦住
        wx.showToast({ title: '线路信息缺失，无法打赏', icon: 'none' });
        return;
      }

      // 打赏必须有登录态：后端要靠 touristId 找到 openid 与 session_key 算签名
      const loggedIn = await ensureLogin();
      if (!loggedIn) return;

      this.setData({ paying: true, stageText: STAGE_TEXT['creating-order'] });
      const outcome = await payLineReward({
        lineId,
        tierCode: tier.tierCode,
        onStage: (stage) => {
          this.setData({ stageText: STAGE_TEXT[stage] });
        },
      });
      this.setData({ paying: false, stageText: '' });

      this.handleOutcome(outcome, tier);
    },

    handleOutcome(outcome: any, tier: TierView) {
      switch (outcome.status) {
        case 'success':
          wx.showToast({ title: '感谢你的鼓励', icon: 'success' });
          this.triggerEvent('success', {
            lineId: this.data.lineId,
            tierCode: tier.tierCode,
            tierName: tier.tierName,
            actualPriceFen: outcome.order?.actualPriceFen ?? tier.priceFen,
            outTradeNo: outcome.order?.outTradeNo,
          });
          this.triggerEvent('close');
          break;

        case 'pending':
          // 支付已受理但服务端尚未记账（推送/补偿任务会在几分钟内追平）。
          // 这是正常路径，用中性提示，不能报「失败」。
          wx.showModal({
            title: '支付处理中',
            content: outcome.message,
            showCancel: false,
            confirmText: '知道了',
          });
          this.triggerEvent('pending', {
            lineId: this.data.lineId,
            outTradeNo: outcome.outTradeNo,
          });
          this.triggerEvent('close');
          break;

        case 'cancelled':
          // 用户主动取消：不提示、不上报、不关闭面板，方便直接重选档位
          break;

        case 'unsupported':
          wx.showModal({
            title: '暂不支持',
            content: outcome.message,
            showCancel: false,
            confirmText: '知道了',
          });
          break;

        default:
          wx.showToast({
            title: outcome.message || '打赏未完成',
            icon: 'none',
            duration: 3000,
          });
          break;
      }
    },

    onClose() {
      if (this.data.paying) return;
      this.triggerEvent('close');
    },

    noop() {},
  },
});
