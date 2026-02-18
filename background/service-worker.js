import { handleAskAI } from './api-chat.js';
import { handleFetchModels, clearModelCache } from './api-models.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    theme: 'light',
    apiKeys: {}
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ASK_AI') {
    handleAskAI(request)
      .then(result => sendResponse({ result }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.type === 'FETCH_MODELS') {
    handleFetchModels(request.provider)
      .then(models => sendResponse({ models }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.type === 'CLEAR_MODEL_CACHE') {
    clearModelCache().then(() => sendResponse({ success: true }));
    return true;
  }

  if (request.type === 'CAPTURE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    return true;
  }
});
