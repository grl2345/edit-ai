import { useEffect, useMemo, useState } from 'react';
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  TemplateCategory,
  TemplateId,
} from '../utils/themes';
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

/**
 * 版式画廊：大图分类预览。
 * - 顶部分类筛选 + AI 推荐快捷
 * - 卡片大缩略图 + 名称 + 描述
 * - 当前版式 / AI 推荐 Top 3 在卡片上做标记
 */
export default function TemplateGallery({
  open,
  currentTemplate,
  recommendations,
  onSelect,
  onRecommend,
  onClose,
}: TemplateGalleryProps) {
  const [filter, setFilter] = useState<Filter>('all');

  // ESC 关闭
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
    if (filter === 'all') return TEMPLATES;
    return TEMPLATES.filter((t) => t.category === filter);
  }, [filter]);

  if (!open) return null;

  return (
    <div className="gallery-overlay" onClick={onClose}>
      <div
        className="gallery-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="版式画廊"
      >
        <div className="gallery-head">
          <div className="gallery-head-text">
            <h3>版式画廊</h3>
            <p>14 套版式 · 按风格分类 · 点击应用到当前文档</p>
          </div>
          <div className="gallery-head-actions">
            <button
              className="ai-recommend-btn"
              onClick={onRecommend}
              title="按当前正文内容推荐最合适的 3 套"
            >
              <SparkleIcon /> AI 推荐
            </button>
            <button className="ai-dialog-close" onClick={onClose} aria-label="关闭">
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
            全部 <span className="gallery-filter-num">{TEMPLATES.length}</span>
          </button>
          {TEMPLATE_CATEGORIES.map((c) => {
            const count = TEMPLATES.filter((t) => t.category === c).length;
            return (
              <button
                key={c}
                role="tab"
                className={filter === c ? 'active' : ''}
                onClick={() => setFilter(c)}
              >
                {c} <span className="gallery-filter-num">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="gallery-grid">
          {list.map((t) => {
            const isActive = t.id === currentTemplate;
            const rank = recRank.get(t.id);
            return (
              <button
                key={t.id}
                className={`gallery-card ${isActive ? 'active' : ''} ${rank ? 'recommended' : ''}`}
                onClick={() => onSelect(t.id)}
                data-rank={rank ?? undefined}
                title={`${t.name} · ${t.desc}`}
              >
                {rank && <span className="gallery-card-rank">AI #{rank}</span>}
                {isActive && <span className="gallery-card-current">使用中</span>}
                <div className="gallery-card-thumb">
                  <TemplateThumb id={t.id} scope={`gl-${t.id}`} />
                </div>
                <div className="gallery-card-meta">
                  <div className="gallery-card-name">{t.name}</div>
                  <div className="gallery-card-cat">{t.category}</div>
                </div>
                <div className="gallery-card-desc">{t.desc}</div>
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
