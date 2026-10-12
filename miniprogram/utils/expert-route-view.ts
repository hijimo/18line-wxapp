/**
 * 达人路线卡片视图模型 —— pages/expert 与 pages/expert-favorites 共用。
 *
 * 组件 components/expert-route-card 只负责渲染，所有「拼文案 / 兜底占位」都在这里做完，
 * 好处是两个页面的卡片表现完全一致，且收藏乐观更新只需改 favorited / favoriteCount 两个字段。
 */
import type { ExpertRouteListItem } from '../types/expert-route';

/**
 * 收藏爱心图标（lucide heart，设计文档 §19.2）。
 *
 * 按 AGENTS.md，assets/images 的图片运行时优先走 OSS 在线地址；但这两个 svg 是否已
 * `pnpm upload:assets` 上传由发版流程决定，所以调用方统一用 OSS 地址 + `binderror`
 * 回落到包内本地同名文件，保证「已上传」和「还没上传」两种状态都不会出现空白图标。
 * 激活色 #944a00 已烧进 icon-heart-filled.svg（design.md 点名 secondary 用于爱心理态）。
 */
export const HEART_ICONS = {
  ossOutline:
    'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/icon-heart.svg',
  ossFilled:
    'https://travel18.oss-cn-hangzhou.aliyuncs.com/assets/images/icon-heart-filled.svg',
  localOutline: '/assets/images/icon-heart.svg',
  localFilled: '/assets/images/icon-heart-filled.svg',
} as const;

export interface ExpertRouteCardView extends ExpertRouteListItem {
  /** 卡片底部文案：`3 天 · 12 个景点`（§19.3 C12） */
  metaText: string;
  /** 无封面时用标题首字占位，避免灰块 */
  coverFallback: string;
  /** 达人昵称，缺失时兜底为「达人」 */
  authorText: string;
  /** 无头像时的首字占位 */
  authorFallback: string;
  coverUrl: string;
  regionName: string;
  intro: string;
  favoriteCount: number;
  favorited: boolean;
}

/** `dayCount` / `attractionCount` → 「N 天 · M 个景点」；两者都缺时返回空串（卡片不渲染该行） */
export function buildExpertMetaText(
  dayCount?: number | null,
  attractionCount?: number | null,
): string {
  const parts: string[] = [];
  if (dayCount) parts.push(`${dayCount} 天`);
  if (attractionCount) parts.push(`${attractionCount} 个景点`);
  return parts.join(' · ');
}

export function toExpertRouteCardView(
  item: ExpertRouteListItem,
): ExpertRouteCardView {
  const title = item.routeTitle || '未命名路线';
  const author = item.authorNickname || '达人';
  return {
    ...item,
    routeTitle: title,
    coverUrl: item.coverUrl || '',
    // regionName 是服务端解析好的**名称**（契约 B6），前端只做空值兜底，绝不显示编码
    regionName: item.regionName || '',
    intro: item.intro || '',
    metaText: buildExpertMetaText(item.dayCount, item.attractionCount),
    coverFallback: title.charAt(0),
    authorText: author,
    authorFallback: author.charAt(0),
    favoriteCount: Number(item.favoriteCount || 0),
    favorited: item.favorited === true,
  };
}
