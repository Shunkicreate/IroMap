import {
  i18nDefaultLocale,
  i18nMessages,
  type I18nLocale,
  type I18nMessageKey,
} from "@/i18n/messages";

const fallbackLocale: I18nLocale = "en";

const fillPlaceholders = (
  template: string,
  params: Record<string, number | string> | undefined
): string => {
  if (!params) {
    return template;
  }

  let output = template;
  for (const [key, value] of Object.entries(params)) {
    output = output.replaceAll(`{${key}}`, String(value));
  }
  return output;
};

export const t = (
  key: I18nMessageKey,
  params?: Record<string, number | string>,
  locale: I18nLocale = i18nDefaultLocale
): string => {
  const template = i18nMessages[locale][key] ?? i18nMessages[fallbackLocale][key];
  return fillPlaceholders(template, params);
};
