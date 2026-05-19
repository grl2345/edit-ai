import { TemplateId } from '../utils/themes';

/**
 * 版式缩略图：缩小版的版式骨架，靠 currentColor + accent 双色描绘。
 *
 * scope 用来给 <defs> 内的 id 加唯一前缀，避免同页面里多处复用（侧栏 + 画廊）时
 * 出现重复 id 导致只渲染一处。
 */
export default function TemplateThumb({
  id,
  scope = 'tt',
}: {
  id: TemplateId;
  scope?: string;
}) {
  const sid = (k: string) => `${scope}-${k}`;
  switch (id) {
    case 'qingye':
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <defs>
            <pattern id={sid('qy-dots')} width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.6" fill="currentColor" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="80" height="56" fill={`url(#${sid('qy-dots')})`} />
          <rect x="8" y="8" width="34" height="5" rx="1" fill="var(--accent)" />
          <rect x="8" y="20" width="26" height="3" fill="var(--accent)" />
          <rect x="8" y="24" width="30" height="1" fill="var(--accent)" />
          <rect x="8" y="32" width="56" height="14" rx="3" fill="var(--accent)" opacity="0.14" />
          <text x="12" y="42" fontSize="9" fill="var(--accent)" fontFamily="Georgia">"</text>
          <rect x="22" y="40" width="32" height="1.5" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'haibao':
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
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <defs>
            <pattern id={sid('gs-grid')} width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="80" height="56" fill={`url(#${sid('gs-grid')})`} />
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
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <defs>
            <linearGradient id={sid('jg-grad')} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={sid('jg-bar')} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <rect x="6" y="8" width="4" height="14" fill={`url(#${sid('jg-bar')})`} />
          <rect x="6" y="8" width="56" height="14" fill={`url(#${sid('jg-grad')})`} opacity="0.18" />
          <rect x="14" y="11" width="30" height="3.4" fill="currentColor" />
          <rect x="14" y="16" width="22" height="2" fill="currentColor" opacity="0.5" />
          <rect x="8" y="30" width="30" height="3" fill="currentColor" />
          <rect x="8" y="35" width="48" height="2" fill={`url(#${sid('jg-grad')})`} />
          <rect x="8" y="42" width="56" height="1.5" fill={`url(#${sid('jg-grad')})`} />
          <rect x="8" y="48" width="40" height="1" fill="currentColor" opacity="0.35" />
        </svg>
      );
    case 'zhangye':
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
    case 'juanshou':
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <rect x="8" y="6" width="14" height="2.4" fill="var(--accent)" />
          <rect x="8" y="11" width="44" height="3" fill="currentColor" />
          <text x="8" y="24" fontSize="5" fill="var(--accent)" fontFamily="Georgia" fontStyle="italic" fontWeight="700">I.</text>
          <line x1="8" y1="22" x2="72" y2="22" stroke="currentColor" strokeWidth="0.5" />
          <rect x="16" y="22" width="24" height="2.4" fill="currentColor" />
          <line x1="14" y1="32" x2="66" y2="32" stroke="currentColor" strokeWidth="0.5" />
          <text x="40" y="40" fontSize="6" fill="var(--accent)" textAnchor="middle" fontFamily="Georgia">"</text>
          <line x1="14" y1="44" x2="66" y2="44" stroke="currentColor" strokeWidth="0.5" />
          <rect x="14" y="48" width="44" height="1" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case 'jiekan':
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <rect x="8" y="6" width="22" height="4" fill="var(--accent)" />
          <text x="9" y="9.5" fontSize="3" fill="white" fontFamily="monospace" fontWeight="700" letterSpacing="0.4">COVER</text>
          <rect x="8" y="13" width="50" height="5.5" fill="currentColor" />
          <rect x="8" y="28" width="13" height="5" fill="currentColor" />
          <text x="9" y="32" fontSize="3" fill="white" fontFamily="monospace" fontWeight="700">№ 01</text>
          <rect x="24" y="28" width="34" height="5" fill="currentColor" opacity="0.8" />
          <rect x="8" y="35" width="64" height="1.6" fill="currentColor" />
          <rect x="8" y="42" width="56" height="1.2" fill="currentColor" opacity="0.4" />
          <rect x="8" y="46" width="48" height="1.2" fill="currentColor" opacity="0.4" />
          <rect x="8" y="50" width="64" height="2.5" fill="currentColor" />
          <rect x="37" y="49" width="6" height="4.5" fill="var(--accent)" />
        </svg>
      );
    case 'hongbang':
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <text x="6" y="22" fontSize="18" fontWeight="900" fill="var(--accent)" letterSpacing="-1.5" fontFamily="PingFang SC,sans-serif">01</text>
          <rect x="6" y="26" width="40" height="3.4" fill="currentColor" />
          <rect x="6" y="33" width="22" height="6" rx="3" fill="currentColor" />
          <text x="9" y="37.5" fontSize="3.5" fill="white" fontWeight="700" fontFamily="PingFang SC,sans-serif">三大核心：</text>
          <circle cx="9" cy="44" r="1.2" fill="currentColor" />
          <rect x="14" y="42.5" width="20" height="2" fill="currentColor" />
          <rect x="14" y="46.5" width="48" height="1" fill="currentColor" opacity="0.4" />
          <circle cx="9" cy="52" r="1.2" fill="currentColor" />
          <rect x="14" y="50.5" width="18" height="2" fill="currentColor" />
        </svg>
      );
    case 'yuebao':
      return (
        <svg className="template-thumb" viewBox="0 0 80 56" aria-hidden>
          <text x="8" y="9" fontSize="2.5" fill="var(--accent)" fontFamily="monospace" fontWeight="700" letterSpacing="1">MONTHLY REPORT</text>
          <line x1="8" y1="11" x2="72" y2="11" stroke="currentColor" strokeWidth="0.6" />
          <rect x="8" y="13" width="44" height="3.5" fill="currentColor" />
          <line x1="8" y1="19" x2="72" y2="19" stroke="currentColor" strokeWidth="0.6" />
          <line x1="8" y1="20.5" x2="72" y2="20.5" stroke="currentColor" strokeWidth="0.6" />
          <text x="8" y="32" fontSize="7" fill="var(--accent)" fontFamily="monospace" fontWeight="800">01</text>
          <rect x="20" y="28" width="32" height="2.5" fill="currentColor" />
          <line x1="20" y1="34" x2="72" y2="34" stroke="currentColor" strokeWidth="0.5" />
          <rect x="20" y="38" width="14" height="1.5" fill="var(--accent)" />
          <rect x="44" y="38" width="6" height="1.5" fill="currentColor" opacity="0.5" />
          <rect x="56" y="38" width="10" height="1.5" fill="currentColor" opacity="0.5" />
          <line x1="20" y1="42" x2="72" y2="42" stroke="currentColor" strokeWidth="0.3" />
          <rect x="20" y="45" width="14" height="1.5" fill="currentColor" opacity="0.4" />
          <rect x="44" y="45" width="6" height="1.5" fill="currentColor" opacity="0.4" />
          <rect x="56" y="45" width="10" height="1.5" fill="currentColor" opacity="0.4" />
        </svg>
      );
  }
}
