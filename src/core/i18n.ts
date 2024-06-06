import { LocaleMessages, VueMessageType } from "vue-i18n";
import { createI18n } from "vue-i18n";

function loadLocaleMessages(): LocaleMessages {
  const locales = require.context("../locales", true, /[A-Za-z0-9-_,\s]+\.json$/i, "sync");

  const messages: LocaleMessages = {};
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i);
    if (matched && matched.length > 1) {
      const locale = matched[1];
      messages[locale] = locales(key).default || locales(key);
    }
  });

  return messages;
}

export default createI18n({
  legacy: false,
  globalInjection: true,
  locale: process.env.VUE_APP_I18N_LOCALE || "en",
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || "en",
  messages: loadLocaleMessages() as LocaleMessages<VueMessageType>,
  warnHtmlInMessage: "off"
});