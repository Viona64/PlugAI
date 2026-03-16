/* ============================================
   PlugAI — Shared client state (no backend)
   ============================================ */

const STORAGE_PREFIX = 'plugai.';

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function randomBase36(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function getSession() {
  const raw = localStorage.getItem(STORAGE_PREFIX + 'session');
  return raw ? safeJsonParse(raw, null) : null;
}

export function setSession(session) {
  localStorage.setItem(STORAGE_PREFIX + 'session', JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_PREFIX + 'session');
}

export function requireAuth({ redirectTo = 'login.html', returnTo = null } = {}) {
  const session = getSession();
  if (!session) {
    const url = new URL(redirectTo, window.location.href);
    const rt = returnTo || window.location.pathname.split('/').pop() || 'index.html';
    url.searchParams.set('returnTo', rt);
    window.location.replace(url.toString());
    return null;
  }
  return session;
}

export function getApiKeys() {
  const raw = localStorage.getItem(STORAGE_PREFIX + 'apikeys');
  const keys = raw ? safeJsonParse(raw, []) : [];
  if (!Array.isArray(keys)) return [];
  return keys;
}

export function setApiKeys(keys) {
  localStorage.setItem(STORAGE_PREFIX + 'apikeys', JSON.stringify(keys));
}

export function ensureSeedKeys() {
  const existing = getApiKeys();
  if (existing.length) return existing;

  const seed = [
    {
      id: 'key_' + randomBase36(8),
      name: 'Production Key',
      key: `plug_sk_${randomBase36(24)}2f4a`,
      createdAt: nowIso(),
      lastUsedAt: nowIso(),
      status: 'active'
    },
    {
      id: 'key_' + randomBase36(8),
      name: 'Development Key',
      key: `plug_sk_dev_${randomBase36(16)}7c1e`,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: 'active'
    }
  ];
  setApiKeys(seed);
  localStorage.setItem(STORAGE_PREFIX + 'activeKeyId', seed[0].id);
  return seed;
}

export function getActiveKeyId() {
  return localStorage.getItem(STORAGE_PREFIX + 'activeKeyId');
}

export function setActiveKeyId(id) {
  if (!id) localStorage.removeItem(STORAGE_PREFIX + 'activeKeyId');
  else localStorage.setItem(STORAGE_PREFIX + 'activeKeyId', id);
}

export function maskKey(key) {
  if (!key || typeof key !== 'string') return '';
  const visibleTail = key.slice(-4);
  const prefix = key.startsWith('plug_sk_') ? 'plug_sk_' : key.slice(0, Math.min(8, key.length));
  return `${prefix}${'•'.repeat(Math.max(0, 20))}${visibleTail}`;
}

export function formatDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatRelative(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const ms = d.getTime();
  if (Number.isNaN(ms)) return '—';
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function createApiKey(name) {
  const keyObj = {
    id: 'key_' + randomBase36(10),
    name: (name || 'New Key').trim(),
    key: `plug_sk_${randomBase36(28)}`,
    createdAt: nowIso(),
    lastUsedAt: null,
    status: 'active'
  };

  const keys = getApiKeys();
  keys.unshift(keyObj);
  setApiKeys(keys);
  setActiveKeyId(keyObj.id);
  return keyObj;
}

