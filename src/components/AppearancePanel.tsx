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

/**
 * 缩略图：缩小版的版式骨架，靠 currentColor + accent 双色描绘。
 * 视觉策略：每张图用最少线条体现 h1 / h2 / 正文 / 装饰，让用户在 grid 里就能扫到差异。
 */
function TemplateThumb({ id }: { id: TemplateId }) {
  switch (id) {
    case 'qingye':
      // 点阵底纹 + 粗 accent h1 + h2 厚下划线 + 引用卡
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <defs>
            <pattern id="qy-dots" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.6" fill="currentColor" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="80" height="56" fill="url(#qy-dots)" />
          <rect x="8" y="8" width="34" height="5" rx="1" fill="var(--accent)" />
          <rect x="8" y="20" width="26" height="3" fill="var(--accent)" />
          <rect x="8" y="24" width="30" height="1" fill="var(--accent)" />
          <rect x="8" y="32" width="56" height="14" rx="3" fill="var(--accent)" opacity="0.14" />
          <text x="12" y="42" fontSize="9" fill="var(--accent)" fontFamily="Georgia">"</text>
          <rect x="22" y="40" width="32" height="1.5" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'haibao':
      // h1 反白 hero 块 + h2 厚下划线
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <rect x="0" y="6" width="80" height="16" fill="var(--accent)" />
          <rect x="6" y="11" width="34" height="3.4" fill="white" />
          <rect x="6" y="16" width="22" height="2" fill="white" opacity="0.55" />
          <rect x="6" y="30" width="22" height="3.5" fill="currentColor" />
          <rect x="6" y="34" width="22" height="2.5" fill="var(--accent)" />
          <rect x="6" y="42" width="48" height="1" fill="currentColor" opacity="0.4" />
          <rect x="6" y="46" width="40" height="1" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'ningmeng':
      // h2 实心高亮笔块
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <rect x="8" y="8" width="32" height="3.6" fill="currentColor" />
          <rect x="8" y="14" width="14" height="3" fill="var(--accent)" />
          <rect x="8" y="24" width="32" height="11" fill="var(--accent)" />
          <text x="11" y="32" fontSize="6.5" fill="white" fontWeight="700">二级标题</text>
          <rect x="8" y="40" width="56" height="1" fill="currentColor" opacity="0.4" />
          <rect x="8" y="45" width="50" height="1" fill="currentColor" opacity="0.4" />
          <rect x="8" y="50" width="36" height="1" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'chongying':
      // 偏移阴影贴纸 chip
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <rect x="11" y="11" width="32" height="10" fill="var(--accent)" />
          <rect x="8" y="8" width="32" height="10" fill="white" stroke="currentColor" strokeWidth="1.4" />
          <rect x="11" y="11" width="24" height="2.5" fill="currentColor" />
          <rect x="32" y="32" width="28" height="9" fill="var(--accent)" />
          <rect x="29" y="29" width="28" height="9" fill="white" stroke="var(--accent)" strokeWidth="1.4" />
          <rect x="33" y="32" width="20" height="2.5" fill="currentColor" />
          <rect x="8" y="46" width="56" height="1" fill="currentColor" opacity="0.4" />
          <rect x="8" y="50" width="40" height="1" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'huabao':
      // 居中标题 + 全大写上下线 h2 + 首字下沉
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <rect x="32" y="6" width="16" height="0.8" fill="var(--accent)" />
          <rect x="22" y="10" width="36" height="4" fill="currentColor" />
          <line x1="14" y1="22" x2="66" y2="22" stroke="currentColor" strokeWidth="0.8" />
          <text x="40" y="27" fontSize="3.5" fill="currentColor" textAnchor="middle" letterSpacing="2">SECTION</text>
          <line x1="14" y1="30" x2="66" y2="30" stroke="currentColor" strokeWidth="0.8" />
          <text x="10" y="44" fontSize="10" fill="var(--accent)" fontFamily="Georgia" fontWeight="700">A</text>
          <rect x="22" y="36" width="42" height="1.4" fill="currentColor" opacity="0.45" />
          <rect x="22" y="40" width="42" height="1.4" fill="currentColor" opacity="0.45" />
          <rect x="22" y="44" width="32" height="1.4" fill="currentColor" opacity="0.45" />
        </svg>
      );
    case 'yinzhang':
      // h1 朱印 + h2 方印前缀
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <rect x="8" y="9" width="34" height="4" fill="currentColor" />
          <g transform="rotate(-3 64 12)">
            <rect x="58" y="6" width="13" height="13" fill="var(--accent)" />
            <rect x="60.5" y="8.5" width="8" height="8" fill="none" stroke="white" strokeWidth="1" />
          </g>
          <g transform="rotate(-2 12 32)">
            <rect x="8" y="28" width="6" height="6" fill="var(--accent)" />
            <rect x="9.5" y="29.5" width="3" height="3" fill="none" stroke="white" strokeWidth="0.7" />
          </g>
          <rect x="18" y="29" width="30" height="3.4" fill="currentColor" />
          <line x1="8" y1="38" x2="64" y2="38" stroke="currentColor" strokeWidth="0.7" />
          <rect x="8" y="44" width="40" height="1.2" fill="currentColor" opacity="0.4" />
          <rect x="8" y="48" width="32" height="1.2" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'geshan':
      // 点网格 + [ h2 ] mono
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <defs>
            <pattern id="gs-grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="80" height="56" fill="url(#gs-grid)" />
          <text x="8" y="14" fontSize="6.5" fontFamily="monospace" fill="currentColor" fontWeight="700">
            <tspan fill="var(--accent)"># </tspan>Title
          </text>
          <rect x="8" y="22" width="36" height="8" fill="none" stroke="var(--accent)" strokeWidth="0.7" strokeDasharray="2 1.5" />
          <text x="11" y="28" fontSize="5" fontFamily="monospace" fill="currentColor">
            <tspan fill="var(--accent)" fontWeight="700">[</tspan> 模块 <tspan fill="var(--accent)" fontWeight="700">]</tspan>
          </text>
          <text x="8" y="40" fontSize="4.5" fontFamily="monospace" fill="currentColor">
            <tspan fill="var(--accent)">01.</tspan> 列表项
          </text>
          <text x="8" y="48" fontSize="4.5" fontFamily="monospace" fill="currentColor">
            <tspan fill="var(--accent)">02.</tspan> 列表项
          </text>
        </svg>
      );
    case 'shouzha':
      // 波浪 underline + 手写感
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <text x="8" y="14" fontSize="9" fill="currentColor" fontFamily="STKaiti" fontWeight="700">标题</text>
          <path d="M8 17 Q12 14 16 17 T24 17 T32 17 T40 17" stroke="var(--accent)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <text x="8" y="32" fontSize="7" fill="currentColor" fontFamily="STKaiti" fontWeight="700">二级标题</text>
          <path d="M8 35 Q12 32 16 35 T24 35 T32 35 T40 35" stroke="var(--accent)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <text x="8" y="46" fontSize="3.5" fill="var(--accent)" fontFamily="STKaiti">✎ 子标题</text>
          <line x1="50" y1="22" x2="52" y2="50" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 2" />
          <rect x="54" y="22" width="20" height="1" fill="currentColor" opacity="0.4" />
          <rect x="54" y="28" width="22" height="1" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'jiguang':
      // 渐变 underline + 左 accent 渐变粗条
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <defs>
            <linearGradient id="jg-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="jg-bar" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <rect x="6" y="8" width="4" height="14" fill="url(#jg-bar)" />
          <rect x="6" y="8" width="56" height="14" fill="url(#jg-grad)" opacity="0.18" />
          <rect x="14" y="11" width="30" height="3.4" fill="currentColor" />
          <rect x="14" y="16" width="22" height="2" fill="currentColor" opacity="0.5" />
          <rect x="8" y="30" width="30" height="3" fill="currentColor" />
          <rect x="8" y="35" width="48" height="2" fill="url(#jg-grad)" />
          <rect x="8" y="42" width="56" height="1.5" fill="url(#jg-grad)" />
          <rect x="8" y="48" width="40" height="1" fill="currentColor" opacity="0.35" />
        </svg>
      );
    case 'zhangye':
      // 居中罗马数字 + 双线 + 章末饰
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <text x="40" y="9" fontSize="3.5" fill="var(--accent)" textAnchor="middle" letterSpacing="2" fontFamily="Georgia" fontWeight="700">CHAPTER</text>
          <line x1="14" y1="13" x2="66" y2="13" stroke="currentColor" strokeWidth="0.6" />
          <text x="40" y="20" fontSize="6.5" fill="currentColor" textAnchor="middle" letterSpacing="1.5">标题</text>
          <line x1="14" y1="24" x2="66" y2="24" stroke="currentColor" strokeWidth="0.6" />
          <text x="40" y="33" fontSize="7" fill="var(--accent)" textAnchor="middle" fontFamily="Georgia" fontStyle="italic">Ⅰ</text>
          <line x1="36" y1="36" x2="44" y2="36" stroke="currentColor" strokeWidth="0.6" />
          <rect x="14" y="42" width="52" height="1.2" fill="currentColor" opacity="0.4" />
          <rect x="14" y="46" width="46" height="1.2" fill="currentColor" opacity="0.4" />
          <text x="40" y="53" fontSize="3" fill="var(--accent)" textAnchor="middle">❦</text>
        </svg>
      );
  }
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
