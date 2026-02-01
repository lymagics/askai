const PROVIDERS = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'google', name: 'Google AI' },
  { id: 'xai', name: 'xAI (Grok)' },
  { id: 'deepseek', name: 'DeepSeek' }
];

const themeToggle = document.getElementById('themeToggle');
const providersList = document.getElementById('providersList');
const enableAskAIToggle = document.getElementById('enableAskAI');
const screenshotBtn = document.getElementById('screenshotBtn');

function loadSettings() {
  chrome.storage.sync.get(['theme', 'apiKeys', 'enableAskAI'], (result) => {
    const theme = result.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    const apiKeys = result.apiKeys || {};
    renderProviders(apiKeys);

    // Load enableAskAI setting (default to true)
    const enableAskAI = result.enableAskAI !== false;
    enableAskAIToggle.checked = enableAskAI;
  });
}

function saveEnableAskAI() {
  chrome.storage.sync.set({ enableAskAI: enableAskAIToggle.checked });
}

function renderProviders(apiKeys) {
  providersList.innerHTML = '';

  PROVIDERS.forEach(provider => {
    const hasKey = !!apiKeys[provider.id];
    const card = document.createElement('div');
    card.className = `provider-card ${hasKey ? 'configured' : ''}`;
    card.innerHTML = `
      <div class="provider-header">
        <span class="provider-name">${provider.name}</span>
        <span class="provider-status ${hasKey ? 'configured' : 'not-configured'}">
          ${hasKey ? 'Configured' : 'Not configured'}
        </span>
      </div>
      <div class="input-row">
        <div class="input-wrapper">
          <input type="password" class="input" id="key-${provider.id}"
                 placeholder="Enter API key" value="${apiKeys[provider.id] || ''}">
          <button class="toggle-visibility" data-provider="${provider.id}" title="Toggle visibility">
            <svg class="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
            </svg>
            <svg class="eye-off-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <button class="save-btn" data-provider="${provider.id}">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    `;
    providersList.appendChild(card);
  });

  // Add event listeners
  document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const providerId = e.currentTarget.dataset.provider;
      const input = document.getElementById(`key-${providerId}`);
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      e.currentTarget.classList.toggle('visible', isPassword);
    });
  });

  document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const providerId = e.currentTarget.dataset.provider;
      saveProviderKey(providerId, e.currentTarget);
    });
  });
}

function saveProviderKey(providerId, button) {
  const input = document.getElementById(`key-${providerId}`);
  const apiKey = input.value.trim();

  chrome.storage.sync.get(['apiKeys'], (result) => {
    const apiKeys = result.apiKeys || {};

    if (apiKey) {
      apiKeys[providerId] = apiKey;
    } else {
      delete apiKeys[providerId];
    }

    chrome.storage.sync.set({ apiKeys }, () => {
      // Update UI
      const card = button.closest('.provider-card');
      const status = card.querySelector('.provider-status');

      if (apiKey) {
        card.classList.add('configured');
        status.className = 'provider-status configured';
        status.textContent = 'Configured';
      } else {
        card.classList.remove('configured');
        status.className = 'provider-status not-configured';
        status.textContent = 'Not configured';
      }

      // Show saved feedback
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
        </svg>
      `;
      button.classList.add('saved');

      setTimeout(() => {
        button.classList.remove('saved');
      }, 1500);
    });
  });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  chrome.storage.sync.set({ theme: newTheme });
}

themeToggle.addEventListener('click', toggleTheme);
enableAskAIToggle.addEventListener('change', saveEnableAskAI);

screenshotBtn.addEventListener('click', async () => {
  // Get the current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Send message to content script to start screenshot selection
  chrome.tabs.sendMessage(tab.id, { type: 'START_SCREENSHOT' });

  // Close the popup
  window.close();
});

document.addEventListener('DOMContentLoaded', loadSettings);
