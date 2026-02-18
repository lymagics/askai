const API_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/responses',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
  xai: 'https://api.x.ai/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions'
};

export async function handleAskAI(request) {
  const { provider, model, selectedText, screenshot, prompt, conversationHistory } = request;

  const { apiKeys } = await chrome.storage.sync.get(['apiKeys']);
  const apiKey = apiKeys?.[provider];

  if (!apiKey) {
    throw new Error(`API key not configured for ${provider}. Please set it in the extension settings.`);
  }

  switch (provider) {
    case 'openai':
      return await callOpenAI(apiKey, model, selectedText, screenshot, prompt, conversationHistory);
    case 'anthropic':
      return await callAnthropic(apiKey, model, selectedText, screenshot, prompt, conversationHistory);
    case 'google':
      return await callGoogle(apiKey, model, selectedText, screenshot, prompt, conversationHistory);
    case 'xai':
      return await callXAI(apiKey, model, selectedText, screenshot, prompt, conversationHistory);
    case 'deepseek':
      return await callDeepSeek(apiKey, model, selectedText, prompt, conversationHistory);
    default:
      throw new Error('Unknown provider');
  }
}

function buildConversationContext(selectedText, prompt, conversationHistory) {
  let context = '';
  if (selectedText) {
    context = `Context (selected text):\n"""${selectedText}"""\n\n`;
  }

  if (conversationHistory && conversationHistory.length > 0) {
    return { hasHistory: true, context };
  }

  return { hasHistory: false, context, fullPrompt: context + prompt };
}

function extractBase64Data(dataUrl) {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (match) {
    return { mediaType: `image/${match[1]}`, data: match[2] };
  }
  return null;
}

async function callOpenAI(apiKey, model, selectedText, screenshot, prompt, conversationHistory) {
  const { hasHistory, context, fullPrompt } = buildConversationContext(selectedText, prompt, conversationHistory);

  let input;
  if (hasHistory) {
    const messages = [];
    if (context) {
      messages.push({ role: 'user', content: context + conversationHistory[0]?.content });
      messages.push(...conversationHistory.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    } else {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }
    messages.push({ role: 'user', content: prompt });
    input = messages;
  } else if (screenshot) {
    input = [
      {
        role: 'user',
        content: [
          {
            type: 'input_image',
            image_url: screenshot
          },
          {
            type: 'input_text',
            text: prompt
          }
        ]
      }
    ];
  } else {
    input = fullPrompt;
  }

  const body = {
    model,
    input,
    instructions: 'You are a helpful assistant. Provide clear, concise, and accurate responses. Always respond in the same language that the user writes in. Use web search when needed for up-to-date information.',
    tools: [
      {
        type: 'web_search_preview'
      }
    ]
  };

  const response = await fetch(API_ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.output && Array.isArray(data.output)) {
    const textItems = data.output
      .filter(item => item.type === 'message' && item.content)
      .flatMap(item => item.content)
      .filter(content => content.type === 'output_text')
      .map(content => content.text);

    if (textItems.length > 0) {
      return textItems.join('\n');
    }
  }

  return data.output_text || 'No response generated';
}

async function callAnthropic(apiKey, model, selectedText, screenshot, prompt, conversationHistory) {
  const { hasHistory, context } = buildConversationContext(selectedText, prompt, conversationHistory);

  let messages = [];
  if (hasHistory) {
    if (context) {
      messages.push({ role: 'user', content: context + conversationHistory[0]?.content });
      messages.push(...conversationHistory.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    } else {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }
    messages.push({ role: 'user', content: prompt });
  } else if (screenshot) {
    const imageData = extractBase64Data(screenshot);
    messages = [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageData.mediaType,
            data: imageData.data
          }
        },
        {
          type: 'text',
          text: prompt
        }
      ]
    }];
  } else {
    messages = [{ role: 'user', content: context + prompt }];
  }

  const response = await fetch(API_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages,
      system: 'You are a helpful assistant. Provide clear, concise, and accurate responses. Always respond in the same language that the user writes in.'
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || 'No response generated';
}

async function callGoogle(apiKey, model, selectedText, screenshot, prompt, conversationHistory) {
  const endpoint = API_ENDPOINTS.google.replace('{model}', model) + `?key=${apiKey}`;

  const { hasHistory, context } = buildConversationContext(selectedText, prompt, conversationHistory);

  let contents = [];
  if (hasHistory) {
    if (context) {
      contents.push({
        role: 'user',
        parts: [{ text: context + conversationHistory[0]?.content }]
      });
      conversationHistory.slice(1).forEach(msg => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      });
    } else {
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      });
    }
    contents.push({ role: 'user', parts: [{ text: prompt }] });
  } else if (screenshot) {
    const imageData = extractBase64Data(screenshot);
    contents = [{
      role: 'user',
      parts: [
        {
          inline_data: {
            mime_type: imageData.mediaType,
            data: imageData.data
          }
        },
        { text: prompt }
      ]
    }];
  } else {
    contents = [{ role: 'user', parts: [{ text: context + prompt }] }];
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: 'You are a helpful assistant. Provide clear, concise, and accurate responses. Always respond in the same language that the user writes in.' }]
      },
      tools: [
        {
          google_search: {}
        }
      ],
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Google AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
}

async function callXAI(apiKey, model, selectedText, screenshot, prompt, conversationHistory) {
  const { hasHistory, context } = buildConversationContext(selectedText, prompt, conversationHistory);

  let messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Provide clear, concise, and accurate responses. Always respond in the same language that the user writes in. Use live search when needed for up-to-date information.'
    }
  ];

  if (hasHistory) {
    if (context) {
      messages.push({ role: 'user', content: context + conversationHistory[0]?.content });
      messages.push(...conversationHistory.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    } else {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }
    messages.push({ role: 'user', content: prompt });
  } else {
    messages.push({ role: 'user', content: context + prompt });
  }

  const body = {
    model,
    messages,
    max_tokens: 4096,
    temperature: 0.7,
    stream: false
  };

  const response = await fetch(API_ENDPOINTS.xai, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `xAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}

async function callDeepSeek(apiKey, model, selectedText, prompt, conversationHistory) {
  const { hasHistory, context } = buildConversationContext(selectedText, prompt, conversationHistory);

  let messages = [
    {
      role: 'system',
      content: 'You are a helpful assistant. Provide clear, concise, and accurate responses. Always respond in the same language that the user writes in.'
    }
  ];

  if (hasHistory) {
    if (context) {
      messages.push({ role: 'user', content: context + conversationHistory[0]?.content });
      messages.push(...conversationHistory.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    } else {
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }
    messages.push({ role: 'user', content: prompt });
  } else {
    messages.push({ role: 'user', content: context + prompt });
  }

  const body = {
    model,
    messages,
    max_tokens: 4096,
    temperature: 0.7,
    stream: false
  };

  const response = await fetch(API_ENDPOINTS.deepseek, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}
