# AskAI

A Chrome extension that lets you select text or capture screenshots on any webpage and ask AI about them.

## Features

- **Text Selection**: Select any text on a webpage, click the AskAI button, and ask questions about it
- **Screenshot Capture**: Capture any area of the screen and ask AI to analyze it
- **Multiple AI Providers**: Support for OpenAI, Anthropic, Google AI, xAI, and DeepSeek
- **Conversation History**: Continue the conversation with follow-up questions
- **Dark/Light Mode**: Toggle theme in the modal
- **Remember Settings**: Remembers your last used provider and model

## Supported Providers

| Provider | Models | Vision Support |
|----------|--------|----------------|
| OpenAI | O4 Mini, GPT-5.2, GPT-5, GPT-4.1, GPT-4o, GPT-4, GPT-3.5 Turbo, GPT-3.5 | Yes |
| Anthropic | Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.5, Claude Opus 4.1, Claude Sonnet 4.0 | Yes |
| Google AI | Gemini 3 Pro/Flash Preview, Gemini 2.5 Pro/Flash/Lite, Gemini 2.0 Flash/Lite | Yes |
| DeepSeek | DeepSeek Chat, DeepSeek Reasoner | Yes |
| xAI | Grok 4.1, Grok 4, Grok 3 | No |

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
│   └── service-worker.js   # API calls to AI providers
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

1. Add models to `MODELS` object in `content/content.js`
2. Add provider name to `PROVIDER_NAMES` in `content/content.js`
3. Add provider to `PROVIDERS` array in `popup/popup.js`
4. Add API endpoint to `API_ENDPOINTS` in `background/service-worker.js`
5. Add API call function in `background/service-worker.js`
6. Add host permission in `manifest.json`

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
