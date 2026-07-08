import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { translate, type Language } from './translations';

const STORAGE_KEY = '@app_language';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key) => key,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const lang: Language = (stored as Language) || 'en';
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(lang === 'ar');
      setLang(lang);
    }).catch(() => {});
  }, []);

  const setLanguage = async (lang: Language) => {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(lang === 'ar');
    setLang(lang);
  };

  const t = (key: string, params?: Record<string, string | number>) =>
    translate(language, key, params);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
