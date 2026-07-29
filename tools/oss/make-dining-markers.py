#!/usr/bin/env python3
"""生成地图餐饮 marker 图标（刀叉造型水滴 pin）。

产出两个 56x56 PNG（对应 28x28 元素的 2x 图）：
- marker-dining-regular.png  大众常规 diningCategory='0'  森林绿
- marker-dining-local.png    地方特色 diningCategory='1'  日落橙 + 星标

用法：python3 tools/oss/make-dining-markers.py
之后按 AGENTS.md 走 `pnpm upload:assets` 上传到 OSS。
"""
import os

from PIL import Image, ImageDraw

SIZE = 56
SS = 6  # 超采样倍数，最后缩回 SIZE 得到平滑边缘
S = SIZE * SS

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'miniprogram', 'assets', 'images')

REGULAR = {
    'name': 'marker-dining-regular.png',
    'body': (47, 107, 79, 255),      # 森林绿 #2F6B4F
    'edge': (22, 52, 34, 255),       # 深绿描边 #163422
    'star': False,
}
LOCAL = {
    'name': 'marker-dining-local.png',
    'body': (232, 112, 58, 255),     # 日落橙 #E8703A
    'edge': (166, 68, 27, 255),      # 深橙描边
    'star': True,
}

GLYPH = (255, 255, 255, 255)


def rounded_bar(d, cx, top, bottom, width, fill):
    """以 cx 为中心的竖直圆头细条。"""
    half = width / 2
    d.rounded_rectangle(
        [cx - half, top, cx + half, bottom],
        radius=half,
        fill=fill,
    )


def draw_pin(d, spec):
    """水滴形 pin：上部圆 + 下部收尖，锚点在底部尖端。"""
    cx = S * 0.5
    head_cy = S * 0.44
    r = S * 0.335
    tip_y = S * 0.965

    # 描边（先画大一号的同形状）
    for inset, color in ((S * 0.030, spec['edge']), (0, spec['body'])):
        rr = r + inset
        d.ellipse([cx - rr, head_cy - rr, cx + rr, head_cy + rr], fill=color)
        # 尖端三角：与圆相切，避免出现折角
        half = rr * 0.74
        d.polygon(
            [(cx - half, head_cy + rr * 0.60), (cx + half, head_cy + rr * 0.60), (cx, tip_y + inset)],
            fill=color,
        )
    return cx, head_cy


def draw_fork_knife(d, cx, cy):
    """左叉右刀，整体居中于 (cx, cy)。"""
    top = cy - S * 0.175
    bottom = cy + S * 0.175
    tine_w = S * 0.036
    gap = S * 0.055

    # ---- 叉子（左） ----
    fx = cx - S * 0.088
    neck_y = top + (bottom - top) * 0.42
    for k in (-1, 0, 1):
        rounded_bar(d, fx + k * gap, top, neck_y, tine_w, GLYPH)
    # 叉颈：把三根齿连起来
    d.rounded_rectangle(
        [fx - gap - tine_w / 2, neck_y - tine_w * 0.9, fx + gap + tine_w / 2, neck_y + S * 0.030],
        radius=tine_w * 0.8,
        fill=GLYPH,
    )
    rounded_bar(d, fx, neck_y, bottom, tine_w * 1.25, GLYPH)

    # ---- 餐刀（右） ----
    kx = cx + S * 0.092
    blade_bottom = top + (bottom - top) * 0.52
    # 刀背竖直、刀刃外弧
    d.polygon(
        [
            (kx - tine_w * 0.75, top + S * 0.012),
            (kx + tine_w * 0.30, top),
            (kx + tine_w * 0.95, top + S * 0.075),
            (kx + tine_w * 0.75, blade_bottom),
            (kx - tine_w * 0.75, blade_bottom),
        ],
        fill=GLYPH,
    )
    rounded_bar(d, kx, blade_bottom - S * 0.010, bottom, tine_w * 1.15, GLYPH)


def draw_star(d, cx, cy, r):
    """地方特色角标：五角星。"""
    import math

    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = r if i % 2 == 0 else r * 0.46
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, fill=(255, 255, 255, 255))


def build(spec):
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    cx, cy = draw_pin(d, spec)
    draw_fork_knife(d, cx, cy)

    if spec['star']:
        # 右上角星标底衬，保证在浅色地图上也看得清
        bx, by, br = S * 0.795, S * 0.205, S * 0.150
        d.ellipse([bx - br, by - br, bx + br, by + br], fill=spec['edge'])
        draw_star(d, bx, by, br * 0.68)

    out = img.resize((SIZE, SIZE), Image.LANCZOS)
    path = os.path.abspath(os.path.join(OUT_DIR, spec['name']))
    out.save(path, 'PNG', optimize=True)
    print('wrote', path, os.path.getsize(path), 'bytes')


def build_callout_tail():
    """卡片左侧的小尾巴：朝左的白色三角。

    cover-view 对 CSS border 三角支持不可靠，所以用图片来画。
    元素按 6x10 px 显示，这里输出 2x 尺寸。
    """
    w, h = 6 * SS, 10 * SS
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 尖端在左侧垂直中点，底边贴右侧，与卡片白色一致
    d.polygon([(0, h / 2), (w, 0), (w, h)], fill=(255, 255, 255, 255))

    out = img.resize((6 * 2, 10 * 2), Image.LANCZOS)
    path = os.path.abspath(os.path.join(OUT_DIR, 'callout-tail-left.png'))
    out.save(path, 'PNG', optimize=True)
    print('wrote', path, os.path.getsize(path), 'bytes')


if __name__ == '__main__':
    for spec in (REGULAR, LOCAL):
        build(spec)
    build_callout_tail()
