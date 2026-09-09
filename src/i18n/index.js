import en from "./en.js";
import bn from "./bn.js";

const dictionaries = { en, bn };

export function createTranslator(lang = "en") {
  const dictionary = dictionaries[lang] || dictionaries.en;
  return (key, fallback = key) =>
    key.split(".").reduce((value, part) => value?.[part], dictionary) ?? fallback;
}

export { dictionaries };