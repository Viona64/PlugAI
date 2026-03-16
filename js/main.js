/* ============================================
   PlugAI — Main JS
   ============================================ */

// NAVBAR SCROLL
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
}

// MOBILE MENU
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });
}

// CODE TABS
const codeTabs = document.querySelectorAll('.code-tab');
const codeBody = document.getElementById('codeBody');

const codeSnippets = {
    python: `<span class="code-keyword">import</span> <span class="code-module">plugai</span>

response = plugai.<span class="code-fn">chat</span>(
    model=<span class="code-string">"plugai-gpt"</span>,
    message=<span class="code-string">"Hello AI"</span>
)
<span class="code-fn">print</span>(response)
<span class="code-comment"># → {"text": "Hello! How can I help?"}</span>`,

    js: `<span class="code-keyword">import</span> PlugAI <span class="code-keyword">from</span> <span class="code-string">'@plugai/sdk'</span>;

<span class="code-keyword">const</span> client = <span class="code-keyword">new</span> <span class="code-fn">PlugAI</span>({ 
  apiKey: <span class="code-string">'plug_sk_...'</span>
});

<span class="code-keyword">const</span> response = <span class="code-keyword">await</span> client.chat.<span class="code-fn">complete</span>({
  model: <span class="code-string">'plugai-gpt'</span>,
  message: <span class="code-string">'Hello AI'</span>
});
console.<span class="code-fn">log</span>(response.text);`,

    curl: `<span class="code-fn">curl</span> https://api.plugai.dev/v1/chat \\
  -H <span class="code-string">"Authorization: Bearer plug_sk_..."</span> \\
  -H <span class="code-string">"Content-Type: application/json"</span> \\
  -d <span class="code-string">'{
    "model": "plugai-gpt",
    "message": "Hello AI"
  }'</span>`
};

codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        codeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (codeBody) {
            codeBody.style.opacity = '0';
            setTimeout(() => {
                codeBody.innerHTML = codeSnippets[tab.dataset.lang];
                codeBody.style.opacity = '1';
            }, 150);
        }
    });
});

// COPY CODE
window.copyCode = function () {
    const btn = document.getElementById('copyBtn');
    const code = document.getElementById('codeBody');
    if (!code || !btn) return;

    const text = code.innerText;
    navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied');
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
        }, 2000);
    });
};

// INTERSECTION OBSERVER - Animate on scroll
const animateEls = document.querySelectorAll('.step-card, .feature-card, .use-case-card, .pricing-card, .hero-visual');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

animateEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.animationDelay = (i * 0.07) + 's';
    observer.observe(el);
});

// Add fadeInUp keyframe dynamically
const style = document.createElement('style');
style.textContent = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}`;
document.head.appendChild(style);

// SMOOTH SCROLL for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (mobileMenu) mobileMenu.classList.remove('open');
        }
    });
});

// CODE TRANSITIONS
if (codeBody) {
    codeBody.style.transition = 'opacity 0.15s ease';
}
