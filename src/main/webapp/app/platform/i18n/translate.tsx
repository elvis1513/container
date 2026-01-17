/**
 * i18n translation for site modules
 * Supports hot language switching between English and Chinese
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Static import translations
import enTranslations from '../../../i18n/en/site.json';
import zhTranslations from '../../../i18n/zhCn/site.json';

// Translation map
const translationsMap: Record<string, Record<string, string>> = {
  en: enTranslations,
  'zh-cn': zhTranslations,
};

// Supported languages
export const SUPPORTED_LOCALES = ['en', 'zh-cn'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Language names for display
export const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  'zh-cn': '中文',
};

// Context for i18n
interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Deep get nested value from object using dot notation
const getNestedValue = (obj: any, key: string): string => {
  const keys = key.split('.');
  let result = obj;
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key;
    }
  }
  return result || key;
};

// Interpolate values into string {placeholder} syntax
const interpolate = (template: string, values?: Record<string, string | number>): string => {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key];
    return value !== undefined ? String(value) : '{' + key + '}';
  });
};

// Provider component
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialLocale = (): SupportedLocale => {
    const htmlLang = document.documentElement.lang.toLowerCase();
    if (htmlLang.startsWith('zh')) return 'zh-cn';
    return 'en';
  };

  const [locale, setLocaleState] = useState<SupportedLocale>(getInitialLocale());

  // Update HTML lang attribute when locale changes
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Translate function
  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const translations = translationsMap[locale] || {};
      const translated = getNestedValue(translations, key);
      return interpolate(translated, values);
    },
    [locale],
  );

  const contextValue: I18nContextType = {
    locale,
    setLocale(newLocale: SupportedLocale) {
      if (newLocale !== locale) {
        setLocaleState(newLocale);
      }
    },
    t,
  };

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

// Hook to use translations
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
};

// Translate component
interface TranslateProps {
  contentKey: string;
  values?: Record<string, string | number>;
  children?: React.ReactNode;
}

export const Translate: React.FC<TranslateProps> = ({ contentKey, values, children }) => {
  const { t } = useTranslation();
  const translated = t(contentKey, values);
  // Use children as fallback if translation not found (key !== translated)
  return <>{translated === contentKey ? children : translated}</>;
};

// Language switcher component (simplified)
interface LanguageSwitcherProps {
  style?: React.CSSProperties;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style }) => {
  const { locale, setLocale } = useTranslation();

  return (
    <div style={{ ...style, display: 'flex', gap: '4px' }}>
      {SUPPORTED_LOCALES.map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => setLocale(lang)}
          style={{
            padding: '4px 8px',
            margin: '0 4px',
            fontSize: '14px',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: locale === lang ? '#3B82F6' : '#E2E8F0',
            color: locale === lang ? '#FFFFFF' : '#1E293B',
            fontWeight: locale === lang ? '500' : '400',
            transition: 'all 0.2s ease',
          }}
          aria-label={`Switch to ${LANGUAGE_NAMES[lang]}`}
        >
          {LANGUAGE_NAMES[lang]}
        </button>
      ))}
    </div>
  );
};
