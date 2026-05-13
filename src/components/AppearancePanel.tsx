import { FONTS, FontId, PALETTES, PaletteId, ThemeMode } from '../utils/themes';

export interface AppearancePanelProps {
  palette: PaletteId;
  font: FontId;
  theme: ThemeMode;
  onPalette(id: PaletteId): void;
  onFont(id: FontId): void;
  onTheme(t: ThemeMode): void;
}

export default function AppearancePanel({
  palette,
  font,
  theme,
  onPalette,
  onFont,
  onTheme,
}: AppearancePanelProps) {
  return (
    <div className="appearance">
      <div className="appearance-row">
        <span className="appearance-label">配色</span>
        <div className="palette-grid">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              className={`palette-chip ${palette === p.id ? 'active' : ''}`}
              onClick={() => onPalette(p.id)}
              title={`${p.name} · ${p.desc}`}
              aria-label={p.name}
            >
              <span className="palette-chip-dot" style={{ background: p.swatch }} />
            </button>
          ))}
        </div>
      </div>

      <div className="appearance-row">
        <span className="appearance-label">字体</span>
        <div className="font-grid">
          {FONTS.map((f) => (
            <button
              key={f.id}
              data-font={f.id}
              className={`font-chip ${font === f.id ? 'active' : ''}`}
              onClick={() => onFont(f.id)}
            >
              <span className="font-chip-name">{f.name}</span>
              <span className="font-chip-desc">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="appearance-row">
        <span className="appearance-label">主题</span>
        <div className="theme-seg" role="tablist">
          <button
            className={theme === 'light' ? 'active' : ''}
            onClick={() => onTheme('light')}
            role="tab"
            aria-selected={theme === 'light'}
          >
            <SunIcon /> 浅色
          </button>
          <button
            className={theme === 'dark' ? 'active' : ''}
            onClick={() => onTheme('dark')}
            role="tab"
            aria-selected={theme === 'dark'}
          >
            <MoonIcon /> 深色
          </button>
        </div>
      </div>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
