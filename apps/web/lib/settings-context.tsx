"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Settings } from "@/lib/types";
import { DEFAULT_FORGE_SETTINGS } from "@/lib/constants";

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_FORGE_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sbcalc-settings");
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...DEFAULT_FORGE_SETTINGS, ...parsedSettings });
      }
    } catch {
      // Silently fail and use default settings
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem("sbcalc-settings", JSON.stringify(settings));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
