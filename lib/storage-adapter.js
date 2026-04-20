/**
 * GitHub Gist 存储适配器
 * 将用户数据同步到 GitHub Gist，localStorage 作为 fallback
 */

const GIST_FILENAME = 'fund-data.json';
const GIST_ID_KEY = 'gistId';
const SYNC_KEYS = new Set([
  'funds',
  'tags',
  'fundTagLists',
  'favorites',
  'groups',
  'holdings',
  'groupHoldings',
  'pendingTrades',
  'dcaPlans',
  'customSettings',
  'fundDailyEarnings',
]);

let syncTimer = null;

function getToken() {
  if (typeof window === 'undefined') return null;
  return process.env.NEXT_PUBLIC_GIST_TOKEN || '';
}

function getGistId() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(GIST_ID_KEY);
  } catch {
    return null;
  }
}

function setGistId(id) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GIST_ID_KEY, id);
  } catch {
    // ignore
  }
}

async function gistRequest(method, path, body) {
  const token = getToken();
  if (!token) throw new Error('GIST_TOKEN not configured');

  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Gist API error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

async function createGist(data) {
  const gist = await gistRequest('POST', '/gists', {
    description: 'Real-Time Fund Data',
    public: false,
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) },
    },
  });
  setGistId(gist.id);
  return gist;
}

async function updateGist(gistId, data) {
  return gistRequest('PATCH', `/gists/${gistId}`, {
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) },
    },
  });
}

async function readGist(gistId) {
  const gist = await gistRequest('GET', `/gists/${gistId}`);
  const file = gist.files?.[GIST_FILENAME];
  if (!file) return null;
  try {
    return JSON.parse(file.content);
  } catch {
    return null;
  }
}

function buildSyncData() {
  const data = {};
  for (const key of SYNC_KEYS) {
    try {
      const val = localStorage.getItem(key);
      if (val != null) data[key] = JSON.parse(val);
    } catch {
      // ignore parse errors
    }
  }
  data._v = 1;
  data._updatedAt = new Date().toISOString();
  return data;
}

function applySyncData(syncData) {
  if (!syncData || typeof syncData !== 'object') return;
  for (const key of SYNC_KEYS) {
    if (Object.prototype.hasOwnProperty.call(syncData, key)) {
      try {
        const val = syncData[key];
        if (val === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(val));
        }
      } catch {
        // ignore
      }
    }
  }
}

export async function syncToGist() {
  if (typeof window === 'undefined') return;
  const token = getToken();
  if (!token) return;

  try {
    const data = buildSyncData();
    const gistId = getGistId();
    if (gistId) {
      await updateGist(gistId, data);
    } else {
      await createGist(data);
    }
  } catch (e) {
    console.warn('[GistSync] sync failed:', e.message);
  }
}

export function scheduleGistSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncToGist();
    syncTimer = null;
  }, 2000);
}

export async function loadFromGist() {
  if (typeof window === 'undefined') return;
  const token = getToken();
  if (!token) return;

  const gistId = getGistId();
  if (!gistId) return;

  try {
    const data = await readGist(gistId);
    if (data) {
      applySyncData(data);
      window.dispatchEvent(new StorageEvent('storage', { key: '_gistSynced' }));
    }
  } catch (e) {
    console.warn('[GistSync] load failed:', e.message);
  }
}

export function clearGistId() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GIST_ID_KEY);
  } catch {
    // ignore
  }
}
