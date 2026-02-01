(() => {
  let floatingButton = null;
  let modal = null;
  let overlay = null;
  let selectedText = '';
  let screenshotData = null;
  let currentTheme = 'light';
  let conversationHistory = [];
  let currentProvider = '';
  let currentModel = '';
  let screenshotOverlay = null;
  let cachedSettings = null;

  const MODELS = {
    openai: [
      { id: 'gpt-5.2', name: 'GPT-5.2' },
      { id: 'gpt-5', name: 'GPT-5' },
      { id: 'o4-mini', name: 'o4 Mini' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'gpt-3.5', name: 'GPT-3.5' }
    ],
    anthropic: [
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5' },
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5' },
      { id: 'claude-opus-4-1', name: 'Claude Opus 4.1' },
      { id: 'claude-sonnet-4-0', name: 'Claude Sonnet 4.0' }
    ],
    google: [
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-flash-preview-09-2025', name: 'Gemini 2.5 Flash Preview' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' }
    ],
    xai: [
      { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast Reasoning' },
      { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast Non-Reasoning' },
      { id: 'grok-code-fast-1', name: 'Grok Code Fast 1' },
      { id: 'grok-4-fast-reasoning', name: 'Grok 4 Fast Reasoning' },
      { id: 'grok-4-fast-non-reasoning', name: 'Grok 4 Fast Non-Reasoning' },
      { id: 'grok-3-mini', name: 'Grok 3 Mini' },
      { id: 'grok-3', name: 'Grok 3' }
    ],
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' }
    ]
  };

  const PROVIDER_NAMES = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google AI',
    xai: 'xAI',
    deepseek: 'DeepSeek'
  };

  // Providers that don't support vision/screenshot analysis
  const EXCLUDED_FROM_SCREENSHOT = ['xai', 'deepseek'];

  const QUICK_PROMPTS = [
    'Explain this',
    'Summarize',
    'Translate to English',
    'Fix grammar',
    'Simplify'
  ];

  function createFloatingButton() {
    if (floatingButton) return floatingButton;

    floatingButton = document.createElement('button');
    floatingButton.className = 'askai-button';
    floatingButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
      </svg>
      AskAI
    `;

    floatingButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });

    document.body.appendChild(floatingButton);
    return floatingButton;
  }

  function createModal() {
    if (modal) return modal;

    overlay = document.createElement('div');
    overlay.className = 'askai-overlay';
    overlay.addEventListener('click', closeModal);

    modal = document.createElement('div');
    modal.className = 'askai-modal';
    modal.innerHTML = `
      <div class="askai-modal-header">
        <h2 class="askai-modal-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
          </svg>
          AskAI
        </h2>
        <div class="askai-header-actions">
          <button class="askai-theme-btn" id="askai-theme" title="Toggle theme">
            <svg class="askai-sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" fill="currentColor"/>
            </svg>
            <svg class="askai-moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" fill="currentColor"/>
            </svg>
          </button>
          <button class="askai-close-btn" id="askai-close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="askai-model-selector">
        <div class="askai-select-group">
          <label class="askai-select-label">Provider</label>
          <div class="askai-select-wrapper">
            <select id="askai-provider" class="askai-select"></select>
            <svg class="askai-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <div class="askai-select-group">
          <label class="askai-select-label">Model</label>
          <div class="askai-select-wrapper">
            <select id="askai-model" class="askai-select"></select>
            <svg class="askai-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="askai-modal-body">
        <div class="askai-context-section" id="askai-context-section">
          <div class="askai-context-label">Selected text:</div>
          <div class="askai-selected-text" id="askai-selected-text"></div>
        </div>
        <div class="askai-screenshot-section" id="askai-screenshot-section">
          <div class="askai-context-label">Screenshot:</div>
          <div class="askai-screenshot-container">
            <img id="askai-screenshot-img" class="askai-screenshot-img" alt="Screenshot">
          </div>
        </div>
        <div class="askai-conversation" id="askai-conversation"></div>
        <div class="askai-quick-prompts" id="askai-quick-prompts"></div>
        <div class="askai-error" id="askai-error"></div>
      </div>
      <div class="askai-modal-footer">
        <div class="askai-input-container">
          <textarea class="askai-prompt-input" id="askai-prompt" placeholder="Ask anything..." rows="1"></textarea>
          <button class="askai-send-btn" id="askai-submit">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    modal.querySelector('#askai-close').addEventListener('click', closeModal);
    modal.querySelector('#askai-theme').addEventListener('click', toggleTheme);
    modal.querySelector('#askai-submit').addEventListener('click', submitPrompt);

    const promptInput = modal.querySelector('#askai-prompt');
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitPrompt();
      }
    });

    promptInput.addEventListener('input', () => {
      promptInput.style.height = 'auto';
      promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
    });

    const providerSelect = modal.querySelector('#askai-provider');
    const modelSelect = modal.querySelector('#askai-model');

    providerSelect.addEventListener('change', (e) => {
      currentProvider = e.target.value;
      populateModels(currentProvider, modelSelect);
      saveLastUsedSettings();
    });

    modelSelect.addEventListener('change', (e) => {
      currentModel = e.target.value;
      saveLastUsedSettings();
    });

    const quickPromptsContainer = modal.querySelector('#askai-quick-prompts');
    QUICK_PROMPTS.forEach(prompt => {
      const btn = document.createElement('button');
      btn.className = 'askai-quick-prompt';
      btn.textContent = prompt;
      btn.addEventListener('click', () => {
        modal.querySelector('#askai-prompt').value = prompt;
        submitPrompt();
      });
      quickPromptsContainer.appendChild(btn);
    });

    return modal;
  }

  function populateProviders(providerSelect, configuredProviders, lastProvider) {
    providerSelect.innerHTML = '';

    const availableProviders = Object.keys(MODELS).filter(p => configuredProviders.includes(p));

    if (availableProviders.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No providers configured';
      providerSelect.appendChild(option);
      return;
    }

    availableProviders.forEach(providerId => {
      const option = document.createElement('option');
      option.value = providerId;
      option.textContent = PROVIDER_NAMES[providerId];
      providerSelect.appendChild(option);
    });

    if (lastProvider && availableProviders.includes(lastProvider)) {
      providerSelect.value = lastProvider;
      currentProvider = lastProvider;
    } else {
      currentProvider = availableProviders[0];
      providerSelect.value = currentProvider;
    }
  }

  function populateModels(providerId, modelSelect, lastModel) {
    modelSelect.innerHTML = '';
    const models = MODELS[providerId] || [];

    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      modelSelect.appendChild(option);
    });

    if (lastModel && models.some(m => m.id === lastModel)) {
      modelSelect.value = lastModel;
      currentModel = lastModel;
    } else if (models.length > 0) {
      currentModel = models[0].id;
      modelSelect.value = currentModel;
    }
  }

  function saveLastUsedSettings() {
    chrome.storage.sync.set({
      lastProvider: currentProvider,
      lastModel: currentModel
    });
    // Update cache
    if (cachedSettings) {
      cachedSettings.lastProvider = currentProvider;
      cachedSettings.lastModel = currentModel;
    }
  }

  function showFloatingButton(x, y) {
    const button = createFloatingButton();

    const buttonWidth = 100;
    const buttonHeight = 36;
    const padding = 10;

    let left = x - buttonWidth / 2;
    let top = y - buttonHeight - padding;

    left = Math.max(padding, Math.min(left, window.innerWidth - buttonWidth - padding));

    if (top < padding) {
      top = y + padding;
    }

    button.style.left = `${left + window.scrollX}px`;
    button.style.top = `${top + window.scrollY}px`;

    requestAnimationFrame(() => {
      button.classList.add('show');
    });
  }

  function hideFloatingButton() {
    if (floatingButton) {
      floatingButton.classList.remove('show');
    }
  }

  function loadSettings(callback) {
    if (cachedSettings) {
      callback(cachedSettings);
      return;
    }
    chrome.storage.sync.get(['theme', 'apiKeys', 'lastProvider', 'lastModel'], (result) => {
      cachedSettings = result;
      callback(result);
    });
  }

  function applySettings(result) {
    currentTheme = result.theme || 'light';
    modal.classList.toggle('dark', currentTheme === 'dark');

    const apiKeys = result.apiKeys || {};
    let configuredProviders = Object.keys(apiKeys).filter(p => apiKeys[p]);

    // Exclude providers that don't support vision
    if (screenshotData) {
      configuredProviders = configuredProviders.filter(p => !EXCLUDED_FROM_SCREENSHOT.includes(p));
    }

    const providerSelect = modal.querySelector('#askai-provider');
    const modelSelect = modal.querySelector('#askai-model');

    populateProviders(providerSelect, configuredProviders, result.lastProvider);
    populateModels(currentProvider, modelSelect, result.lastModel);

    if (configuredProviders.length === 0) {
      showError('No API keys configured. Please configure them in the extension popup.');
      modal.querySelector('.askai-model-selector').style.display = 'none';
      modal.querySelector('#askai-prompt').disabled = true;
      modal.querySelector('#askai-submit').disabled = true;
      modal.querySelector('#askai-quick-prompts').style.display = 'none';
    } else {
      modal.querySelector('#askai-prompt').disabled = false;
      modal.querySelector('#askai-submit').disabled = false;
    }
  }

  function openModal() {
    hideFloatingButton();
    createModal();

    // Cache DOM references
    const selectedTextEl = modal.querySelector('#askai-selected-text');
    const promptInput = modal.querySelector('#askai-prompt');
    const errorEl = modal.querySelector('#askai-error');
    const contextSection = modal.querySelector('#askai-context-section');
    const screenshotSection = modal.querySelector('#askai-screenshot-section');
    const screenshotImg = modal.querySelector('#askai-screenshot-img');
    const quickPrompts = modal.querySelector('#askai-quick-prompts');
    const modelSelector = modal.querySelector('.askai-model-selector');

    // Apply cached theme immediately if available
    if (cachedSettings) {
      modal.classList.toggle('dark', (cachedSettings.theme || 'light') === 'dark');
    }

    // Set up UI state synchronously
    selectedTextEl.textContent = selectedText;
    promptInput.value = '';
    promptInput.style.height = 'auto';
    errorEl.className = 'askai-error';
    contextSection.style.display = selectedText ? 'block' : 'none';

    if (screenshotData) {
      screenshotImg.src = screenshotData;
      screenshotSection.style.display = 'block';
    } else {
      screenshotSection.style.display = 'none';
    }

    quickPrompts.style.display = conversationHistory.length === 0 ? 'flex' : 'none';
    modelSelector.style.display = conversationHistory.length === 0 ? 'flex' : 'none';

    renderConversation();

    // Lock page scroll and show modal
    lockScroll();
    overlay.classList.add('show');
    modal.classList.add('show');
    promptInput.focus();

    // Load settings asynchronously (won't block modal display)
    loadSettings(applySettings);
  }

  function closeModal() {
    if (overlay) overlay.classList.remove('show');
    if (modal) modal.classList.remove('show');
    unlockScroll();
  }

  let scrollLockStyle = null;
  let savedScrollY = 0;

  function lockScroll() {
    if (scrollLockStyle) return;
    savedScrollY = window.scrollY;
    scrollLockStyle = document.createElement('style');
    scrollLockStyle.textContent = `
      body {
        position: fixed !important;
        top: -${savedScrollY}px !important;
        left: 0 !important;
        right: 0 !important;
        overflow-y: scroll !important;
      }
    `;
    document.head.appendChild(scrollLockStyle);
  }

  function unlockScroll() {
    if (!scrollLockStyle) return;
    scrollLockStyle.remove();
    scrollLockStyle = null;
    window.scrollTo(0, savedScrollY);
  }

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    modal.classList.toggle('dark', currentTheme === 'dark');
    chrome.storage.sync.set({ theme: currentTheme });
    // Update cache
    if (cachedSettings) {
      cachedSettings.theme = currentTheme;
    }
  }

  function renderMarkdown(text) {
    if (typeof marked !== 'undefined' && marked.parse) {
      return marked.parse(text, { breaks: true });
    }
    // Fallback to escaped HTML if marked is not available
    return escapeHtml(text);
  }

  function renderConversation() {
    const container = modal.querySelector('#askai-conversation');
    container.innerHTML = '';

    conversationHistory.forEach((msg, index) => {
      const msgEl = document.createElement('div');
      msgEl.className = `askai-message askai-message-${msg.role}`;

      if (msg.role === 'assistant') {
        msgEl.innerHTML = `
          <div class="askai-message-content askai-markdown">${renderMarkdown(msg.content)}</div>
          <button class="askai-copy-msg-btn" data-index="${index}" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
            </svg>
          </button>
        `;
      } else {
        msgEl.innerHTML = `<div class="askai-message-content">${escapeHtml(msg.content)}</div>`;
      }

      container.appendChild(msgEl);
    });

    // Add copy listeners
    container.querySelectorAll('.askai-copy-msg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        copyMessage(index, e.currentTarget);
      });
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }

  function copyMessage(index, button) {
    const content = conversationHistory[index]?.content;
    if (!content) return;

    navigator.clipboard.writeText(content).then(() => {
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
        </svg>
      `;
      setTimeout(() => {
        button.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
          </svg>
        `;
      }, 2000);
    });
  }

  function showError(message) {
    const errorEl = modal.querySelector('#askai-error');
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }

  async function submitPrompt() {
    const promptInput = modal.querySelector('#askai-prompt');
    const errorEl = modal.querySelector('#askai-error');
    const submitBtn = modal.querySelector('#askai-submit');
    const quickPrompts = modal.querySelector('#askai-quick-prompts');
    const prompt = promptInput.value.trim();

    if (!prompt) return;

    if (!currentProvider || !currentModel) {
      showError('Please configure an API key in the extension popup.');
      return;
    }

    errorEl.classList.remove('show');
    quickPrompts.style.display = 'none';

    // Hide model selector after first message
    const modelSelector = modal.querySelector('.askai-model-selector');
    modelSelector.style.display = 'none';

    // Add user message to history
    conversationHistory.push({ role: 'user', content: prompt });
    renderConversation();

    promptInput.value = '';
    promptInput.style.height = 'auto';
    submitBtn.disabled = true;

    // Add loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'askai-message askai-message-assistant askai-message-loading';
    loadingMsg.innerHTML = '<div class="askai-spinner"></div><span>Thinking...</span>';
    modal.querySelector('#askai-conversation').appendChild(loadingMsg);
    loadingMsg.scrollIntoView({ behavior: 'smooth' });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ASK_AI',
        provider: currentProvider,
        model: currentModel,
        selectedText: conversationHistory.length === 1 ? selectedText : '',
        screenshot: conversationHistory.length === 1 ? screenshotData : null,
        prompt,
        conversationHistory: conversationHistory.slice(0, -1) // Exclude current message
      });

      loadingMsg.remove();

      if (response.error) {
        conversationHistory.pop(); // Remove failed user message
        throw new Error(response.error);
      }

      conversationHistory.push({ role: 'assistant', content: response.result });
      renderConversation();
    } catch (error) {
      loadingMsg.remove();
      showError(error.message || 'Failed to get response. Check your settings.');
      renderConversation();
    } finally {
      submitBtn.disabled = false;
      promptInput.focus();
    }
  }

  function startScreenshotCapture() {
    // Create screenshot selection overlay
    screenshotOverlay = document.createElement('div');
    screenshotOverlay.className = 'askai-screenshot-overlay';
    screenshotOverlay.innerHTML = `
      <div class="askai-screenshot-instructions">
        Click and drag to select an area. Press ESC to cancel.
      </div>
      <div class="askai-screenshot-selection" id="askai-selection-box"></div>
    `;
    document.body.appendChild(screenshotOverlay);

    let isSelecting = false;
    let startX, startY;
    const selectionBox = screenshotOverlay.querySelector('#askai-selection-box');

    const handleMouseDown = (e) => {
      isSelecting = true;
      startX = e.clientX;
      startY = e.clientY;
      selectionBox.style.left = startX + 'px';
      selectionBox.style.top = startY + 'px';
      selectionBox.style.width = '0';
      selectionBox.style.height = '0';
      selectionBox.style.display = 'block';
    };

    const handleMouseMove = (e) => {
      if (!isSelecting) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      selectionBox.style.left = left + 'px';
      selectionBox.style.top = top + 'px';
      selectionBox.style.width = width + 'px';
      selectionBox.style.height = height + 'px';
    };

    const handleMouseUp = async (e) => {
      if (!isSelecting) return;
      isSelecting = false;

      const rect = selectionBox.getBoundingClientRect();

      // Minimum selection size
      if (rect.width < 10 || rect.height < 10) {
        cleanupScreenshotOverlay();
        return;
      }

      // Hide overlay temporarily for capture
      screenshotOverlay.style.display = 'none';

      // Request screenshot from background
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'CAPTURE_SCREENSHOT',
          area: {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
          }
        });

        if (response.screenshot) {
          // Crop the screenshot to the selected area
          const croppedImage = await cropImage(response.screenshot, rect);
          screenshotData = croppedImage;
          selectedText = '';
          conversationHistory = [];
          openModal();
        }
      } catch (error) {
        console.error('Screenshot capture failed:', error);
      }

      cleanupScreenshotOverlay();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        cleanupScreenshotOverlay();
      }
    };

    const cleanupScreenshotOverlay = () => {
      if (screenshotOverlay) {
        screenshotOverlay.remove();
        screenshotOverlay = null;
      }
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
  }

  async function cropImage(dataUrl, rect) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Account for device pixel ratio
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.drawImage(
          img,
          rect.x * dpr,
          rect.y * dpr,
          rect.width * dpr,
          rect.height * dpr,
          0,
          0,
          rect.width * dpr,
          rect.height * dpr
        );

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'START_SCREENSHOT') {
      startScreenshotCapture();
      sendResponse({ success: true });
    }
    return true;
  });

  function handleSelection() {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 0) {
      // Check if AskAI button is enabled
      chrome.storage.sync.get(['enableAskAI'], (result) => {
        const isEnabled = result.enableAskAI !== false;

        if (!isEnabled) {
          hideFloatingButton();
          return;
        }

        selectedText = text;
        screenshotData = null; // Clear any previous screenshot
        conversationHistory = []; // Reset conversation for new selection

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        showFloatingButton(
          rect.left + rect.width / 2,
          rect.top
        );
      });
    } else {
      hideFloatingButton();
    }
  }

  document.addEventListener('mouseup', (e) => {
    if (floatingButton && floatingButton.contains(e.target)) return;
    if (modal && modal.contains(e.target)) return;

    setTimeout(handleSelection, 10);
  });

  document.addEventListener('mousedown', (e) => {
    if (floatingButton && floatingButton.contains(e.target)) return;
    if (modal && modal.contains(e.target)) return;
    if (overlay && overlay.contains(e.target)) return;

    hideFloatingButton();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideFloatingButton();
      closeModal();
    }
  });

  document.addEventListener('scroll', () => {
    hideFloatingButton();
  }, true);

  // Preload settings on script init for faster modal open
  chrome.storage.sync.get(['theme', 'apiKeys', 'lastProvider', 'lastModel'], (result) => {
    cachedSettings = result;
  });

  // Listen for storage changes to keep cache in sync
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      if (!cachedSettings) cachedSettings = {};
      if (changes.theme) cachedSettings.theme = changes.theme.newValue;
      if (changes.apiKeys) cachedSettings.apiKeys = changes.apiKeys.newValue;
      if (changes.lastProvider) cachedSettings.lastProvider = changes.lastProvider.newValue;
      if (changes.lastModel) cachedSettings.lastModel = changes.lastModel.newValue;
    }
  });
})();
