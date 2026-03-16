/* ============================================
   PlugAI — Dashboard JS (Charts, Tabs, Keys)
   ============================================ */

import {
  clearSession,
  createApiKey,
  ensureSeedKeys,
  formatDateShort,
  formatRelative,
  getActiveKeyId,
  getApiKeys,
  maskKey,
  requireAuth,
  setActiveKeyId,
  setApiKeys
} from './state.js';

const session = requireAuth({ redirectTo: 'login.html', returnTo: 'dashboard.html' });

function setUserUi() {
  if (!session) return;
  const nameEl = document.getElementById('userName');
  const planEl = document.getElementById('userPlan');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl) nameEl.textContent = session.user?.name || 'Developer';
  if (planEl) planEl.textContent = `${session.plan || 'Starter'} Plan`;
  if (avatarEl) {
    const name = (session.user?.name || 'JD').trim();
    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase())
      .join('') || 'JD';
    avatarEl.textContent = initials;
  }
}

// TAB SWITCHING
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.add('active');
  const link = document.querySelector(`[data-tab="${tabId}"]`);
  if (link) link.classList.add('active');
  const names = { overview: 'Overview', apikeys: 'API Keys', usage: 'Usage', models: 'Models', billing: 'Billing' };
  const bc = document.getElementById('breadcrumbActive');
  if (bc) bc.textContent = names[tabId] || tabId;
}

document.querySelectorAll('.sidebar-item[data-tab]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(item.dataset.tab);
    sidebar?.classList.remove('open');
  });
});

// MOBILE SIDEBAR
const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
const sidebar = document.getElementById('sidebar');
if (mobileSidebarBtn && sidebar) {
  mobileSidebarBtn.addEventListener('click', () => { sidebar.classList.toggle('open'); });
}

// USER MENU + LOGOUT
const userMenuBtn = document.getElementById('userMenuBtn');
const userMenu = document.getElementById('userMenu');
userMenuBtn?.addEventListener('click', () => {
  const open = userMenu?.style.display !== 'none';
  if (userMenu) userMenu.style.display = open ? 'none' : 'block';
  userMenuBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
});
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  clearSession();
  window.location.href = 'login.html';
});
document.addEventListener('click', (e) => {
  const within = userMenu?.contains(e.target) || userMenuBtn?.contains(e.target);
  if (!within && userMenu && userMenu.style.display !== 'none') {
    userMenu.style.display = 'none';
    userMenuBtn?.setAttribute('aria-expanded', 'false');
  }
});

// CREATE KEY MODAL
window.showCreateKeyModal = function () {
  const modal = document.getElementById('createKeyModal');
  modal?.classList.add('open');
  setTimeout(() => document.getElementById('createKeyName')?.focus(), 0);
};

document.getElementById('createKeyConfirmBtn')?.addEventListener('click', () => {
  const name = document.getElementById('createKeyName')?.value || '';
  const created = createApiKey(name || 'New Key');
  renderKeys();
  setQuickKeyUi(created.id);
  document.getElementById('createKeyName').value = '';
  document.getElementById('createKeyModal')?.classList.remove('open');
  switchTab('apikeys');
});

// API KEY QUICK PANEL
let quickKeyVisible = false;

function getActiveKeyObj() {
  const keys = getApiKeys();
  const activeId = getActiveKeyId();
  const active = keys.find(k => k.id === activeId && k.status === 'active') || keys.find(k => k.status === 'active') || null;
  if (active && active.id !== activeId) setActiveKeyId(active.id);
  return active;
}

function setQuickKeyUi(forceActiveId = null) {
  if (forceActiveId) setActiveKeyId(forceActiveId);
  const active = getActiveKeyObj();
  const display = document.getElementById('apiKeyDisplay');
  if (!display) return;

  if (!active) {
    display.textContent = 'No active keys';
    return;
  }
  display.textContent = quickKeyVisible ? active.key : maskKey(active.key);
}

window.toggleApiKey = function () {
  quickKeyVisible = !quickKeyVisible;
  setQuickKeyUi();
};

window.copyApiKey = function () {
  const active = getActiveKeyObj();
  if (!active) return;
  navigator.clipboard.writeText(active.key).then(() => {
    const el = document.getElementById('apiKeyDisplay');
    if (!el) return;
    const prev = el.textContent;
    el.textContent = 'Copied!';
    el.style.color = 'var(--success)';
    setTimeout(() => { el.textContent = prev; el.style.color = ''; }, 1200);
  });
};

