/* ============================================
   PlugAI — Playground JS
   ============================================ */

import { ensureSeedKeys, getActiveKeyId, getApiKeys, getSession } from './state.js';

const STORAGE_KEY = 'plugai.playground.config';
const STORAGE_KEY_REMEMBER = 'plugai.playground.rememberKey';
const STORAGE_KEY_SAVED_KEY = 'plugai.playground.savedApiKey';

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function loadConfig() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? safeJsonParse(raw, {}) : {};
}

function saveConfig(partial) {
  const current = loadConfig();
  const next = { ...current, ...partial, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

// SLIDER controls
const tempSlider = document.getElementById('tempSlider');
const tempValue = document.getElementById('tempValue');
const maxTokenSlider = document.getElementById('maxTokens');
const maxTokensValue = document.getElementById('maxTokensValue');
const systemPrompt = document.getElementById('systemPrompt');

tempSlider?.addEventListener('input', () => {
    tempValue.textContent = parseFloat(tempSlider.value).toFixed(2);
    saveConfig({ temperature: parseFloat(tempSlider.value) });
});

maxTokenSlider?.addEventListener('input', () => {
    maxTokensValue.textContent = maxTokenSlider.value;
    saveConfig({ maxTokens: parseInt(maxTokenSlider.value, 10) });
});

// MODEL PILL SYNC
const modelSelect = document.getElementById('modelSelect');
const modelPill = document.getElementById('currentModelPill');
modelSelect?.addEventListener('change', () => {
    if (modelPill) modelPill.textContent = modelSelect.value;
    saveConfig({ model: modelSelect.value });
});

// STREAM TOGGLE
const streamToggle = document.getElementById('streamToggle');
const streamLabel = document.getElementById('streamLabel');
streamToggle?.addEventListener('change', () => {
    streamLabel.textContent = streamToggle.checked ? 'Enabled' : 'Disabled';
    saveConfig({ stream: !!streamToggle.checked });
});

// CHAR COUNT
const promptInput = document.getElementById('promptInput');
const charCount = document.getElementById('charCount');
promptInput?.addEventListener('input', () => {
    if (charCount) charCount.textContent = promptInput.value.length;
    autoResizeTextarea(promptInput);
});

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

// SEND ON ENTER (no shift)
promptInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// EXAMPLE PROMPTS
window.useExample = function (el) {
    if (promptInput) {
        promptInput.value = el.textContent;
        charCount.textContent = promptInput.value.length;
        autoResizeTextarea(promptInput);
        promptInput.focus();
    }
};

// RESPONSE TABS
document.querySelectorAll('.code-tab[data-resp]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.code-tab[data-resp]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const resp = tab.dataset.resp;
        document.getElementById('responseText').classList.toggle('hidden', resp !== 'text');
        document.getElementById('responseJson').classList.toggle('hidden', resp !== 'json');
    });
});

// CHAT MESSAGES
const chatContainer = document.getElementById('chatContainer');

function addMessage(role, text) {
    const welcome = chatContainer.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const msg = document.createElement('div');
    msg.className = `message ${role}`;
    const initial = role === 'user' ? 'You' : '⚡';
    msg.innerHTML = `
    <div class="msg-avatar">${role === 'user' ? 'U' : '⚡'}</div>
    <div class="msg-content">${text.replace(/\n/g, '<br>')}</div>
  `;
    chatContainer.appendChild(msg);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return msg;
}

