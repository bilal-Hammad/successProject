import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
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
      setLang(lang);
    }).catch(() => {});
  }, []);

  const setLanguage = async (lang: Language) => {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
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
