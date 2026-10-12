import { getMyRewardOrders } from '../../services/reward';
import type { RewardOrderRecord, RewardOrderStatus } from '../../types/reward';

const PAGE_SIZE = 15;

/**
 * order_status → 用户可读文案与色调。
 * 取值对应后端 RewardConstants.ORDER_STATUS_*，与设计文档 §6.2 状态机一致。
 */
const STATUS_MAP: Record<RewardOrderStatus, { label: string; tone: string }> = {
  '0': { label: '待支付', tone: 'muted' },
  '1': { label: '处理中', tone: 'pending' },
  '2': { label: '已完成', tone: 'success' },
  '3': { label: '已关闭', tone: 'muted' },
  '4': { label: '退款中', tone: 'pending' },
  '5': { label: '已退款', tone: 'muted' },
  '6': { label: '退款异常', tone: 'warning' },
};

interface RecordView {
  key: string;
  orderNo: string;
  tierName: string;
  amountText: string;
  statusLabel: string;
  statusTone: string;
  timeText: string;
  /**
   * 业务关联锚点（契约 §1 W7~W9）：达人单 expertRouteId 有值且 lineId 为 null；
   * 线路单相反。点击卡片据此决定跳达人路线详情还是线路详情。
   */
  lineId: number | null;
  expertRouteId: number | null;
}

/** 分 → 元展示，避免出现「100分」这类用户看不懂的数字 */
function formatAmount(fen?: number): string {
  if (typeof fen !== 'number' || isNaN(fen)) return '--';
  return `¥${(fen / 100).toFixed(fen % 100 === 0 ? 0 : 2)}`;
}

/** 后端返回 'yyyy-MM-dd HH:mm:ss'，只取到分钟即可，秒对用户无意义 */
function formatTime(value?: string | null): string {
  if (!value) return '';
  const matched = String(value).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  return matched ? `${matched[1]} ${matched[2]}` : String(value);
}

function toView(row: RewardOrderRecord, idx: number): RecordView {
  const status = (row.orderStatus || '0') as RewardOrderStatus;
  const meta = STATUS_MAP[status] || { label: '未知状态', tone: 'muted' };
  return {
    // 同一订单号可能因分页重排出现，用 orderNo + 下标兜底保证 key 唯一
    key: `${row.orderNo || row.outTradeNo || 'row'}-${idx}`,
    orderNo: row.orderNo || row.outTradeNo || '',
    tierName: row.tierName || '打赏',
    amountText: formatAmount(row.actualPriceFen),
    statusLabel: meta.label,
    statusTone: meta.tone,
    timeText: formatTime(row.paidTime || row.createTime),
    // ?? 而不是 ||：0 不是合法 ID，但 null/undefined 才是「没有该锚点」的语义
    lineId: row.lineId ?? null,
    expertRouteId: row.expertRouteId ?? null,
  };
}

Page({
  data: {
    lineId: 0,
    expertRouteId: 0,
    records: [] as RecordView[],
    pageNum: 1,
    total: 0,
    loading: false,
    finished: false,
    loaded: false,
  },

  onLoad(query: any) {
    const lineId = Number(query?.lineId || 0);
    // expertRouteId 与 lineId 同为可选过滤锚点；0 / 缺省 = 不传 = 查全部（语义同 lineId）
    const expertRouteId = Number(query?.expertRouteId || 0);
    this.setData({ lineId, expertRouteId });
    this.fetchRecords(true);
  },

  onPullDownRefresh() {
    this.fetchRecords(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.loading || this.data.finished) return;
    this.fetchRecords(false);
  },

  async fetchRecords(reset: boolean) {
    if (this.data.loading) return;

    const nextPage = reset ? 1 : this.data.pageNum + 1;
    this.setData({ loading: true });

    try {
      const params: {
        lineId?: number;
        expertRouteId?: number;
        pageNum?: number;
        pageSize?: number;
      } = {
        pageNum: nextPage,
        pageSize: PAGE_SIZE,
      };
      // lineId 为 0 时不传，表示查全部线路的打赏记录。
      // 不能写成 lineId: this.data.lineId || undefined —— wx.request 会拼成字面量
      // "undefined"，后端 Long 类型转换失败直接返回 400，整页拉不到数据
      if (this.data.lineId) params.lineId = this.data.lineId;
      // expertRouteId 同上：0 / 缺省时不传该字段
      if (this.data.expertRouteId) params.expertRouteId = this.data.expertRouteId;
      const res = await getMyRewardOrders(params);
      const rows: RewardOrderRecord[] = (res as any)?.rows || [];
      const total = Number((res as any)?.total || 0);
      const baseIndex = reset ? 0 : this.data.records.length;
      const views = rows.map((row, i) => toView(row, baseIndex + i));
      const merged = reset ? views : this.data.records.concat(views);

      this.setData({
        records: merged,
        pageNum: nextPage,
        total,
        finished: merged.length >= total || rows.length === 0,
        loading: false,
        loaded: true,
      });
    } catch (err) {
      console.error('加载打赏记录失败:', err);
      this.setData({ loading: false, loaded: true });
    }
  },

  /**
   * 点击记录卡 → 按返回体的业务锚点跳对应详情页。
   *
   * ⚠️ 达人单 lineId 为 null：此时**绝不能**拿 lineId 去跳线路详情（会打开 id=0 的坏页面），
   *    必须走 expertRouteId。两个锚点都为空（历史脏数据）时不跳，宁可不响应。
   */
  onRecordTap(e: any) {
    const index = Number(e?.currentTarget?.dataset?.index ?? -1);
    const record = this.data.records[index];
    if (!record) return;
    if (record.expertRouteId) {
      wx.navigateTo({
        url: `/pages/expert-detail/index?routeId=${record.expertRouteId}`,
      });
      return;
    }
    if (record.lineId) {
      wx.navigateTo({ url: `/pages/line-detail/index?lineId=${record.lineId}` });
    }
  },
});
