import { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { NeonTheme } from '../../store/uiSlice';

interface ThemeDefinition {
  id:                NeonTheme;
  label:             string;
  '--neon-white-key': string;
  '--neon-black-key': string;
  '--glow-colour':   string;
  '--neon-accent':   string;
}

export const THEME_DEFINITIONS: Record<NeonTheme, ThemeDefinition> = {
  cyber: {
    id: 'cyber', label: 'Cyber',
    '--neon-white-key': '#00f3ff',
    '--neon-black-key': '#b300ff',
    '--glow-colour':    '#00f3ff',
    '--neon-accent':    '#00f3ff',
  },
  aurora: {
    id: 'aurora', label: 'Aurora',
    '--neon-white-key': '#39ff14',
    '--neon-black-key': '#00e5ff',
    '--glow-colour':    '#39ff14',
    '--neon-accent':    '#39ff14',
  },
  sunset: {
    id: 'sunset', label: 'Sunset',
    '--neon-white-key': '#ff6b35',
    '--neon-black-key': '#ff2d78',
    '--glow-colour':    '#ff6b35',
    '--neon-accent':    '#ff6b35',
  },
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const def = THEME_DEFINITIONS[theme];
    const root = document.documentElement;
    root.style.setProperty('--neon-white-key', def['--neon-white-key']);
    root.style.setProperty('--neon-black-key', def['--neon-black-key']);
    root.style.setProperty('--glow-colour',    def['--glow-colour']);
    root.style.setProperty('--neon-accent',    def['--neon-accent']);
  }, [theme]);

  return <>{children}</>;
}
