/**
 * Simple i18n translation for site modules
 * PR#1: Basic translation hook and component
 */

import React from 'react';

export const useTranslation = () => {
  // Check current locale from HTML lang attribute or default to 'en'
  const getLocale = (): string => {
    return document.documentElement.lang || 'en';
  };

  const t = (key: string, fallback?: string): string => {
    // For now, just return the fallback or key
    // Full i18n integration can be added later
    return fallback || key;
  };

  return { t, locale: getLocale() };
};

// Simple translation component
interface TranslateProps {
  contentKey: string;
  children?: React.ReactNode;
}

export const Translate: React.FC<TranslateProps> = ({ contentKey, children }) => {
  // For PR#1, just render children (the fallback text)
  return <>{children}</>;
};
