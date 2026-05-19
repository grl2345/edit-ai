import { useMemo, useState } from 'react';
import {
  FONTS,
  FontId,
  PALETTES,
  PaletteId,
  TEMPLATES,
  TemplateId,
  ThemeMode,
} from '../utils/themes';
import { recommend, Recommendation } from '../utils/aiRecommend';
import TemplateThumb from './TemplateThumb';
import TemplateGallery from './TemplateGallery';

export interface AppearancePanelProps {
  palette: PaletteId;
  font: FontId;
  theme: ThemeMode;
  template: TemplateId;
  /** 当前文档 markdown，用于 AI 推荐版式选型 */
  content?: string;
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
  content,
  onPalette,
  onFont,
  onTheme,
  onTemplate,
}: AppearancePanelProps) {
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
    const result = recommend(content ?? '');
    setRecommendations(result);
  };

  const handleClear = () => setRecommendations(null);

  return (
    <div className="appearance">
      <div className="appearance-row">
        <div className="appearance-label-row">
          <span className="appearance-label">版式</span>
          <div className="appearance-label-actions">
            <button
              className="appearance-more-btn"
              onClick={() => setGalleryOpen(true)}
              title="查看全部 14 套版式 · 大图分类预览"
            >
              查看全部 →
            </button>
            {topThree ? (
              <button className="ai-recommend-btn active" onClick={handleClear} title="清除推荐标记">
                <SparkleIcon />
                已推荐
              </button>
            ) : (
              <button className="ai-recommend-btn" onClick={handleRecommend} title="按当前正文内容推荐最合适的 3 套版式">
                <SparkleIcon />
                AI 推荐
              </button>
            )}
          </div>
        </div>
        {topThree && topThree.length > 0 && (
          <div className="ai-recommend-banner">
            建议 <strong>{nameOf(topThree[0].templateId)}</strong>
            {topThree[0].reasons.length > 0 && (
              <span className="ai-recommend-why"> · {topThree[0].reasons.join(' · ')}</span>
            )}
          </div>
        )}
        <div className="template-grid">
          {TEMPLATES.map((t) => {
            const rank = rankOf(t.id);
            return (
              <button
                key={t.id}
                className={`template-chip ${template === t.id ? 'active' : ''} ${rank ? 'recommended' : ''}`}
                onClick={() => onTemplate(t.id)}
                title={`${t.name} · ${t.desc}`}
                data-rank={rank ?? undefined}
              >
                {rank && <span className="template-chip-rank">AI #{rank}</span>}
                <TemplateThumb id={t.id} scope="sp" />
                <span className="template-chip-name">{t.name}</span>
                <span className="template-chip-desc">{t.desc}</span>
              </button>
            );
          })}
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

function nameOf(id: TemplateId): string {
  return TEMPLATES.find((t) => t.id === id)?.name ?? id;
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