function addTypingIndicator() {
    const msg = document.createElement('div');
    msg.className = 'message assistant';
    msg.id = 'typingIndicator';
    msg.innerHTML = `
    <div class="msg-avatar">⚡</div>
    <div class="msg-content"><div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div></div>
  `;
    chatContainer.appendChild(msg);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// DEMO RESPONSES
const demoResponses = [
    `Hello! I'm PlugAI's language model. I'm here to help you with anything you need — from coding questions to creative writing and complex analysis.\n\nWhat can I help you with today?`,
    `Neural networks are computational systems loosely inspired by the human brain.\n\nAt their core, they consist of:\n• **Neurons** — simple processing units arranged in layers\n• **Weights** — numbers that determine how signals flow\n• **Activation functions** — decide which neurons "fire"\n\nDuring training, the network adjusts its weights using backpropagation to minimize prediction errors. The result? A model that can recognize patterns, generate text, or classify images.`,
    `Here's a simple Python web scraper:\n\n\`\`\`python\nimport requests\nfrom bs4 import BeautifulSoup\n\nresponse = requests.get("https://example.com")\nsoup = BeautifulSoup(response.text, "html.parser")\nfor link in soup.find_all("a"):\n    print(link.get("href"))\n\`\`\`\n\nRemember to check the site's robots.txt and terms of service before scraping!`,
    `Bonjour le monde! 🌍\n\n"Hello world!" translates to "Bonjour le monde!" in French. Would you like more French translations or a full language lesson?`,
    `Great question! I can summarize text for you. Just paste the content you'd like summarized and I'll provide a concise overview highlighting the key points.`
];

let responseIndex = 0;

window.sendMessage = async function () {
    const text = promptInput?.value.trim();
    if (!text) return;
    if (!promptInput) return;

    promptInput.value = '';
    if (charCount) charCount.textContent = 0;
    autoResizeTextarea(promptInput);

    addMessage('user', text);
    addTypingIndicator();

    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.disabled = true;

    const startTime = Date.now();

    const model = modelSelect?.value || 'plugai-gpt';
    const temperature = parseFloat(tempSlider?.value || '0.7');
    const max_tokens = parseInt(maxTokenSlider?.value || '512', 10);
    const system = systemPrompt?.value?.trim() || null;
    const wantStream = !!streamToggle?.checked;

    let responseTextValue = '';
    let jsonObj = null;
    let latencyMs = 0;
    let tokens = 0;
    let usedRealApi = false;

    try {
        const r = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                message: text,
                temperature,
                max_tokens,
                system,
                stream: false
            })
        });

        const data = await r.json();
        usedRealApi = r.ok;
        latencyMs = data?.meta?.latency_ms ?? (Date.now() - startTime);

        // Try to normalize common shapes
        responseTextValue =
            data?.text ??
            data?.choices?.[0]?.message?.content ??
            data?.choices?.[0]?.text ??
            data?.message ??
            JSON.stringify(data);

        tokens =
            data?.usage?.total_tokens ??
            data?.usage?.completion_tokens ??
            Math.floor(String(responseTextValue).length / 4);

        jsonObj = data;
    } catch (e) {
        // Fall back to demo mode if server isn't running / request fails
        const delay = 650 + Math.random() * 900;
        await new Promise(r => setTimeout(r, delay));
        latencyMs = Date.now() - startTime;

        responseTextValue = demoResponses[responseIndex % demoResponses.length];
        responseIndex++;
        tokens = Math.floor(responseTextValue.length / 4) + Math.floor(Math.random() * 50);

        jsonObj = {
            id: 'chat-' + Math.random().toString(36).slice(2, 10),
            model,
            created: Math.floor(Date.now() / 1000),
            meta: { demo: true, error: String(e) },
            usage: { prompt_tokens: text.length >> 2, completion_tokens: tokens, total_tokens: (text.length >> 2) + tokens },
            choices: [{ message: { role: 'assistant', content: responseTextValue }, finish_reason: 'stop' }]
        };
    }

    const typingEl = document.getElementById('typingIndicator');
    if (typingEl) typingEl.remove();

    if (wantStream && !usedRealApi) {
        // Streaming simulation (demo only)
        const welcome = chatContainer.querySelector('.chat-welcome');
        if (welcome) welcome.remove();
        const msg = document.createElement('div');
        msg.className = 'message assistant';
        msg.innerHTML = `<div class="msg-avatar">⚡</div><div class="msg-content" id="streamContent"></div>`;
        chatContainer.appendChild(msg);
        const streamContent = document.getElementById('streamContent');

        let i = 0;
        const stream = setInterval(() => {
            if (i < responseTextValue.length) {
                streamContent.innerHTML = responseTextValue.slice(0, i + 1).replace(/\n/g, '<br>');
                chatContainer.scrollTop = chatContainer.scrollHeight;
                i += 3;
            } else {
                clearInterval(stream);
                if (sendBtn) sendBtn.disabled = false;
            }
        }, 18);
    } else {
        addMessage('assistant', responseTextValue);
        if (sendBtn) sendBtn.disabled = false;
    }

    // Update response panel
    const responseMeta = document.getElementById('responseMeta');
    if (responseMeta) responseMeta.style.display = 'grid';
    const metaModel = document.getElementById('metaModel');
    const metaLatency = document.getElementById('metaLatency');
    const metaTokens = document.getElementById('metaTokens');
    if (metaModel) metaModel.textContent = model;
    if (metaLatency) metaLatency.textContent = latencyMs + 'ms';
    if (metaTokens) metaTokens.textContent = tokens;

    const responseText = document.getElementById('responseText');
    if (responseText) responseText.innerHTML = `<p>${String(responseTextValue).replace(/\n/g, '<br>')}</p>`;

    const responseJsonContent = document.getElementById('responseJsonContent');
    if (responseJsonContent) {
        responseJsonContent.innerHTML = `<code class="code-string">${JSON.stringify(jsonObj, null, 2)}</code>`;
    }
};

