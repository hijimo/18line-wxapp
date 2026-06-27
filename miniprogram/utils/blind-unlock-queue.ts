const STORAGE_KEY = 'blind_pending_unlock_queue';
const MAX_QUEUE_LENGTH = 20;
const VALIDITY_MS = 30 * 60 * 1000; // 30 minutes

export interface PendingUnlock {
  itineraryId: number;
  dayId: number;
  attractionId: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

function getQueue(): PendingUnlock[] {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: PendingUnlock[]) {
  wx.setStorageSync(STORAGE_KEY, queue);
}

export function pushPendingUnlock(item: PendingUnlock) {
  const queue = getQueue();
  queue.push(item);
  // FIFO eviction
  while (queue.length > MAX_QUEUE_LENGTH) {
    queue.shift();
  }
  saveQueue(queue);
}

export function getPendingUnlocks(): PendingUnlock[] {
  const now = Date.now();
  const queue = getQueue().filter((item) => now - item.timestamp < VALIDITY_MS);
  saveQueue(queue);
  return queue;
}

export function removePendingUnlock(attractionId: number) {
  const queue = getQueue().filter((item) => item.attractionId !== attractionId);
  saveQueue(queue);
}

export function clearExpiredUnlocks() {
  const now = Date.now();
  const queue = getQueue().filter((item) => now - item.timestamp < VALIDITY_MS);
  saveQueue(queue);
}

let networkWatcherStarted = false;

export function startNetworkWatcher(retryFn: (item: PendingUnlock) => Promise<boolean>) {
  if (networkWatcherStarted) return;
  networkWatcherStarted = true;

  wx.onNetworkStatusChange((res) => {
    if (res.isConnected) {
      retryPendingUnlocks(retryFn);
    }
  });
}

async function retryPendingUnlocks(retryFn: (item: PendingUnlock) => Promise<boolean>) {
  const items = getPendingUnlocks();
  for (let i = 0; i < items.length; i++) {
    try {
      const success = await retryFn(items[i]);
      if (success) {
        removePendingUnlock(items[i].attractionId);
      }
    } catch {
      // keep in queue for next retry
    }
  }
}
