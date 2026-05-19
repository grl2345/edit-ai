export type PaletteId = 'chushaa' | 'qingmo' | 'mohei' | 'molan' | 'liyuan';
export type FontId = 'wenkai' | 'songti' | 'kaiti' | 'heiti';
export type ThemeMode = 'light' | 'dark';
export type TemplateId =
  | 'qingye'
  | 'haibao'
  | 'ningmeng'
  | 'chongying'
  | 'huabao'
  | 'yinzhang'
  | 'geshan'
  | 'shouzha'
  | 'jiguang'
  | 'zhangye'
  | 'juanshou'
  | 'jiekan'
  | 'yuebao'
  | 'hongbang';

export interface PaletteMeta {
  id: PaletteId;
  name: string;
  desc: string;
  swatch: string;
}

export interface FontMeta {
  id: FontId;
  name: string;
  desc: string;
}

export type TemplateCategory =
  | 'magazine'
  | 'poster'
  | 'book'
  | 'notebook'
  | 'geek'
  | 'chinese';

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  desc: string;
  category: TemplateCategory;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'magazine',
  'poster',
  'book',
  'notebook',
  'geek',
  'chinese',
];

export const PALETTES: PaletteMeta[] = [
  { id: 'chushaa', name: '朱砂', desc: '红 · 米纸', swatch: '#c44b2b' },
  { id: 'qingmo', name: '青墨', desc: '青 · 竹白', swatch: '#2e7d8a' },
  { id: 'mohei', name: '墨黑', desc: '黑 · 暖白', swatch: '#262626' },
  { id: 'molan', name: '茉蓝', desc: '蓝 · 灰白', swatch: '#1d4ed8' },
  { id: 'liyuan', name: '栗原', desc: '酒红 · 暖米', swatch: '#7c2d12' },
];

export const FONTS: FontMeta[] = [
  { id: 'wenkai', name: '霞鹜文楷', desc: '手写 · 雅' },
  { id: 'songti', name: '思源宋', desc: '正文 · 衬线' },
  { id: 'kaiti', name: '楷体', desc: '书法 · 灵动' },
  { id: 'heiti', name: '苹方·黑体', desc: '简洁 · 现代' },
];

export const TEMPLATES: TemplateMeta[] = [
  { id: 'qingye', name: '晴野', desc: '点阵 · 大引号', category: 'book' },
  { id: 'haibao', name: '海报', desc: '反白 · hero', category: 'poster' },
  { id: 'ningmeng', name: '柠檬', desc: '高亮笔 · 海报', category: 'poster' },
  { id: 'chongying', name: '重影', desc: '贴纸 · 偏移', category: 'notebook' },
  { id: 'huabao', name: '画报', desc: '杂志 · 首字', category: 'magazine' },
  { id: 'yinzhang', name: '印章', desc: '中式 · 朱印', category: 'chinese' },
  { id: 'geshan', name: '格栅', desc: '点阵 · 极客', category: 'geek' },
  { id: 'shouzha', name: '手札', desc: '波浪 · 手记', category: 'notebook' },
  { id: 'jiguang', name: '极光', desc: '渐变 · 现代', category: 'geek' },
  { id: 'zhangye', name: '章页', desc: '书籍 · 罗马', category: 'book' },
  { id: 'juanshou', name: '卷首', desc: '杂志 · 大首字', category: 'magazine' },
  { id: 'jiekan', name: '街刊', desc: '杂志 · Monocle', category: 'magazine' },
  { id: 'yuebao', name: '月报', desc: '杂志 · 数据感', category: 'magazine' },
  { id: 'hongbang', name: '红榜', desc: '大红 · 黑体粗', category: 'poster' },
];

/** 侧栏快捷展示的常用版式（其余在「查看全部」画廊） */
export const SIDEBAR_FEATURED_TEMPLATES: TemplateId[] = [
  'qingye',
  'haibao',
  'ningmeng',
  'hongbang',
  'jiekan',
  'yuebao',
];

/** 侧栏版式列表：当前选中置顶 + 常用版式，去重 */
export function getSidebarTemplates(
  current: TemplateId,
  source: TemplateMeta[] = TEMPLATES
): TemplateMeta[] {
  const ordered: TemplateId[] = [current];
  for (const id of SIDEBAR_FEATURED_TEMPLATES) {
    if (id !== current) ordered.push(id);
  }
  return ordered.map((id) => source.find((t) => t.id === id)!);
}

export const DEFAULT_PALETTE: PaletteId = 'chushaa';
export const DEFAULT_FONT: FontId = 'wenkai';
export const DEFAULT_TEMPLATE: TemplateId = 'qingye';

export const TEMPLATE_STORAGE_KEY = 'markdown-ai:template';
const APPEARANCE_DEFAULT_VERSION_KEY = 'markdown-ai:appearance-default-v';
const APPEARANCE_DEFAULT_VERSION = 1;

/** 读取版式；曾用海报作宣传默认时，一次性迁回晴野 */
export function getStoredTemplate(): TemplateId {
  try {
    const ver = localStorage.getItem(APPEARANCE_DEFAULT_VERSION_KEY);
    const v = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (ver !== String(APPEARANCE_DEFAULT_VERSION)) {
      const next: TemplateId =
        !v || v === 'haibao'
          ? DEFAULT_TEMPLATE
          : isTemplate(v)
            ? v
            : DEFAULT_TEMPLATE;
      localStorage.setItem(TEMPLATE_STORAGE_KEY, next);
      localStorage.setItem(
        APPEARANCE_DEFAULT_VERSION_KEY,
        String(APPEARANCE_DEFAULT_VERSION)
      );
      return next;
    }
    return isTemplate(v) ? v : DEFAULT_TEMPLATE;
  } catch {
    return DEFAULT_TEMPLATE;
  }
}

