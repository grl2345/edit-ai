import { useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { FONT_SIZES, FontId, FontSizeId, PaletteId, TemplateId, ThemeMode, getSidebarTemplates } from '../utils/themes';
import { recommend, Recommendation } from '../utils/aiRecommend';
import TemplateThumb from './TemplateThumb';
import TemplateGallery from './TemplateGallery';

export interface AppearancePanelProps {
  palette: PaletteId;
  font: FontId;
  fontSize: FontSizeId;
  theme: ThemeMode;
  template: TemplateId;
  content?: string;
  onPalette(id: PaletteId): void;
  onFont(id: FontId): void;
  onFontSize(id: FontSizeId): void;
  onTheme(t: ThemeMode): void;
  onTemplate(id: TemplateId): void;
}

export default function AppearancePanel({
  palette,
  font,
  fontSize,
  theme,
  template,
  content,
  onPalette,
  onFont,
  onFontSize,
  onTheme,
  onTemplate,
}: AppearancePanelProps) {
  const { t, palettes, fonts, templates } = useI18n();
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const topThree = useMemo(() => {
    if (!recommendations) return null;
    return recommendations.slice(0, 3).filter((r) => r.score > 0);
  }, [recommendations]);

  const rankOf = (id: TemplateId): number | null => {
    if (!topThree) return null;
    const idx = topThree.findIndex((r) => r.templateId === id);
    return idx === -1 ? null : idx + 1;
  };

  const handleRecommend = () => {
    setRecommendations(recommend(content ?? ''));
  };

  const handleClear = () => setRecommendations(null);

  const sidebarTemplates = useMemo(
    () => getSidebarTemplates(template, templates),
    [template, templates]
  );

  const templateName = templates.find((item) => item.id === template)?.name ?? template;
  const paletteName = palettes.find((p) => p.id === palette)?.name ?? palette;
  const fontName = fonts.find((f) => f.id === font)?.name ?? font;
  const themeLabel =
    theme === 'light' ? t.appearance.themeLight : t.appearance.themeDark;

  const nameOf = (id: TemplateId) => templates.find((item) => item.id === id)?.name ?? id;

  return (
    <div className="appearance">
      <div className="appearance-summary" title={t.appearance.summaryTitle}>
        <span className="appearance-summary-item">
          <span className="appearance-summary-k">{t.appearance.labelTemplate}</span>
          <strong>{templateName}</strong>
        </span>
        <span className="appearance-summary-dot" aria-hidden>
          ·
        </span>
        <span className="appearance-summary-item">
          <span className="appearance-summary-k">{t.appearance.labelPalette}</span>
          <strong>{paletteName}</strong>
        </span>
        <span className="appearance-summary-dot" aria-hidden>
          ·
        </span>
        <span className="appearance-summary-item">
          <span className="appearance-summary-k">{t.appearance.labelFont}</span>
          <strong>{fontName}</strong>
        </span>
        <span className="appearance-summary-dot" aria-hidden>
          ·
        </span>
        <span className="appearance-summary-item">
          <span className="appearance-summary-k">{t.appearance.labelTheme}</span>
          <strong>{themeLabel}</strong>
        </span>
      </div>

      <div className="appearance-row">
        <div className="appearance-label-row">
          <span className="appearance-label">{t.appearance.templates}</span>
          <div className="appearance-label-actions">
            <button
              className="appearance-more-btn"
              onClick={() => setGalleryOpen(true)}
              title={t.appearance.viewAllTitle}
            >
              {t.appearance.viewAll}
            </button>
            {topThree ? (
              <button
                className="ai-recommend-btn active"
                onClick={handleClear}
                title={t.appearance.aiRecommendTitle}
              >
                <SparkleIcon />
                {t.appearance.aiRecommended}
              </button>
            ) : (
              <button
                className="ai-recommend-btn"
                onClick={handleRecommend}
                title={t.appearance.aiRecommendTitle}
              >
                <SparkleIcon />
                {t.appearance.aiRecommend}
              </button>
            )}
          </div>
        </div>
        {topThree && topThree.length > 0 && (
          <div className="ai-recommend-banner">
            {t.appearance.aiRecommendBanner}{' '}
            <strong>{nameOf(topThree[0].templateId)}</strong>
            {topThree[0].reasons.length > 0 && (
              <span className="ai-recommend-why"> · {topThree[0].reasons.join(' · ')}</span>
            )}
          </div>
        )}
        <div className="template-grid template-grid--sidebar">
          {sidebarTemplates.map((item) => {
            const rank = rankOf(item.id);
            return (
              <button
                key={item.id}
                className={`template-chip ${template === item.id ? 'active' : ''} ${rank ? 'recommended' : ''}`}
                onClick={() => onTemplate(item.id)}
                title={`${item.name} · ${item.desc}`}
                data-rank={rank ?? undefined}
              >
                {rank && <span className="template-chip-rank">AI #{rank}</span>}
                <TemplateThumb id={item.id} scope="sp" />
                <span className="template-chip-name">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="appearance-row">
        <span className="appearance-label">{t.appearance.palettes}</span>
        <div className="palette-grid">
          {palettes.map((p) => (
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
        <span className="appearance-label">{t.appearance.fonts}</span>
        <div className="font-grid">
          {fonts.map((f) => (
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
        <span className="appearance-label">{t.appearance.fontSize}</span>
        <div className="theme-seg" role="tablist">
          {FONT_SIZES.map((s) => (
            <button
              key={s.id}
              className={fontSize === s.id ? 'active' : ''}
              onClick={() => onFontSize(s.id)}
              role="tab"
              aria-selected={fontSize === s.id}
              title={`${s.name} · ${s.px}px`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="appearance-row">
        <span className="appearance-label">{t.appearance.theme}</span>
        <div className="theme-seg" role="tablist">
          <button
            className={theme === 'light' ? 'active' : ''}
            onClick={() => onTheme('light')}
            role="tab"
            aria-selected={theme === 'light'}
          >
            <SunIcon /> {t.appearance.themeLight}
          </button>
          <button
            className={theme === 'dark' ? 'active' : ''}
            onClick={() => onTheme('dark')}
            role="tab"
            aria-selected={theme === 'dark'}
          >
            <MoonIcon /> {t.appearance.themeDark}
          </button>
        </div>
      </div>

      <TemplateGallery
        open={galleryOpen}
        currentTemplate={template}
        recommendations={topThree ?? null}
        onSelect={(id) => {
          onTemplate(id);
          setGalleryOpen(false);
        }}
        onRecommend={handleRecommend}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zM19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6L16 17.5l2.1-.9L19 14z" />
    </svg>
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
