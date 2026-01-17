// Translation helper for site modules

export type TranslateKey = `site.${string}`;

export { I18nProvider, useTranslation, Translate, LanguageSwitcher, SUPPORTED_LOCALES, LANGUAGE_NAMES } from './translate';
export type { SupportedLocale } from './translate';
