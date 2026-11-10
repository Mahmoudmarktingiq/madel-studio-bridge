import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingsStore = defineStore("settings", () => {
  const theme = ref<"dark" | "light">("dark");
  const refreshIntervalMs = ref<number>(5000);
  const launchAtLogin = ref<boolean>(false);
  const language = ref<"en" | "ar">("en");
  const autoMinimizeToTray = ref<boolean>(true);

  function toggleTheme(): void {
    theme.value = theme.value === "dark" ? "light" : "dark";
    applyTheme();
  }

  function setTheme(t: "dark" | "light"): void {
    theme.value = t;
    applyTheme();
  }

  function applyTheme(): void {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme.value);
      if (theme.value === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
    }
  }

  function setLanguage(lang: "en" | "ar"): void {
    language.value = lang;
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);
      document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    }
  }

  return {
    theme,
    refreshIntervalMs,
    launchAtLogin,
    language,
    autoMinimizeToTray,
    toggleTheme,
    setTheme,
    applyTheme,
    setLanguage,
  };
});