export interface PaletteVars {
  accent: string;
  accentLight: string;
  accentGlow: string;
  paper: string;
  ink: string;
  surface: string;
  surface2: string;
  border: string;
  gray100: string;
  gray500: string;
  gray600: string;
  terminalBg: string;
  terminalText: string;
  textMuted: string;
}

const BASE_LIGHT = {
  surface: '#ffffff',
  surface2: '#fbfaf7',
  border: '#e2ded6',
  gray100: '#f0ede7',
  gray500: '#6b665e',
  gray600: '#4a4640',
  terminalBg: '#0d1117',
  terminalText: '#c9d1d9',
  textMuted: '#6b665e',
};

const BASE_DARK = {
  surface: '#1a1f27',
  surface2: '#161b22',
  border: '#242a33',
  gray100: '#1c2129',
  gray500: '#9aa3b0',
  gray600: '#c2c8d2',
  terminalBg: '#0a0d12',
  terminalText: '#d1d6dd',
  textMuted: '#9aa3b0',
};

const PALETTE_VARS: Record<PaletteId, { light: PaletteVars; dark: PaletteVars }> = {
  chushaa: {
    light: {
      ...BASE_LIGHT,
      ink: '#1a1a1a',
      paper: '#f6f3ed',
      accent: '#c44b2b',
      accentLight: '#e8694d',
      accentGlow: 'rgba(196, 75, 43, 0.12)',
    },
    dark: {
      ...BASE_DARK,
      ink: '#ececec',
      paper: '#14181f',
      accent: '#e8694d',
      accentLight: '#ff8060',
      accentGlow: 'rgba(232, 105, 77, 0.18)',
    },
  },
  qingmo: {
    light: {
      ...BASE_LIGHT,
      ink: '#1c2628',
      paper: '#eef3f1',
      accent: '#2e7d8a',
      accentLight: '#43a3b0',
      accentGlow: 'rgba(46, 125, 138, 0.12)',
    },
    dark: {
      ...BASE_DARK,
      ink: '#e8eef0',
      paper: '#101618',
      accent: '#5cb6c2',
      accentLight: '#7fd0db',
      accentGlow: 'rgba(92, 182, 194, 0.18)',
    },
  },
  mohei: {
    light: {
      ...BASE_LIGHT,
      ink: '#171717',
      paper: '#f3f1ec',
      accent: '#262626',
      accentLight: '#404040',
      accentGlow: 'rgba(38, 38, 38, 0.10)',
    },
    dark: {
      ...BASE_DARK,
      ink: '#f1f1f1',
      paper: '#0e0e10',
      accent: '#dadada',
      accentLight: '#ffffff',
      accentGlow: 'rgba(218, 218, 218, 0.14)',
    },
  },
  molan: {
    light: {
      ...BASE_LIGHT,
      ink: '#0f172a',
      paper: '#f4f6fb',
      accent: '#1d4ed8',
      accentLight: '#3b6ff5',
      accentGlow: 'rgba(29, 78, 216, 0.10)',
    },
    dark: {
      ...BASE_DARK,
      ink: '#e8edf6',
      paper: '#0e1320',
      accent: '#7aa8ff',
      accentLight: '#9dbeff',
      accentGlow: 'rgba(122, 168, 255, 0.16)',
    },
  },
  liyuan: {
    light: {
      ...BASE_LIGHT,
      ink: '#1f1410',
      paper: '#fbf5e9',
      accent: '#7c2d12',
      accentLight: '#a14123',
      accentGlow: 'rgba(124, 45, 18, 0.12)',
    },
    dark: {
      ...BASE_DARK,
      ink: '#f1ece3',
      paper: '#1a120c',
      accent: '#d97757',
      accentLight: '#ee9279',
      accentGlow: 'rgba(217, 119, 87, 0.18)',
    },
  },
};

export function getPaletteVars(id: PaletteId, mode: ThemeMode): PaletteVars {
  return PALETTE_VARS[id][mode];
}

const FONT_STACKS: Record<FontId, string> = {
  wenkai: "'LXGW WenKai TC','LXGW WenKai','Songti SC','STSongti',Georgia,serif",
  songti:
    "'Source Han Serif SC','Source Han Serif CN','Noto Serif SC','Songti SC','STSongti',Georgia,serif",
  kaiti: "'STKaiti','KaiTi','BiauKai','SimKai',serif",
  heiti:
    "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','WenQuanYi Micro Hei',sans-serif",
};

export function getFontStack(id: FontId): string {
  return FONT_STACKS[id];
}

export function isPalette(v: unknown): v is PaletteId {
  return typeof v === 'string' && PALETTES.some((p) => p.id === v);
}
export function isFont(v: unknown): v is FontId {
  return typeof v === 'string' && FONTS.some((f) => f.id === v);
}
export function isTemplate(v: unknown): v is TemplateId {
  return typeof v === 'string' && TEMPLATES.some((t) => t.id === v);
}
