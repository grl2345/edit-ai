import { createContext, useContext, useMemo } from 'react';
import {
  FONTS,
  FontMeta,
  PALETTES,
  PaletteMeta,
  TEMPLATES,
  TemplateCategory,
  TemplateMeta,
} from '../utils/themes';
import { en } from './locales/en';
import { zh } from './locales/zh';
import type { Locale, Messages } from './types';

export type { Locale, Messages } from './types';

export const LOCALE_KEY = 'markdown-ai:locale';

const LOCALES: Record<Locale, Messages> = { zh, en };

export function isLocale(v: unknown): v is Locale {
  return v === 'zh' || v === 'en';
}

export function getStoredLocale(): Locale {
  try {
    const v = localStorage.getItem(LOCALE_KEY);
    if (isLocale(v)) return v;
  } catch {
    /* ignore */
  }
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'zh';
  return lang.startsWith('zh') ? 'zh' : 'en';
}

export function saveLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function format(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

export function localizedPalettes(messages: Messages): PaletteMeta[] {
  return PALETTES.map((p) => ({
    ...p,
    name: messages.themes.palettes[p.id].name,
    desc: messages.themes.palettes[p.id].desc,
  }));
}

export function localizedFonts(messages: Messages): FontMeta[] {
  return FONTS.map((f) => ({
    ...f,
    name: messages.themes.fonts[f.id].name,
    desc: messages.themes.fonts[f.id].desc,
  }));
}

export function localizedTemplates(messages: Messages): TemplateMeta[] {
  return TEMPLATES.map((t) => ({
    ...t,
    name: messages.themes.templates[t.id].name,
    desc: messages.themes.templates[t.id].desc,
  }));
}

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
  format: typeof format;
  palettes: PaletteMeta[];
  fonts: FontMeta[];
  templates: TemplateMeta[];
  categoryLabel: (id: TemplateCategory) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function buildI18nValue(locale: Locale, setLocale: (l: Locale) => void): I18nContextValue {
  const messages = LOCALES[locale];
  return {
    locale,
    setLocale,
    t: messages,
    format,
    palettes: localizedPalettes(messages),
    fonts: localizedFonts(messages),
    templates: localizedTemplates(messages),
    categoryLabel: (id: TemplateCategory) => messages.themes.categories[id],
  };
}

export function useI18nMemo(locale: Locale, setLocale: (l: Locale) => void) {
  return useMemo(() => buildI18nValue(locale, setLocale), [locale, setLocale]);
}
