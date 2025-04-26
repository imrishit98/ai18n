// Try to import Vue, but handle case when it's not available
let vue;
try {
  vue = require("vue");
} catch (e) {
  // Vue is not available, provide stubs
  vue = {
    ref: () => ({}),
    reactive: (obj) => obj,
    provide: () => {},
    inject: () => {},
    watch: () => {},
    onMounted: (fn) => {},
  };
}

const { ref, reactive, provide, inject, watch, onMounted } = vue;
import I18nClient from "../core";

const I18N_SYMBOL = Symbol("i18n");

/**
 * Create and provide i18n functionality
 */
export function createI18n(config) {
  const client = new I18nClient(config);
  const targetLanguage = ref(config.defaultTargetLanguage);
  const sourceLanguage = ref(config.defaultSourceLanguage || "en");
  const isLoaded = ref(false);
  const languages = ref([]);

  const i18n = reactive({
    client,
    targetLanguage,
    sourceLanguage,
    isLoaded,
    languages,

    setTargetLanguage(lang) {
      targetLanguage.value = lang;
    },

    async translate(text, options = {}) {
      if (!text) return "";

      const opts = {
        sourceLanguage: options.sourceLanguage || sourceLanguage.value,
        targetLanguage: options.targetLanguage || targetLanguage.value,
        ...options,
      };

      if (opts.sourceLanguage === opts.targetLanguage) {
        return text;
      }

      try {
        const result = await client.translate(text, opts);
        return result.text;
      } catch (error) {
        console.error("[i18n] Translation error:", error);
        return text;
      }
    },
  });

  // Load languages on initialization
  onMounted(async () => {
    const langs = await client.getLanguages();
    languages.value = langs;
    isLoaded.value = true;
  });

  // Provide i18n context
  provide(I18N_SYMBOL, i18n);

  return i18n;
}

/**
 * Use i18n functionality in a component
 */
export function useI18n() {
  const i18n = inject(I18N_SYMBOL);

  if (!i18n) {
    throw new Error(
      "useI18n must be used within a component with i18n provided"
    );
  }

  return i18n;
}

/**
 * Translation composable
 */
export function useTranslation(textOrRef, options = {}) {
  const i18n = useI18n();
  const translated = ref("");
  const isLoading = ref(false);
  const error = ref(null);

  const updateTranslation = async () => {
    const text =
      typeof textOrRef === "function"
        ? textOrRef()
        : textOrRef.value !== undefined
        ? textOrRef.value
        : textOrRef;

    if (!text) {
      translated.value = "";
      isLoading.value = false;
      return;
    }

    const opts = {
      sourceLanguage: options.sourceLanguage || i18n.sourceLanguage.value,
      targetLanguage: options.targetLanguage || i18n.targetLanguage.value,
      ...options,
    };

    if (opts.sourceLanguage === opts.targetLanguage) {
      translated.value = text;
      isLoading.value = false;
      return;
    }

    isLoading.value = true;

    try {
      const result = await i18n.client.translate(text, opts);
      translated.value = result.text;
      error.value = null;
    } catch (err) {
      translated.value = text;
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  // Watch for changes in text or language
  watch(
    () => [
      typeof textOrRef === "function"
        ? textOrRef()
        : textOrRef.value !== undefined
        ? textOrRef.value
        : textOrRef,
      options.targetLanguage || i18n.targetLanguage.value,
    ],
    updateTranslation,
    { immediate: true }
  );

  return {
    text: translated,
    isLoading,
    error,
  };
}

// Export as default object for conditional imports
export default {
  createI18n,
  useI18n,
  useTranslation,
};
