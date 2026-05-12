import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme } from "./themes";
import { translations } from "./translations";

const AppSettingsContext = createContext(null);
const SETTINGS_KEY = "app_settings";

export function AppSettingsProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState("Light");
  const [language, setLanguageState] = useState("English");
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (!raw) return;
        const prefs = JSON.parse(raw);
        setThemeModeState(prefs.themeMode || "Light");
        setLanguageState(prefs.language || "English");
        setNotificationsEnabledState(
          typeof prefs.notificationsEnabled === "boolean" ? prefs.notificationsEnabled : true
        );
      })
      .catch(() => {});
  }, []);

  const persist = async (next) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch (err) {
      console.log(err);
    }
  };

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    persist({ themeMode: mode, language, notificationsEnabled });
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
    persist({ themeMode, language: lang, notificationsEnabled });
  };

  const setNotificationsEnabled = (value) => {
    setNotificationsEnabledState(value);
    persist({ themeMode, language, notificationsEnabled: value });
  };

  const resolvedMode = themeMode === "Auto"
    ? (systemScheme === "dark" ? "Dark" : "Light")
    : themeMode;

  const theme = resolvedMode === "Dark" ? darkTheme : lightTheme;
  const isDark = resolvedMode === "Dark";

  const t = useMemo(() => {
    const table = translations[language] || translations.English;
    return (key) => table[key] || translations.English[key] || key;
  }, [language]);

  const value = {
    theme,
    isDark,
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    t,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return ctx;
}
