import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { I18nContext, getStoredLocale, saveLocale, useI18nMemo } from './index';
import type { Locale } from './types';

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    saveLocale(next);
  }, []);

  const value = useI18nMemo(locale, setLocale);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.title = value.t.app.documentTitle;
  }, [locale, value.t.app.documentTitle]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
