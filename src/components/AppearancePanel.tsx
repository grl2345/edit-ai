import {
  FONTS,
  FontId,
  PALETTES,
  PaletteId,
  TEMPLATES,
  TemplateId,
  ThemeMode,
} from '../utils/themes';

export interface AppearancePanelProps {
  palette: PaletteId;
  font: FontId;
  theme: ThemeMode;
  template: TemplateId;
  onPalette(id: PaletteId): void;
  onFont(id: FontId): void;
  onTheme(t: ThemeMode): void;
  onTemplate(id: TemplateId): void;
}

export default function AppearancePanel({
  palette,
  font,
  theme,
  template,
  onPalette,
  onFont,
  onTheme,
  onTemplate,
}: AppearancePanelProps) {
  return (
    <div className="appearance">
      <div className="appearance-row">
        <span className="appearance-label">版式</span>
        <div className="template-grid">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className={`template-chip ${template === t.id ? 'active' : ''}`}
              onClick={() => onTemplate(t.id)}
              title={`${t.name} · ${t.desc}`}
            >
              <TemplateThumb id={t.id} />
              <span className="template-chip-name">{t.name}</span>
              <span className="template-chip-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

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

function TemplateThumb({ id }: { id: TemplateId }) {
  if (id === 'suijian') {
    return (
      <svg className="template-thumb" viewBox="0 0 80 48" aria-hidden>
        <line x1="14" y1="13" x2="46" y2="13" stroke="currentColor" strokeWidth="2" />
        <line x1="14" y1="22" x2="66" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="14" y1="28" x2="60" y2="28" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="14" y1="34" x2="64" y2="34" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      </svg>
    );
  }
  if (id === 'yuanbao') {
    return (
      <svg className="template-thumb" viewBox="0 0 80 48" aria-hidden>
        <line x1="10" y1="12" x2="70" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="28" y1="17" x2="52" y2="17" stroke="currentColor" strokeWidth="2.4" />
        <line x1="10" y1="22" x2="70" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="16" y1="30" x2="64" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1="16" y1="36" x2="58" y2="36" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      </svg>
    );
  }
  if (id === 'kapian') {
    return (
      <svg className="template-thumb" viewBox="0 0 80 48" aria-hidden>
        <rect x="10" y="10" width="3" height="10" fill="currentColor" rx="1" />
        <line x1="18" y1="13" x2="44" y2="13" stroke="currentColor" strokeWidth="2.2" />
        <rect x="10" y="26" width="60" height="14" rx="4" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <line x1="16" y1="32" x2="50" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
    );
  }
  if (id === 'moyin') {
    return (
      <svg className="template-thumb" viewBox="0 0 80 48" aria-hidden>
        <text x="40" y="14" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.7">❉ · ❉</text>
        <rect x="12" y="20" width="6" height="6" fill="currentColor" rx="0.5" />
        <line x1="22" y1="24" x2="48" y2="24" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="32" x2="68" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.4" strokeDasharray="2 2" />
        <line x1="12" y1="38" x2="60" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      </svg>
    );
  }
  return null;
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