// API KEY LIST
function renderKeys() {
  const list = document.getElementById('keysList');
  if (!list) return;
  ensureSeedKeys();
  const keys = getApiKeys();
  const activeId = getActiveKeyId();

  if (!keys.length) {
    list.innerHTML = `<div class="glass" style="padding:16px;border-radius:14px;color:var(--text-secondary);">No API keys yet. Create one to get started.</div>`;
    return;
  }

  list.innerHTML = '';
  keys.forEach(k => {
    const item = document.createElement('div');
    item.className = 'key-item glass';
    item.dataset.keyId = k.id;
    const isActive = k.id === activeId && k.status === 'active';
    const statusBadge = k.status === 'active'
      ? `<span class="status-badge online">${isActive ? 'Active' : 'Enabled'}</span>`
      : `<span class="status-badge" style="background:rgba(148,163,184,0.15);border:1px solid rgba(148,163,184,0.25);color:rgba(148,163,184,0.9)">Revoked</span>`;

    item.innerHTML = `
      <div class="key-info">
        <div class="key-name">${escapeHtml(k.name || 'API Key')}</div>
        <div class="key-value" data-mask="1">${maskKey(k.key)}</div>
        <div class="key-meta">Created ${formatDateShort(k.createdAt)} · Last used ${k.lastUsedAt ? formatRelative(k.lastUsedAt) : 'never'}</div>
      </div>
      <div class="key-actions">
        ${statusBadge}
        <button class="icon-btn" data-action="toggle" ${k.status !== 'active' ? 'disabled' : ''} aria-label="Show key">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button class="icon-btn" data-action="copy" ${k.status !== 'active' ? 'disabled' : ''} aria-label="Copy key">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        <button class="btn-ghost" data-action="revoke" ${k.status !== 'active' ? 'disabled' : ''} style="font-size:12px;color:var(--error);border-color:rgba(239,68,68,0.3)">Revoke</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

document.getElementById('keysList')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const item = btn.closest('[data-key-id]');
  const id = item?.dataset.keyId;
  if (!id) return;

  const keys = getApiKeys();
  const keyObj = keys.find(k => k.id === id);
  if (!keyObj || keyObj.status !== 'active') return;

  if (action === 'toggle') {
    const valEl = item.querySelector('.key-value');
    if (!valEl) return;
    const masked = valEl.dataset.mask === '1';
    valEl.dataset.mask = masked ? '0' : '1';
    valEl.textContent = masked ? keyObj.key : maskKey(keyObj.key);
    if (masked) setActiveKeyId(id);
    setQuickKeyUi(id);
  }

  if (action === 'copy') {
    navigator.clipboard.writeText(keyObj.key).then(() => {
      const valEl = item.querySelector('.key-value');
      if (!valEl) return;
      const prev = valEl.textContent;
      valEl.textContent = 'Copied!';
      valEl.style.color = 'var(--success)';
      setTimeout(() => { valEl.textContent = prev; valEl.style.color = ''; }, 900);
    });
  }

  if (action === 'revoke') {
    keyObj.status = 'revoked';
    keyObj.revokedAt = new Date().toISOString();
    setApiKeys(keys);
    // if active key revoked, pick next active
    if (getActiveKeyId() === id) setActiveKeyId(null);
    renderKeys();
    setQuickKeyUi();
  }
});

// CHART — Canvas-based bar chart
function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rr = Array.isArray(r) ? r : [r, r, r, r];
  const [r1, r2, r3, r4] = rr.map(v => Math.max(0, Math.min(v, Math.min(w, h) / 2)));
  ctx.moveTo(x + r1, y);
  ctx.lineTo(x + w - r2, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r2);
  ctx.lineTo(x + w, y + h - r3);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r3, y + h);
  ctx.lineTo(x + r4, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r4);
  ctx.lineTo(x, y + r1);
  ctx.quadraticCurveTo(x, y, x + r1, y);
}

function drawChart() {
  const canvas = document.getElementById('usageChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 200 * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = '200px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width, H = 200;
  const days = 30;
  const data = Array.from({ length: days }, () => Math.floor(Math.random() * 2800 + 800));
  const errors = Array.from({ length: days }, () => Math.floor(Math.random() * 40));
  const maxVal = Math.max(...data);
  const barW = (W - 60) / days;
  const chartH = H - 40;
  const padLeft = 48, padBottom = 30;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1].forEach(t => {
    const y = padBottom + chartH - t * chartH;
    ctx.beginPath();
    ctx.moveTo(padLeft - 4, y);
    ctx.lineTo(W - 8, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal * t / 1000) + 'k', padLeft - 8, y + 4);
  });

  // Draw bars
  data.forEach((v, i) => {
    const x = padLeft + i * barW + 2;
    const barHeight = (v / maxVal) * chartH;
    const y = padBottom + chartH - barHeight;

    const grd = ctx.createLinearGradient(0, y, 0, y + barHeight);
    grd.addColorStop(0, 'rgba(108,99,255,0.9)');
    grd.addColorStop(1, 'rgba(108,99,255,0.2)');

    ctx.beginPath();
    roundRect(ctx, x, y, barW - 4, barHeight, [3, 3, 0, 0]);
    ctx.fillStyle = grd;
    ctx.fill();

    // Error dots
    const errY = padBottom + chartH - (errors[i] / 40) * chartH * 0.3;
    ctx.beginPath();
    ctx.arc(x + (barW - 4) / 2, errY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,212,255,0.8)';
    ctx.fill();
  });
}

window.addEventListener('load', () => {
  setUserUi();
  renderKeys();
  setQuickKeyUi();
  drawChart();
});
window.addEventListener('resize', drawChart);