window.clearResponse = function () {
    const responseText = document.getElementById('responseText');
    if (responseText) responseText.innerHTML = '<p class="response-placeholder">Response will appear here after you send a message.</p>';
    const responseJsonContent = document.getElementById('responseJsonContent');
    if (responseJsonContent) responseJsonContent.innerHTML = '<code class="code-comment">// JSON will appear here</code>';
    const responseMeta = document.getElementById('responseMeta');
    if (responseMeta) responseMeta.style.display = 'none';
};

// CONFIG PERSISTENCE (load on start)
(function hydrate() {
  const cfg = loadConfig();

  if (modelSelect && cfg.model) modelSelect.value = cfg.model;
  if (modelPill) modelPill.textContent = modelSelect?.value || 'plugai-gpt';

  if (tempSlider && typeof cfg.temperature === 'number') tempSlider.value = String(cfg.temperature);
  if (tempValue && tempSlider) tempValue.textContent = parseFloat(tempSlider.value).toFixed(2);

  if (maxTokenSlider && typeof cfg.maxTokens === 'number') maxTokenSlider.value = String(cfg.maxTokens);
  if (maxTokensValue && maxTokenSlider) maxTokensValue.textContent = maxTokenSlider.value;

  if (systemPrompt && typeof cfg.systemPrompt === 'string') systemPrompt.value = cfg.systemPrompt;

  if (streamToggle && typeof cfg.stream === 'boolean') streamToggle.checked = cfg.stream;
  if (streamLabel && streamToggle) streamLabel.textContent = streamToggle.checked ? 'Enabled' : 'Disabled';

  // Save on textarea input (system prompt)
  systemPrompt?.addEventListener('input', () => saveConfig({ systemPrompt: systemPrompt.value }));
})();

// API KEY optional remember
const apiKeyInput = document.getElementById('playgroundApiKey');
const rememberToggle = document.getElementById('rememberKeyToggle');
const keyHint = document.getElementById('keyHint');

function getDashboardActiveKey() {
  ensureSeedKeys();
  const activeId = getActiveKeyId();
  const keys = getApiKeys();
  const active = keys.find(k => k.id === activeId && k.status === 'active') || keys.find(k => k.status === 'active') || null;
  return active?.key || '';
}

function updateKeyHint() {
  if (!keyHint || !rememberToggle) return;
  keyHint.textContent = rememberToggle.checked
    ? 'Saved locally on this device. Disable to stop storing it.'
    : 'Your key is only stored if you enable “Remember”.';
}

function loadRememberState() {
  const val = localStorage.getItem(STORAGE_KEY_REMEMBER);
  return val === '1';
}

function setRememberState(remember) {
  localStorage.setItem(STORAGE_KEY_REMEMBER, remember ? '1' : '0');
}

function hydrateApiKey() {
  if (!apiKeyInput || !rememberToggle) return;

  const remember = loadRememberState();
  rememberToggle.checked = remember;
  updateKeyHint();

  if (remember) {
    const saved = localStorage.getItem(STORAGE_KEY_SAVED_KEY) || '';
    const keyFromDashboard = getSession() ? getDashboardActiveKey() : '';
    apiKeyInput.value = saved || keyFromDashboard || '';
  } else {
    apiKeyInput.value = '';
  }
}

rememberToggle?.addEventListener('change', () => {
  const remember = !!rememberToggle.checked;
  setRememberState(remember);
  updateKeyHint();
  if (!remember) localStorage.removeItem(STORAGE_KEY_SAVED_KEY);
  hydrateApiKey();
});

apiKeyInput?.addEventListener('input', () => {
  if (!apiKeyInput || !rememberToggle) return;
  if (rememberToggle.checked) {
    localStorage.setItem(STORAGE_KEY_SAVED_KEY, apiKeyInput.value);
  }
});

hydrateApiKey();
