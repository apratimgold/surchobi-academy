import React, { createContext, useContext, useMemo, useState } from "react";
import { createTranslator } from "./index";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("surchobi_language") || "en");

  const value = useMemo(() => ({
    lang,
    setLang: (nextLang) => {
      const safeLang = nextLang === "bn" ? "bn" : "en";
      localStorage.setItem("surchobi_language", safeLang);
      setLang(safeLang);
    },
    toggleLanguage: () => {
      const nextLang = lang === "en" ? "bn" : "en";
      localStorage.setItem("surchobi_language", nextLang);
      setLang(nextLang);
    },
    t: createTranslator(lang),
  }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used inside LanguageProvider");
  return context;
}
