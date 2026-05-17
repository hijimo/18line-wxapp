const TENCENT_MAP_KEY = '76EBZ-NWULB-AOWU7-JZ23V-HEIRO-2KBUF';

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface RouteResult {
  points: RoutePoint[];
}

export function getWalkingRoute(
  from: RoutePoint,
  to: RoutePoint,
): Promise<RouteResult> {
  return new Promise((resolve) => {
    wx.request({
      url: 'https://apis.map.qq.com/ws/direction/v1/walking/',
      data: {
        from: `${from.latitude},${from.longitude}`,
        to: `${to.latitude},${to.longitude}`,
        key: TENCENT_MAP_KEY,
      },
      success(res: any) {
        const data = res.data;
        if (data.status !== 0 || !data.result?.routes?.length) {
          console.warn('[Map] Route API failed, falling back to straight line');
          resolve({ points: [from, to] });
          return;
        }
        const coors = data.result.routes[0].polyline;
        const points = decodePolyline(coors);
        resolve({ points });
      },
      fail(err: any) {
        console.error('[Map] Request failed:', err);
        resolve({ points: [from, to] });
      },
    });
  });
}

export async function getMultiStopRoute(
  stops: RoutePoint[],
): Promise<RoutePoint[]> {
  if (stops.length < 2) return stops;

  const allPoints: RoutePoint[] = [];

  for (let i = 0; i < stops.length - 1; i++) {
    const result = await getWalkingRoute(stops[i], stops[i + 1]);
    if (i === 0) {
      allPoints.push(...result.points);
    } else {
      allPoints.push(...result.points.slice(1));
    }
  }

  return allPoints;
}

function decodePolyline(encoded: number[]): RoutePoint[] {
  const points: RoutePoint[] = [];
  // 腾讯地图 polyline：前两个值是度单位坐标，后续值是相对前一个同轴坐标的微度差值。
  const decoded = [...encoded];
  for (let i = 2; i < decoded.length; i++) {
    decoded[i] = decoded[i - 2] + decoded[i] / 1e6;
  }

  for (let i = 0; i < decoded.length; i += 2) {
    points.push({
      latitude: decoded[i],
      longitude: decoded[i + 1],
    });
  }
  return points;
}
