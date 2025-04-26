// Core client types
declare class I18nClient {
  constructor(config?: I18nClientConfig);
  translate(text: string, options?: TranslateOptions): Promise<TranslationResult>;
  batchTranslate(items: TranslationItem[], options?: BatchOptions): Promise<BatchResult>;
  checkJobStatus(jobId: string): Promise<JobStatus>;
  getLanguages(): Promise<Language[]>;
  clearCache(targetLanguage?: string): void;
}

interface I18nClientConfig {
  apiUrl?: string;
  apiKey: string;
  defaultSourceLanguage?: string;
  defaultTargetLanguage?: string;
  useLocalCache?: boolean;
  cacheTTL?: number;
  debug?: boolean;
}

interface TranslateOptions {
  sourceLanguage?: string;
  targetLanguage: string;
  preserveFormatting?: boolean;
  force?: boolean;
}

interface TranslationResult {
  text: string;
  translated: boolean;
  fromCache?: boolean;
  error?: string;
}

interface TranslationItem {
  id?: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

interface BatchOptions {
  preserveFormatting?: boolean;
  async?: boolean;
  force?: boolean;
}

interface BatchResult {
  results?: Array<{
    id: string;
    text: string;
    translated: boolean;
    fromCache?: boolean;
    error?: string;
  }>;
  jobId?: string;
  status?: string;
  error?: string;
}

interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  results?: Array<{
    id: string;
    text: string;
    translated: boolean;
    error?: string;
  }>;
  error?: string;
}

interface Language {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
  rtl?: boolean;
}

// React component types
export function I18nProvider(props: { 
  config: I18nClientConfig; 
  children: React.ReactNode;
}): JSX.Element;

export function useI18n(): {
  client: I18nClient;
  targetLanguage: string;
  setTargetLanguage: (language: string) => void;
  sourceLanguage: string;
  languages: Language[];
  isLoaded: boolean;
};

export function useTranslate(text: string, options?: TranslateOptions): {
  text: string;
  isLoading: boolean;
  error: string | null;
  sourceLanguage: string;
  targetLanguage: string;
};

export function Translate(props: {
  children: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  preserveFormatting?: boolean;
}): JSX.Element;

export function LanguageSelector(props: {
  onChange?: (language: string) => void;
  value?: string;
  className?: string;
}): JSX.Element;

// Vue component types
export function createI18n(config: I18nClientConfig): {
  client: I18nClient;
  targetLanguage: import('vue').Ref<string>;
  sourceLanguage: import('vue').Ref<string>;
  isLoaded: import('vue').Ref<boolean>;
  languages: import('vue').Ref<Language[]>;
  setTargetLanguage: (language: string) => void;
  translate: (text: string, options?: TranslateOptions) => Promise<string>;
};

export function useI18n(): ReturnType<typeof createI18n>;

export function useTranslation(
  textOrRef: string | (() => string) | import('vue').Ref<string>,
  options?: TranslateOptions
): {
  text: import('vue').Ref<string>;
  isLoading: import('vue').Ref<boolean>;
  error: import('vue').Ref<string | null>;
};

// Default export
export default I18nClient; 