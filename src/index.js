import I18nClient from "./core";
import * as reactComponents from "./react";

// Export core client
export default I18nClient;

// Export React components
export const {
  I18nProvider,
  useI18n,
  useTranslate,
  Translate,
  LanguageSelector,
} = reactComponents;

// Conditionally export Vue components if Vue is available
let vueComponents = null;
try {
  // This will fail silently if Vue is not available
  vueComponents = require("./vue").default;
} catch (e) {
  // Vue is not available, provide stub components
  vueComponents = {
    createI18n: () => {
      console.warn("Vue is not available. Install Vue to use Vue components.");
      return {};
    },
    useI18n: () => {
      console.warn("Vue is not available. Install Vue to use Vue components.");
      return {};
    },
    useTranslation: () => {
      console.warn("Vue is not available. Install Vue to use Vue components.");
      return { text: "", isLoading: false, error: null };
    },
  };
}

// Export Vue components
export const {
  createI18n,
  useI18n: useVueI18n,
  useTranslation,
} = vueComponents;
