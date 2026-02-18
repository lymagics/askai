const MODEL_LIST_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/models',
  anthropic: 'https://api.anthropic.com/v1/models',
  google: 'https://generativelanguage.googleapis.com/v1beta/models',
  xai: 'https://api.x.ai/v1/models',
  deepseek: 'https://api.deepseek.com/v1/models'
};

const MODEL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function handleFetchModels(provider) {
  const { modelCache = {} } = await chrome.storage.local.get('modelCache');
  const cached = modelCache[provider];

  if (cached && (Date.now() - cached.timestamp) < MODEL_CACHE_TTL) {
    return cached.models;
  }

  const { apiKeys } = await chrome.storage.sync.get(['apiKeys']);
  const apiKey = apiKeys?.[provider];

  if (!apiKey) {
    return null;
  }

  const models = await fetchProviderModels(provider, apiKey);

  modelCache[provider] = { models, timestamp: Date.now() };
  await chrome.storage.local.set({ modelCache });

  return models;
}

export function clearModelCache() {
  return new Promise(resolve => {
    chrome.storage.local.remove('modelCache', () => resolve());
  });
}

async function fetchProviderModels(provider, apiKey) {
  switch (provider) {
    case 'openai': return await fetchOpenAIModels(apiKey);
    case 'anthropic': return await fetchAnthropicModels(apiKey);
    case 'google': return await fetchGoogleModels(apiKey);
    case 'xai': return await fetchXAIModels(apiKey);
    case 'deepseek': return await fetchDeepSeekModels(apiKey);
    default: return null;
  }
}

async function fetchOpenAIModels(apiKey) {
  const response = await fetch(MODEL_LIST_ENDPOINTS.openai, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) throw new Error(`OpenAI models API error: ${response.status}`);

  const data = await response.json();
  const chatPrefixes = ['gpt-', 'o1', 'o3', 'o4', 'chatgpt-'];

  return data.data
    .filter(m => chatPrefixes.some(p => m.id.startsWith(p)))
    .sort((a, b) => (b.created || 0) - (a.created || 0))
    .map(m => ({ id: m.id, name: m.id }));
}

async function fetchAnthropicModels(apiKey) {
  const response = await fetch(MODEL_LIST_ENDPOINTS.anthropic, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    }
  });

  if (!response.ok) throw new Error(`Anthropic models API error: ${response.status}`);

  const data = await response.json();
  return data.data
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .map(m => ({ id: m.id, name: m.display_name || m.id }));
}

async function fetchGoogleModels(apiKey) {
  const response = await fetch(`${MODEL_LIST_ENDPOINTS.google}?key=${apiKey}`);

  if (!response.ok) throw new Error(`Google models API error: ${response.status}`);

  const data = await response.json();
  return data.models
    .filter(m => m.name.includes('gemini'))
    .map(m => {
      const id = m.name.replace('models/', '');
      return { id, name: m.displayName || id };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function fetchXAIModels(apiKey) {
  const response = await fetch(MODEL_LIST_ENDPOINTS.xai, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) throw new Error(`xAI models API error: ${response.status}`);

  const data = await response.json();
  return data.data
    .sort((a, b) => (b.created || 0) - (a.created || 0))
    .map(m => ({ id: m.id, name: m.id }));
}

async function fetchDeepSeekModels(apiKey) {
  const response = await fetch(MODEL_LIST_ENDPOINTS.deepseek, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) throw new Error(`DeepSeek models API error: ${response.status}`);

  const data = await response.json();
  return data.data
    .map(m => ({ id: m.id, name: m.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
