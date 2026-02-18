# AskAI

A Chrome extension that lets you select text or capture screenshots on any webpage and ask AI about them.

## Features

- **Text Selection**: Select any text on a webpage, click the AskAI button, and ask questions about it
- **Screenshot Capture**: Capture any area of the screen and ask AI to analyze it
- **Multiple AI Providers**: Support for OpenAI, Anthropic, Google AI, xAI, and DeepSeek
- **Dynamic Model Lists**: Models are fetched from each provider's API and cached for 24 hours
- **Conversation History**: Continue the conversation with follow-up questions
- **Dark/Light Mode**: Toggle theme in the modal
- **Remember Settings**: Remembers your last used provider and model

## Supported Providers

| Provider | Vision Support | Model Sorting |
|----------|----------------|---------------|
| OpenAI | Yes | By release date (newest first) |
| Anthropic | Yes | By release date (newest first) |
| Google AI | Yes | By model ID |
| xAI | No | By release date (newest first) |
| DeepSeek | No | By model ID |

Available models are fetched dynamically from each provider's API. The model list is cached for 24 hours and can be cleared manually from the extension settings.

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `askai` folder

## Usage

### Setup API Keys

1. Click the AskAI extension icon in Chrome toolbar
2. Enter your API key for each provider you want to use
3. Click the checkmark to save

### Ask About Text

1. Select any text on a webpage
2. Click the "AskAI" button that appears
3. Choose your provider and model
4. Type your question or use a quick prompt
5. Press Enter or click the send button

### Ask About Screenshots

1. Click the AskAI extension icon
2. Click "Capture Screenshot & Ask AI"
3. Click and drag to select an area
4. Type your question about the captured image
5. Press Enter or click the send button

## Project Structure

```
askai/
├── manifest.json           # Extension configuration
├── background/
│   ├── service-worker.js   # Message router (entry point)
│   ├── api-chat.js         # Chat API calls to AI providers
│   └── api-models.js       # Model list fetching and caching
├── content/
│   ├── content.js          # Text selection, screenshot, modal UI
│   └── content.css         # Styles for floating button and modal
├── popup/
│   ├── popup.html          # Settings popup
│   ├── popup.css           # Settings styles
│   └── popup.js            # Settings logic
└── icons/                  # Extension icons
```

## Configuration

### Adding New Providers

1. Add provider name to `PROVIDER_NAMES` in `content/content.js`
2. Add provider to `PROVIDERS` array in `popup/popup.js`
3. Add chat API endpoint to `API_ENDPOINTS` and call function in `background/api-chat.js`
4. Add model list endpoint and fetch function in `background/api-models.js`
5. Add host permission in `manifest.json`

### Disabling Vision for a Provider

Add the provider ID to `EXCLUDED_FROM_SCREENSHOT` array in `content/content.js`:

```javascript
const EXCLUDED_FROM_SCREENSHOT = ['xai', 'provider_id'];
```

## API Keys

API keys are stored locally in Chrome's sync storage and are never sent anywhere except to the respective AI provider APIs.

Get your API keys from:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Google AI: https://aistudio.google.com/apikey
- xAI: https://console.x.ai/
- DeepSeek: https://platform.deepseek.com/

## License

MIT
