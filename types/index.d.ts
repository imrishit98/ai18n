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

// Vue component types (available only when Vue is installed)
export function createI18n(config: I18nClientConfig): {
  client: I18nClient;
  targetLanguage: any; // Use 'any' instead of direct Vue import
  sourceLanguage: any;
  isLoaded: any;
  languages: any;
  setTargetLanguage: (language: string) => void;
  translate: (text: string, options?: TranslateOptions) => Promise<string>;
};

export function useVueI18n(): ReturnType<typeof createI18n>;

export function useTranslation(
  textOrRef: string | (() => string) | any, // Use 'any' instead of direct Vue import
  options?: TranslateOptions
): {
  text: any; // Use 'any' instead of direct Vue import
  isLoading: any;
  error: any;
};

// Default export
export default I18nClient; 