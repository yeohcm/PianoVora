import { useAppStore } from '../../store/appStore';
import { THEME_DEFINITIONS } from './ThemeProvider';
import type { NeonTheme } from '../../store/uiSlice';

const SWATCH: Record<NeonTheme, string> = {
  cyber:   '#00f3ff',
  aurora:  '#39ff14',
  sunset:  '#ff6b35',
  rainbow: 'linear-gradient(135deg,#ff0000,#ff8800,#ffff00,#00ff00,#0088ff,#8800ff)',
};

export function ThemeSelector() {
  const theme    = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <div
      role="group"
      aria-label="Colour theme"
      data-testid="theme-selector"
      className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-row sm:gap-1.5 sm:w-auto items-center"
    >
      {(['cyber', 'aurora', 'sunset', 'rainbow'] as NeonTheme[]).map((t) => {
        const accent   = THEME_DEFINITIONS[t]['--neon-accent'];
        const isActive = theme === t;
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            aria-pressed={isActive}
            data-testid={`theme-btn-${t}`}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer border-2 flex-1 sm:flex-initial"
            style={{
              borderColor: isActive ? accent : 'rgba(255,255,255,0.18)',
              background: isActive ? `color-mix(in srgb, ${accent} 18%, transparent)` : 'rgba(255,255,255,0.06)',
              color:          '#fff',
              fontWeight:     isActive ? 700 : 400,
              whiteSpace:     'nowrap',
            }}
          >
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                background:   SWATCH[t],
              }}
            />
            {THEME_DEFINITIONS[t].label}
          </button>
        );
      })}
    </div>
  );
}
