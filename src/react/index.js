import { useState, useEffect, useContext, createContext } from "react";
import I18nClient from "../core";

// Create context for i18n
const I18nContext = createContext(null);

/**
 * Provider component for i18n context
 */
export function I18nProvider({ config, children }) {
  const [client] = useState(() => new I18nClient(config));
  const [targetLanguage, setTargetLanguage] = useState(
    config.defaultTargetLanguage
  );
  const [sourceLanguage] = useState(config.defaultSourceLanguage || "en");
  const [isLoaded, setIsLoaded] = useState(false);
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    // Load languages on initialization
    async function loadLanguages() {
      const langs = await client.getLanguages();
      setLanguages(langs);
      setIsLoaded(true);
    }

    loadLanguages();
  }, [client]);

  const value = {
    client,
    targetLanguage,
    setTargetLanguage,
    sourceLanguage,
    languages,
    isLoaded,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook for accessing i18n client and state
 */
export function useI18n() {
  const context = useContext(I18nContext);

  if (context === null) {
    throw new Error("useI18n must be used within an I18nProvider");
  }

  return context;
}

/**
 * Hook for translating text
 */
export function useTranslate(text, options = {}) {
  const { client, targetLanguage, sourceLanguage } = useI18n();
  const [translation, setTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const opts = {
    sourceLanguage: options.sourceLanguage || sourceLanguage,
    targetLanguage: options.targetLanguage || targetLanguage,
    ...options,
  };

  useEffect(() => {
    let isMounted = true;

    async function translateText() {
      if (
        !text ||
        !opts.targetLanguage ||
        opts.sourceLanguage === opts.targetLanguage
      ) {
        setTranslation(text || "");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const result = await client.translate(text, opts);

        if (isMounted) {
          setTranslation(result.text);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setTranslation(text);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    translateText();

    return () => {
      isMounted = false;
    };
  }, [text, opts.sourceLanguage, opts.targetLanguage, opts.force, client]);

  return {
    text: translation,
    isLoading,
    error,
    sourceLanguage: opts.sourceLanguage,
    targetLanguage: opts.targetLanguage,
  };
}

/**
 * Component for translating text
 */
export function Translate({ children, ...options }) {
  const { text, isLoading } = useTranslate(children, options);

  return isLoading ? <span className="i18n-loading">...</span> : <>{text}</>;
}

/**
 * Language selector component
 */
export function LanguageSelector({ onChange, value, className }) {
  const { languages, targetLanguage, setTargetLanguage } = useI18n();

  const handleChange = (e) => {
    const lang = e.target.value;
    setTargetLanguage(lang);
    if (onChange) onChange(lang);
  };

  return (
    <select
      value={value || targetLanguage}
      onChange={handleChange}
      className={className || "i18n-language-selector"}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
