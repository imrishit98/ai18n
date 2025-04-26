import I18nClient from "./core";
import * as reactComponents from "./react";
import * as vueComponents from "./vue";

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

// Export Vue components
export const {
  createI18n,
  useI18n: useVueI18n,
  useTranslation,
} = vueComponents;
