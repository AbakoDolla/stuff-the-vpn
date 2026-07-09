'use client';
import { useState, useEffect } from 'react';
import { getLang, setLang, t, type Lang } from '@/lib/i18n';

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    setLangState(getLang());
    const handler = (e: Event) => {
      setLangState((e as CustomEvent<Lang>).detail);
    };
    window.addEventListener('lang-change', handler);
    return () => window.removeEventListener('lang-change', handler);
  }, []);

  function toggleLang() {
    const next: Lang = lang === 'fr' ? 'en' : 'fr';
    setLang(next);
    setLangState(next);
  }

  return { lang, toggleLang, tr: t[lang] };
}
