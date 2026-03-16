/* ============================================
   PlugAI — Auth JS
   ============================================ */

import { getSession, setSession } from './state.js';

const RETURN_TO = new URLSearchParams(window.location.search).get('returnTo') || 'dashboard.html';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function scorePassword(pw) {
  const val = String(pw || '');
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return score; // 0..4
}

function redirectAfterAuth() {
  window.location.href = RETURN_TO;
}

// TAB SWITCHING
window.switchTab = function (tab) {
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  if (tab === 'login') {
    loginTab?.classList.add('active');
    signupTab?.classList.remove('active');
    loginForm?.classList.remove('hidden');
    signupForm?.classList.add('hidden');
  } else {
    signupTab?.classList.add('active');
    loginTab?.classList.remove('active');
    loginForm?.classList.add('hidden');
    signupForm?.classList.remove('hidden');
  }
};

// If already signed in, go to returnTo
if (getSession()) {
  redirectAfterAuth();
}

// Check for #signup hash
if (window.location.hash === '#signup') {
  switchTab('signup');
}

// PASSWORD TOGGLE
window.togglePw = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  if (btn) btn.style.color = isPassword ? 'var(--primary)' : 'var(--text-muted)';
};

// PASSWORD STRENGTH
const signupPw = document.getElementById('signupPassword');
const pwStrength = document.getElementById('pwStrength');

if (signupPw && pwStrength) {
  signupPw.addEventListener('input', () => {
    const score = scorePassword(signupPw.value);
    const colors = ['var(--error)', 'var(--warning)', '#a3e635', 'var(--success)'];
    const widths = ['25%', '50%', '75%', '100%'];
    pwStrength.style.background = `linear-gradient(90deg, ${colors[score - 1] || 'var(--border)'} ${widths[score - 1] || '0%'}, var(--border) ${widths[score - 1] || '0%'})`;
  });
}

// SOCIAL LOGIN (demo)
window.socialLogin = function (_provider, btnEl) {
  const btn = btnEl || (typeof event !== 'undefined' ? event.currentTarget : null);
  if (!btn) return;
  btn.innerHTML = `<svg class="spin-anim" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Connecting...`;
  btn.disabled = true;

  setTimeout(() => {
    setSession({
      user: { name: 'John Dev', email: 'john@example.com' },
      plan: 'Pro',
      provider: 'social',
      signedInAt: new Date().toISOString()
    });
    redirectAfterAuth();
  }, 900);
};

// LOGIN FORM
window.handleLogin = function () {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const pw = document.getElementById('loginPassword')?.value || '';
  if (!email || !pw) {
    showError('Please fill in all fields.', 'loginForm');
    return;
  }
  if (!isValidEmail(email)) {
    showError('Please enter a valid email address.', 'loginForm');
    return;
  }

  showLoading('loginForm', 'Signing in...');
  setTimeout(() => {
    setSession({
      user: { name: email.split('@')[0], email },
      plan: 'Pro',
      provider: 'password',
      signedInAt: new Date().toISOString()
    });
    redirectAfterAuth();
  }, 900);
};

// SIGNUP FORM
window.handleSignup = function () {
  const first = document.getElementById('signupFirst')?.value?.trim() || '';
  const last = document.getElementById('signupLast')?.value?.trim() || '';
  const email = document.getElementById('signupEmail')?.value?.trim();
  const pw = document.getElementById('signupPassword')?.value || '';
  const agreed = document.getElementById('agreeTerms')?.checked;

  if (!email || !pw) {
    showError('Please fill in all required fields.', 'signupForm');
    return;
  }
  if (!isValidEmail(email)) {
    showError('Please enter a valid email address.', 'signupForm');
    return;
  }
  if (scorePassword(pw) < 2) {
    showError('Please choose a stronger password (8+ chars recommended).', 'signupForm');
    return;
  }
  if (!agreed) {
    showError('Please agree to the Terms of Service.', 'signupForm');
    return;
  }

  showLoading('signupForm', 'Creating account...');
  setTimeout(() => {
    const name = (first || last) ? `${first} ${last}`.trim() : email.split('@')[0];
    setSession({
      user: { name, email },
      plan: 'Starter',
      provider: 'signup',
      signedInAt: new Date().toISOString()
    });
    redirectAfterAuth();
  }, 1100);
};

function showLoading(formId, label) {
  const form = document.getElementById(formId);
  const btn = form?.querySelector('.btn-auth');
  if (btn) {
    btn.innerHTML = `<svg class="spin-anim" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> ${label}`;
    btn.disabled = true;
  }
}

function showError(msg, formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  let existing = form.querySelector('.form-error');
  if (!existing) {
    existing = document.createElement('div');
    existing.className = 'form-error';
    existing.style.cssText =
      'background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;padding:10px 14px;border-radius:9px;font-size:13px;margin-bottom:12px;';
    form.insertBefore(existing, form.querySelector('.btn-auth'));
  }
  existing.textContent = msg;
  setTimeout(() => existing?.remove(), 3200);
}

// Add spin animation
const style = document.createElement('style');
style.textContent = `
.spin-anim { animation: spinAnim 1s linear infinite; }
@keyframes spinAnim { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);
