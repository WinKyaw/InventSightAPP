import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Import translations
import en from './en.json';
import es from './es.json';
import zh from './zh.json';
import ja from './ja.json';
import my from './my.json';

// Language storage key
const LANGUAGE_STORAGE_KEY = '@app_language';

// Available languages
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ' },
];

// Get device locale or fallback to English
const getDeviceLocale = (): string => {
  try {
    // Try method 1: getLocales() - Most reliable
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const primaryLocale = locales[0];
      if (primaryLocale.languageCode) {
        const languageCode = primaryLocale.languageCode.toLowerCase();
        const supportedLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
        if (supportedLanguage) {
          console.log(`✅ Device locale detected: ${languageCode}`);
          return languageCode;
        }
      }
    }
    
    // Try method 2: Localization.locale (fallback)
    const locale = Localization.locale;
    if (locale && typeof locale === 'string') {
      // Extract language code (e.g., 'en-US' -> 'en')
      const languageCode = locale.split('-')[0].toLowerCase();
      const supportedLanguage = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
      if (supportedLanguage) {
        console.log(`✅ Device locale detected (fallback): ${languageCode}`);
        return languageCode;
      }
    }
    
    // Fallback to English
    console.log('⚠️ Could not detect device locale, defaulting to English');
    return 'en';
  } catch (error) {
    console.error('❌ Error getting device locale:', error);
    return 'en';
  }
};

// Get stored language preference
const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting stored language:', error);
    return null;
  }
};

// Store language preference
const storeLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error storing language:', error);
  }
};

// Initialize i18next
const initI18n = async () => {
  try {
    // Get stored language or device locale
    const storedLanguage = await getStoredLanguage();
    const deviceLocale = getDeviceLocale();
    
    // Validate saved language is supported
    let initialLanguage = storedLanguage || deviceLocale;
    let languageInfo = AVAILABLE_LANGUAGES.find(lang => lang.code === initialLanguage);
    if (!languageInfo) {
      console.warn(`⚠️ Language "${initialLanguage}" not supported, falling back to English`);
      initialLanguage = 'en';
      languageInfo = AVAILABLE_LANGUAGES.find(lang => lang.code === 'en')!;
    }

    await i18next
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v3',
        resources: {
          en: { translation: en },
          es: { translation: es },
          zh: { translation: zh },
          ja: { translation: ja },
          my: { translation: my },
        },
        lng: initialLanguage,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false, // React already does escaping
        },
        react: {
          useSuspense: false,
        },
      });

    console.log(`✅ i18n initialized with language: ${initialLanguage} (${languageInfo.name})`);
  } catch (error) {
    console.error('❌ Error initializing i18n:', error);
    // Fallback initialization
    await i18next
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v3',
        resources: {
          en: { translation: en },
          es: { translation: es },
          zh: { translation: zh },
          ja: { translation: ja },
          my: { translation: my },
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
    console.log('✅ i18n initialized with fallback language: en (English)');
  }
};

// Initialize on import
initI18n();

// Helper functions

/**
 * Change the current language
 * @param language Language code (en, es, zh, ja, my)
 */
export const changeLanguage = async (language: string): Promise<void> => {
  try {
    // Validate language is supported
    const isSupported = AVAILABLE_LANGUAGES.find(lang => lang.code === language);
    if (!isSupported) {
      console.error(`❌ Language "${language}" is not supported`);
      throw new Error(`Language "${language}" is not supported`);
    }

    // Change language in i18next
    await i18next.changeLanguage(language);
    
    // Store preference
    await storeLanguage(language);
    
    console.log(`✅ Language changed to: ${language} (${isSupported.name})`);
  } catch (error) {
    console.error('❌ Error changing language:', error);
    throw error;
  }
};

/**
 * Get the current language code
 * @returns Current language code
 */
export const getCurrentLanguage = (): string => {
  return i18next.language || 'en';
};

/**
 * Get list of available languages
 * @returns Array of available languages
 */
export const getAvailableLanguages = () => {
  return AVAILABLE_LANGUAGES;
};

/**
 * Get language name by code
 * @param code Language code
 * @returns Language name
 */
export const getLanguageName = (code: string): string => {
  const language = AVAILABLE_LANGUAGES.find(lang => lang.code === code);
  return language ? language.nativeName : code;
};

export default i18next;
