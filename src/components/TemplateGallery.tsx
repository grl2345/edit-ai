import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { TEMPLATE_CATEGORIES, TemplateCategory, TemplateId } from '../utils/themes';
import { Recommendation } from '../utils/aiRecommend';
import TemplateThumb from './TemplateThumb';

export interface TemplateGalleryProps {
  open: boolean;
  currentTemplate: TemplateId;
  recommendations: Recommendation[] | null;
  onSelect(id: TemplateId): void;
  onRecommend(): void;
  onClose(): void;
}

type Filter = 'all' | TemplateCategory;

export default function TemplateGallery({
  open,
  currentTemplate,
  recommendations,
  onSelect,
  onRecommend,
  onClose,
}: TemplateGalleryProps) {
  const { t, templates, categoryLabel } = useI18n();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const recRank = useMemo(() => {
    const m = new Map<TemplateId, number>();
    recommendations?.forEach((r, i) => {
      if (r.score > 0 && i < 3) m.set(r.templateId, i + 1);
    });
    return m;
  }, [recommendations]);

  const list = useMemo(() => {
    if (filter === 'all') return templates;
    return templates.filter((item) => item.category === filter);
  }, [filter, templates]);

  if (!open) return null;

  return (
    <div className="gallery-overlay" onClick={onClose}>
      <div
        className="gallery-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t.gallery.ariaLabel}
      >
        <div className="gallery-head">
          <div className="gallery-head-text">
            <h3>{t.gallery.title}</h3>
            <p>{t.gallery.subtitle}</p>
          </div>
          <div className="gallery-head-actions">
            <button
              className="ai-recommend-btn"
              onClick={onRecommend}
              title={t.gallery.aiRecommendTitle}
            >
              <SparkleIcon /> {t.appearance.aiRecommend}
            </button>
            <button className="ai-dialog-close" onClick={onClose} aria-label={t.gallery.close}>
              ✕
            </button>
          </div>
        </div>

        <div className="gallery-filter" role="tablist">
          <button
            role="tab"
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            {t.gallery.all}{' '}
            <span className="gallery-filter-num">{templates.length}</span>
          </button>
          {TEMPLATE_CATEGORIES.map((c) => {
            const count = templates.filter((item) => item.category === c).length;
            return (
              <button
                key={c}
                role="tab"
                className={filter === c ? 'active' : ''}
                onClick={() => setFilter(c)}
              >
                {categoryLabel(c)}{' '}
                <span className="gallery-filter-num">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="gallery-grid">
          {list.map((item) => {
            const isActive = item.id === currentTemplate;
            const rank = recRank.get(item.id);
            return (
              <button
                key={item.id}
                className={`gallery-card ${isActive ? 'active' : ''} ${rank ? 'recommended' : ''}`}
                onClick={() => onSelect(item.id)}
                data-rank={rank ?? undefined}
                title={`${item.name} · ${item.desc}`}
              >
                {rank && <span className="gallery-card-rank">AI #{rank}</span>}
                {isActive && <span className="gallery-card-current">{t.gallery.inUse}</span>}
                <div className="gallery-card-thumb">
                  <TemplateThumb id={item.id} scope={`gl-${item.id}`} />
                </div>
                <div className="gallery-card-meta">
                  <div className="gallery-card-name">{item.name}</div>
                  <div className="gallery-card-cat">{categoryLabel(item.category)}</div>
                </div>
                <div className="gallery-card-desc">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
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
