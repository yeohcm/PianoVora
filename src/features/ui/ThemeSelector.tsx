import { useAppStore } from '../../store/appStore';
import { THEME_DEFINITIONS } from './ThemeProvider';
import type { NeonTheme } from '../../store/uiSlice';

export function ThemeSelector() {
  const theme    = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <div
      role="group"
      aria-label="Colour theme"
      data-testid="theme-selector"
      className="flex gap-2"
    >
      {(['cyber', 'aurora', 'sunset', 'rainbow'] as NeonTheme[]).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          aria-pressed={theme === t}
          data-testid={`theme-btn-${t}`}
          className={theme === t ? 'active-theme-btn' : 'inactive-theme-btn'}
        >
          {THEME_DEFINITIONS[t].label}
        </button>
      ))}
    </div>
  );
}
