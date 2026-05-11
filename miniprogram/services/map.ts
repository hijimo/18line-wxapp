const TENCENT_MAP_KEY = '76EBZ-NWULB-AOWU7-JZ23V-HEIRO-2KBUF';

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface DrivingRouteResult {
  points: RoutePoint[];
}

export function getDrivingRoute(
  from: RoutePoint,
  to: RoutePoint,
): Promise<DrivingRouteResult> {
  console.log('[Map] getDrivingRoute called:', from, '->', to);
  return new Promise((resolve) => {
    wx.request({
      url: 'https://apis.map.qq.com/ws/direction/v1/driving/',
      data: {
        from: `${from.latitude},${from.longitude}`,
        to: `${to.latitude},${to.longitude}`,
        key: TENCENT_MAP_KEY,
      },
      success(res: any) {
        const data = res.data;
        console.log('[Map] API response status:', data.status, 'message:', data.message);
        if (data.status !== 0 || !data.result?.routes?.length) {
          console.warn('[Map] Route API failed, falling back to straight line');
          resolve({ points: [from, to] });
          return;
        }
        const polyline = data.result.routes[0].polyline;
        const points = decodePolyline(polyline);
        console.log('[Map] Got route with', points.length, 'points');
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
    const result = await getDrivingRoute(stops[i], stops[i + 1]);
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
  let lat = 0;
  let lng = 0;

  for (let i = 0; i < encoded.length; i += 2) {
    lat += encoded[i];
    lng += encoded[i + 1];
    points.push({
      latitude: lat / 1e6,
      longitude: lng / 1e6,
    });
  }

  return points;
}
