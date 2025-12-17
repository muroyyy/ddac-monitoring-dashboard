import { useState, useEffect, useCallback } from 'react';
import { MonitoringSettings, DEFAULT_SETTINGS } from '@/types/settings';

const STORAGE_KEY = 'monitoring_settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<MonitoringSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage (simulates GET /api/settings)
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings to localStorage (simulates POST /api/settings)
  const saveSettings = useCallback(async (newSettings: MonitoringSettings) => {
    setIsSaving(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedSettings = {
        ...newSettings,
        updatedAt: new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      return { success: true };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateSettings = useCallback((partial: Partial<MonitoringSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  return {
    settings,
    isLoading,
    isSaving,
    saveSettings,
    updateSettings,
  };
};
