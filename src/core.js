/**
 * Core functionality for i18n client
 */
export default class I18nClient {
  /**
   * Initialize the i18n client
   * @param {Object} config Configuration options
   * @param {string} config.apiUrl API endpoint URL
   * @param {string} config.apiKey API key for authentication
   * @param {string} config.defaultSourceLanguage Default source language
   * @param {string} config.defaultTargetLanguage Default target language
   * @param {boolean} config.useLocalCache Whether to use local storage for caching
   * @param {number} config.cacheTTL Time to live for cache entries in seconds
   * @param {boolean} config.debug Enable debug logging
   */
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || "https://api.yourdomain.com";
    this.apiKey = config.apiKey;
    this.defaultSourceLanguage = config.defaultSourceLanguage || "en";
    this.defaultTargetLanguage = config.defaultTargetLanguage;
    this.useLocalCache = config.useLocalCache !== false;
    this.cacheTTL = config.cacheTTL || 86400; // 24 hours default
    this.debug = config.debug || false;

    this.pendingRequests = {};

    if (!this.apiKey) {
      this.log("Warning: No API key provided. Translations will fail.");
    }
  }

  /**
   * Translate text from source to target language
   * @param {string} text Text to translate
   * @param {Object} options Translation options
   * @param {string} options.sourceLanguage Source language code
   * @param {string} options.targetLanguage Target language code
   * @param {boolean} options.preserveFormatting Preserve formatting in translation
   * @param {boolean} options.force Force translation (skip cache)
   * @returns {Promise<Object>} Translation result object
   */
  async translate(text, options = {}) {
    const sourceLanguage = options.sourceLanguage || this.defaultSourceLanguage;
    const targetLanguage = options.targetLanguage || this.defaultTargetLanguage;

    if (!text) return { text: "", translated: false };
    if (!targetLanguage) return { text, translated: false };
    if (sourceLanguage === targetLanguage) return { text, translated: false };

    // Generate cache key
    const cacheKey = this._generateCacheKey(
      sourceLanguage,
      targetLanguage,
      text
    );

    // Check local cache if enabled
    if (this.useLocalCache && !options.force) {
      const cached = this._getFromLocalCache(cacheKey);
      if (cached) {
        this.log("Cache hit:", cacheKey);
        return { text: cached, translated: true, fromCache: true };
      }
    }

    // Check for pending requests to same text
    if (this.pendingRequests[cacheKey]) {
      this.log("Using pending request for:", cacheKey);
      return this.pendingRequests[cacheKey];
    }

    // Create the API request
    const requestPromise = this._fetchTranslation(
      text,
      sourceLanguage,
      targetLanguage,
      options.preserveFormatting
    );

    // Store promise to avoid duplicate requests
    this.pendingRequests[cacheKey] = requestPromise;

    try {
      const result = await requestPromise;

      // Cache the result if successful
      if (result.translated && this.useLocalCache) {
        this._saveToLocalCache(cacheKey, result.text);
      }

      return result;
    } finally {
      // Clean up pending request reference
      delete this.pendingRequests[cacheKey];
    }
  }

  /**
   * Batch translate multiple texts
   * @param {Array<Object>} items Array of items to translate
   * @param {string} items[].text Text to translate
   * @param {string} items[].sourceLanguage Source language code
   * @param {string} items[].targetLanguage Target language code
   * @param {string} items[].id Optional identifier for the item
   * @param {Object} options Batch options
   * @returns {Promise<Object>} Batch translation result
   */
  async batchTranslate(items, options = {}) {
    if (!items || !items.length) {
      return { results: [] };
    }

    // Fill in defaults
    const processedItems = items.map((item) => ({
      id: item.id || this._generateId(),
      text: item.text,
      sourceLanguage: item.sourceLanguage || this.defaultSourceLanguage,
      targetLanguage: item.targetLanguage || this.defaultTargetLanguage,
    }));

    // Check cache for each item first
    if (this.useLocalCache && !options.force) {
      for (const item of processedItems) {
        const cacheKey = this._generateCacheKey(
          item.sourceLanguage,
          item.targetLanguage,
          item.text
        );

        const cached = this._getFromLocalCache(cacheKey);
        if (cached) {
          item.translated = true;
          item.translatedText = cached;
          item.fromCache = true;
        }
      }
    }

    // Filter items that need translation
    const itemsToTranslate = processedItems.filter((item) => !item.translated);

    if (itemsToTranslate.length === 0) {
      // All items were found in cache
      return {
        results: processedItems.map((item) => ({
          id: item.id,
          text: item.translatedText,
          translated: true,
          fromCache: true,
        })),
      };
    }

    // Send batch request for items not in cache
    try {
      const response = await fetch(`${this.apiUrl}/api/translate/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          items: itemsToTranslate,
          preserveFormatting: options.preserveFormatting !== false,
          async: options.async || false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Translation failed");
      }

      // For async requests, return job ID
      if (options.async && result.jobId) {
        return {
          jobId: result.jobId,
          status: "processing",
        };
      }

      // For sync requests or completed async, merge with cached results
      const translatedMap = {};

      // Cache new translations
      if (result.results) {
        for (const item of result.results) {
          translatedMap[item.id] = item;

          if (item.translated && this.useLocalCache) {
            // Find original item to get language info
            const originalItem = processedItems.find((i) => i.id === item.id);
            if (originalItem) {
              const cacheKey = this._generateCacheKey(
                originalItem.sourceLanguage,
                originalItem.targetLanguage,
                originalItem.text
              );
              this._saveToLocalCache(cacheKey, item.text);
            }
          }
        }
      }

      // Merge cached and new translations
      return {
        results: processedItems.map((item) => {
          if (item.translated) {
            // Return cached result
            return {
              id: item.id,
              text: item.translatedText,
              translated: true,
              fromCache: true,
            };
          } else {
            // Return API result or error
            return (
              translatedMap[item.id] || {
                id: item.id,
                text: item.text,
                translated: false,
                error: "Translation failed",
              }
            );
          }
        }),
      };
    } catch (error) {
      this.log("Translation error:", error);

      return {
        error: error.message,
        results: processedItems.map((item) => ({
          id: item.id,
          text: item.text,
          translated: false,
          error: error.message,
        })),
      };
    }
  }

  /**
   * Check translation job status
   * @param {string} jobId Job ID to check
   * @returns {Promise<Object>} Job status
   */
  async checkJobStatus(jobId) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/translate/status/${jobId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": this.apiKey,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to check job status");
      }

      // If job is complete, cache translations
      if (
        result.status === "completed" &&
        result.results &&
        this.useLocalCache
      ) {
        // We don't have language info here, so we can't cache the results
        // This is a limitation of the batch status API
      }

      return result;
    } catch (error) {
      this.log("Job status check error:", error);
      return {
        error: error.message,
        status: "error",
      };
    }
  }

  /**
   * Fetch language list from API
   * @returns {Promise<Array>} List of supported languages
   */
  async getLanguages() {
    try {
      const cacheKey = "i18n_languages";

      // Check cache first
      if (this.useLocalCache) {
        const cached = this._getFromLocalCache(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await fetch(`${this.apiUrl}/api/languages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch languages");
      }

      // Cache for 24 hours
      if (this.useLocalCache) {
        this._saveToLocalCache(cacheKey, result.languages);
      }

      return result.languages;
    } catch (error) {
      this.log("Failed to fetch languages:", error);
      return [];
    }
  }

  /**
   * Clear local cache
   * @param {string} targetLanguage Optional target language to clear
   */
  clearCache(targetLanguage = null) {
    if (!this.useLocalCache) return;

    try {
      if (!targetLanguage) {
        // Clear all cache entries with our prefix
        const prefix = "i18n_";
        const keys = Object.keys(localStorage);

        for (const key of keys) {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        }

        this.log("Cleared all translation cache");
      } else {
        // Clear only for specific language
        const prefix = `i18n_${this.defaultSourceLanguage}:${targetLanguage}:`;
        const keys = Object.keys(localStorage);

        for (const key of keys) {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        }

        this.log(`Cleared cache for ${targetLanguage}`);
      }
    } catch (error) {
      this.log("Error clearing cache:", error);
    }
  }

  /**
   * Generate a unique cache key
   * @private
   */
  _generateCacheKey(sourceLanguage, targetLanguage, text) {
    // Simple hash function for text
    const hash = this._simpleHash(text);
    return `${sourceLanguage}:${targetLanguage}:${hash}`;
  }

  /**
   * Generate a unique ID
   * @private
   */
  _generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Simple string hash function
   * @private
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Save translation to local cache
   * @private
   */
  _saveToLocalCache(key, value) {
    try {
      const cacheItem = {
        value,
        expires: Date.now() + this.cacheTTL * 1000,
      };

      localStorage.setItem(`i18n_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      this.log("Error saving to cache:", error);
    }
  }

  /**
   * Get translation from local cache
   * @private
   */
  _getFromLocalCache(key) {
    try {
      const item = localStorage.getItem(`i18n_${key}`);

      if (!item) return null;

      const cacheItem = JSON.parse(item);

      // Check expiration
      if (cacheItem.expires < Date.now()) {
        localStorage.removeItem(`i18n_${key}`);
        return null;
      }

      return cacheItem.value;
    } catch (error) {
      this.log("Error reading from cache:", error);
      return null;
    }
  }

  /**
   * Fetch translation from API
   * @private
   */
  async _fetchTranslation(
    text,
    sourceLanguage,
    targetLanguage,
    preserveFormatting = true
  ) {
    try {
      const response = await fetch(`${this.apiUrl}/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage,
          preserveFormatting,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Translation failed");
      }

      return { text: result.text, translated: true };
    } catch (error) {
      this.log("Translation error:", error);
      return { text, translated: false, error: error.message };
    }
  }

  /**
   * Log debug messages
   * @private
   */
  log(...args) {
    if (this.debug) {
      console.log("[i18n]", ...args);
    }
  }
}
