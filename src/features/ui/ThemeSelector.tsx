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
      style={{ display: 'flex', gap: 6, alignItems: 'center' }}
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
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            6,
              padding:        '6px 12px',
              borderRadius:   6,
              border:         isActive ? `2px solid ${accent}` : '2px solid rgba(255,255,255,0.18)',
              background:     isActive ? `color-mix(in srgb, ${accent} 18%, transparent)` : 'rgba(255,255,255,0.06)',
              color:          '#fff',
              cursor:         'pointer',
              fontWeight:     isActive ? 700 : 400,
              fontSize:       13,
              whiteSpace:     'nowrap',
              transition:     'border-color 0.15s, background 0.15s',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display:      'inline-block',
                width:        11,
                height:       11,
                borderRadius: '50%',
                background:   SWATCH[t],
                flexShrink:   0,
              }}
            />
            {THEME_DEFINITIONS[t].label}
          </button>
        );
      })}
    </div>
  );
}
