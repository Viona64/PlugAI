/* ============================================
   PlugAI — Docs JS
   ============================================ */

// CODE TABS (multi-group)
document.querySelectorAll('.code-tab[data-target]').forEach(tab => {
  tab.addEventListener('click', () => {
    const groupTabs = tab.parentElement.querySelectorAll('.code-tab[data-target]');
    groupTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const targetId = tab.dataset.target;
    const section = tab.closest('.docs-section');
    if (section) {
      section.querySelectorAll('.code-window').forEach(w => {
        if (w.id && w.id !== targetId) w.classList.add('hidden');
        else if (w.id === targetId) w.classList.remove('hidden');
      });
    }
  });
});

// COPY CODE BLOCKS
window.copyCodeBlock = function (btn) {
  const win = btn.closest('.code-window');
  const code = win?.querySelector('pre code, pre');
  if (!code) return;
  navigator.clipboard.writeText(code.innerText).then(() => {
    btn.classList.add('copied');
    const prev = btn.innerHTML;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
    setTimeout(() => { btn.innerHTML = prev; btn.classList.remove('copied'); }, 2000);
  });
};

// SCROLL SPY - highlight TOC
const sections = Array.from(document.querySelectorAll('.docs-section'));
const tocLinks = Array.from(document.querySelectorAll('.toc-link'));
const docsLinks = Array.from(document.querySelectorAll('.docs-link'));

const spy = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      tocLinks.forEach(l => l.classList.remove('active'));
      const id = entry.target.id;
      const active = document.querySelector(`.toc-link[href="#${id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });

sections.forEach(s => spy.observe(s));

sections.forEach(section => {
  const spySide = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        docsLinks.forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.docs-link[href="#${section.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  spySide.observe(section);
});

// NAVBAR scroll
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    if (window.scrollY > 10) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }
});

// DOCS SEARCH (Ctrl/Cmd+K, filter sections/links)
const searchInput = document.getElementById('docsSearch');
const kbd = document.querySelector('.docs-search kbd');
if (kbd) kbd.textContent = /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? '⌘K' : 'Ctrl K';

function normalize(s) {
  return String(s || '').toLowerCase();
}

function sectionText(section) {
  const title = section.querySelector('h1,h2')?.innerText || '';
  const body = section.innerText || '';
  return `${title}\n${body}`;
}

function applySearch(queryRaw) {
  const q = normalize(queryRaw).trim();
  const searching = q.length > 0;

  // If empty, show everything
  if (!searching) {
    sections.forEach(s => (s.style.display = ''));
    docsLinks.forEach(a => (a.style.display = ''));
    tocLinks.forEach(a => (a.style.display = ''));
    return;
  }

  const matches = new Set();
  sections.forEach(s => {
    const txt = normalize(sectionText(s));
    const ok = txt.includes(q);
    s.style.display = ok ? '' : 'none';
    if (ok) matches.add(s.id);
  });

  // Filter sidebar links + right toc links to matched sections only
  docsLinks.forEach(a => {
    const id = a.getAttribute('href')?.slice(1);
    a.style.display = id && matches.has(id) ? '' : 'none';
  });
  tocLinks.forEach(a => {
    const id = a.getAttribute('href')?.slice(1);
    a.style.display = id && matches.has(id) ? '' : 'none';
  });
}

searchInput?.addEventListener('input', () => applySearch(searchInput.value));

document.addEventListener('keydown', (e) => {
  const isK = e.key.toLowerCase() === 'k';
  if ((e.ctrlKey || e.metaKey) && isK) {
    e.preventDefault();
    searchInput?.focus();
    searchInput?.select();
  }
  if (e.key === 'Escape' && document.activeElement === searchInput) {
    searchInput.value = '';
    applySearch('');
    searchInput.blur();
  }
});
