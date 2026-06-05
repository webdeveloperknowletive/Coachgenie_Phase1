import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "../locales/en/common.json";
import hiCommon from "../locales/hi/common.json";
import mrCommon from "../locales/mr/common.json";

export const defaultNS = "common";
export const resources = {
  en: { common: enCommon },
  hi: { common: hiCommon },
  mr: { common: mrCommon },
} as const;

void i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  defaultNS,
  resources,
  interpolation: { escapeValue: false },
});

export default i18n;
export * from "react-i18next";