import en from "./en";
import bn from "./bn";

const dictionaries = { en, bn };

export function createTranslator(lang = "en") {
  const dictionary = dictionaries[lang] || dictionaries.en;
  return (key, fallback = key) =>
    key.split(".").reduce((value, part) => value?.[part], dictionary) ?? fallback;
}

export { dictionaries };