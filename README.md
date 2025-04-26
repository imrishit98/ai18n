# ai18n

A lightweight, flexible client library for integrating with AI-powered translation services.

## Installation

```bash
npm install ai18n
```

## Quick Start

### Basic Usage

```javascript
import I18nClient from 'ai18n';

const i18n = new I18nClient({
  apiKey: 'your-api-key', 
  apiUrl: 'https://your-worker-url.workers.dev',
  defaultSourceLanguage: 'en',
  defaultTargetLanguage: 'es'
});

// Translate text
const result = await i18n.translate('Hello world!');
console.log(result.text); // '¡Hola mundo!'
```

### React Integration

```jsx
import React from 'react';
import { I18nProvider, useTranslate, Translate, LanguageSelector } from 'ai18n';

// In your root component
function App() {
  return (
    <I18nProvider config={{
      apiKey: 'your-api-key',
      apiUrl: 'https://your-worker-url.workers.dev',
      defaultSourceLanguage: 'en',
      defaultTargetLanguage: 'es'
    }}>
      <YourApp />
    </I18nProvider>
  );
}

// In a component
function YourComponent() {
  const { text, isLoading } = useTranslate('Hello world!');
  
  if (isLoading) return <p>Loading...</p>;
  return <p>{text}</p>;
}

// Or use component version
function AnotherComponent() {
  return (
    <div>
      <LanguageSelector />
      <Translate>Hello world!</Translate>
    </div>
  );
}
```

### Vue Integration

```javascript
import { createApp } from 'vue';
import { createI18n, useTranslation } from 'ai18n';

const app = createApp(App);

// Create and provide i18n
const i18n = createI18n({
  apiKey: 'your-api-key',
  apiUrl: 'https://your-worker-url.workers.dev',
  defaultSourceLanguage: 'en',
  defaultTargetLanguage: 'es'
});

app.provide('i18n', i18n);
app.mount('#app');

// In a component
export default {
  setup() {
    const message = ref('Hello world!');
    const { text, isLoading } = useTranslation(message);
    
    return {
      translatedText: text,
      isLoading
    };
  }
};
```

## Configuration Options

| Option                | Type    | Default                      | Description                   |
| --------------------- | ------- | ---------------------------- | ----------------------------- |
| apiUrl                | string  | 'https://api.yourdomain.com' | API endpoint URL              |
| apiKey                | string  |                              | API key for authentication    |
| defaultSourceLanguage | string  | 'en'                         | Default source language       |
| defaultTargetLanguage | string  |                              | Default target language       |
| useLocalCache         | boolean | true                         | Enable local storage caching  |
| cacheTTL              | number  | 86400                        | Cache time to live in seconds |
| debug                 | boolean | false                        | Enable debug logging          |

## License

MIT