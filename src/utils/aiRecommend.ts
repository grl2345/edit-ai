/**
 * AI 推荐版式选型
 *
 * 输入：当前文档 markdown 全文
 * 输出：14 套版式按"匹配度"排序的列表 + 每个的"为什么"
 *
 * 实现：本地启发式特征抽取 + 规则打分。零延迟，零成本，离线可用。
 * 每个版式的打分逻辑只看几个该版式真正擅长的信号，避免一个文档全部高分。
 */
import { TemplateId, TEMPLATES } from './themes';

interface Features {
  chars: number;
  h1: number;
  h2: number;
  h3: number;
  /** ### XXX：末尾带中文 / 英文冒号的 chip 标题 */
  h3Chip: number;
  images: number;
  /** ```lang ... ``` */
  codeBlocks: number;
  /** | a | b | ... | 行数 */
  tableRows: number;
  callouts: number;
  highlights: number;
  /** - **粗体标题**\n\n  描述 */
  defList: number;
  blockquotes: number;
  chineseChars: number;
  enWords: number;
  emojis: number;
  /** 数字 / 百分比 / 单位 */
  data: number;
  /** 商业 / 招生 / 营销关键词 */
  commercial: number;
  /** —— / 散文 / 引用密集 */
  literary: number;
  /** 第N章 / 第N节 */
  chapter: number;
}

function count(re: RegExp, s: string): number {
  return (s.match(re) || []).length;
}

function analyze(md: string): Features {
  return {
    chars: md.length,
    h1: count(/^#\s/gm, md),
    h2: count(/^##\s/gm, md),
    h3: count(/^###\s/gm, md),
    h3Chip: count(/^###\s.*[：:]\s*$/gm, md),
    images: count(/!\[[^\]]*\]\([^)]+\)/g, md),
    codeBlocks: Math.floor(count(/^```/gm, md) / 2),
    tableRows: count(/^\s*\|[^\n]+\|\s*$/gm, md),
    callouts: count(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/gim, md),
    highlights: count(/==[^=\n]+==/g, md),
    defList: count(/^[-*+]\s+\*\*[^*\n]+\*\*\s*$/gm, md),
    blockquotes: count(/^>\s/gm, md),
    chineseChars: count(/[一-鿿]/g, md),
    enWords: count(/\b[a-zA-Z]{3,}\b/g, md),
    emojis: count(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, md),
    data: count(/\d+(?:\.\d+)?%|\d+万|\d+亿|\bGMV\b|\bDAU\b|\bMAU\b|同比|环比|增长|下降|占比/g, md),
    commercial: count(/招生|限时|抢购|入手|重磅|爆款|颠覆|新品|首发|All\s*in|破局|风口|赛道/gi, md),
    literary: count(/——|散文|随笔|故事是|那年|那天|彼时|凡是|岁月/g, md),
    chapter: count(/^第[一二三四五六七八九十百千零\d]+[章节]/gm, md),
  };
}

export interface Recommendation {
  templateId: TemplateId;
  score: number;
  reasons: string[];
}

interface Rule {
  weight: number;
  test: (f: Features) => boolean;
  reason: string;
}

const RULES: Record<TemplateId, Rule[]> = {
  hongbang: [
    { weight: 6, test: (f) => f.h3Chip >= 2, reason: (`多个 chip 标题`) },
    { weight: 4, test: (f) => f.defList >= 2, reason: '定义列表多' },
    { weight: 5, test: (f) => f.commercial >= 2, reason: '商业 / 招生关键词' },
    { weight: 3, test: (f) => f.highlights >= 2, reason: '高亮重点多' },
    { weight: 2, test: (f) => f.h2 >= 3 && f.chars > 1500, reason: '多章节中长文' },
  ],
  haibao: [
    { weight: 5, test: (f) => f.commercial >= 1 && f.chars < 2000, reason: '宣传短文' },
    { weight: 3, test: (f) => f.h1 >= 1 && f.h2 >= 2, reason: '标题层次清晰' },
    { weight: 2, test: (f) => f.images >= 1, reason: '有配图' },
  ],
  ningmeng: [
    { weight: 5, test: (f) => f.chars < 1200, reason: '短文清新' },
    { weight: 3, test: (f) => f.emojis >= 3, reason: '多 emoji' },
    { weight: 2, test: (f) => f.h2 <= 2 && f.codeBlocks === 0, reason: '日常随手' },
  ],
  chongying: [
    { weight: 7, test: (f) => f.codeBlocks >= 2, reason: '多个代码块' },
    { weight: 3, test: (f) => f.enWords > f.chineseChars / 4, reason: '英文 / 技术名词多' },
    { weight: 2, test: (f) => f.callouts >= 1, reason: '技术提示卡' },
  ],
  huabao: [
    { weight: 7, test: (f) => f.images >= 3, reason: '多张配图' },
    { weight: 3, test: (f) => f.images >= 1 && f.chars > 1500, reason: '图文并茂' },
    { weight: 2, test: (f) => f.literary >= 1, reason: '文学感' },
  ],
  yinzhang: [
    { weight: 5, test: (f) => f.chineseChars / (f.enWords + 1) > 15, reason: '纯中文 / 公文感' },
    { weight: 3, test: (f) => f.chapter >= 1, reason: '章节体' },
    { weight: 2, test: (f) => f.blockquotes >= 2 && f.literary >= 1, reason: '引用密集' },
  ],
  geshan: [
    { weight: 6, test: (f) => f.tableRows >= 3, reason: '表格 / 数据多' },
    { weight: 4, test: (f) => f.codeBlocks >= 1 && f.h2 >= 2, reason: '工程报告结构' },
    { weight: 2, test: (f) => f.data >= 3, reason: '数据密集' },
  ],
  shouzha: [
    { weight: 6, test: (f) => f.chars < 800, reason: '短文随笔' },
    { weight: 4, test: (f) => f.h1 === 0 && f.h2 === 0, reason: '无层级笔记' },
    { weight: 3, test: (f) => f.literary >= 1, reason: '私人语感' },
  ],
  jiguang: [
    { weight: 5, test: (f) => f.commercial >= 1 && f.codeBlocks >= 1, reason: '科技产品发布' },
    { weight: 3, test: (f) => f.enWords > 30, reason: '英文术语多' },
    { weight: 2, test: (f) => f.h2 >= 2 && f.chars < 2500, reason: '中短宣传文' },
  ],
  zhangye: [
    { weight: 7, test: (f) => f.chapter >= 1, reason: '有章节标记' },
    { weight: 5, test: (f) => f.chars > 3000 && f.codeBlocks === 0, reason: '长文 / 散文' },
    { weight: 3, test: (f) => f.literary >= 2, reason: '文学语感' },
  ],
  juanshou: [
    { weight: 5, test: (f) => f.chars > 2500 && f.codeBlocks === 0, reason: '杂志开篇长稿' },
    { weight: 3, test: (f) => f.h1 >= 1 && f.blockquotes >= 1, reason: '开篇引言' },
    { weight: 3, test: (f) => f.literary >= 2, reason: '文学语感' },
  ],
  jiekan: [
    { weight: 5, test: (f) => f.images >= 2 && f.h2 >= 2, reason: '图文专题' },
    { weight: 4, test: (f) => f.chars > 2000 && f.callouts >= 1, reason: '长稿 + 注解卡' },
    { weight: 2, test: (f) => f.enWords > 20, reason: '国际化语感' },
  ],
  yuebao: [
    { weight: 7, test: (f) => f.tableRows >= 3, reason: '多表格' },
    { weight: 5, test: (f) => f.data >= 4, reason: '数据密集' },
    { weight: 4, test: (f) => f.callouts >= 2, reason: '多 NOTE/TIP 卡' },
    { weight: 2, test: (f) => f.h2 >= 3, reason: '多章节报告' },
  ],
  qingye: [
    // 通用兜底：当其它版式打分都低，晴野作为干净万用版式胜出
    { weight: 2, test: () => true, reason: '通用 · 干净的默认版式' },
    { weight: 2, test: (f) => f.blockquotes >= 1 && f.images >= 1, reason: '图文小品' },
  ],
  shishang: [
    { weight: 6, test: (f) => f.literary >= 2, reason: '文学 / 时尚语感' },
    { weight: 4, test: (f) => f.chars > 1000 && f.images >= 2, reason: '图文并茂' },
    { weight: 3, test: (f) => f.blockquotes >= 2, reason: '引用丰富' },
    { weight: 2, test: (f) => f.h1 >= 1 && f.h2 >= 1, reason: '标题层次清晰' },
  ],
  chuanbo: [
    { weight: 6, test: (f) => f.commercial >= 2, reason: '商业 / 科技感强' },
    { weight: 5, test: (f) => f.h2 >= 3 && f.chars > 1500, reason: '多章节报道' },
    { weight: 4, test: (f) => f.data >= 2, reason: '数据感强' },
    { weight: 2, test: (f) => f.enWords > 25, reason: '英文术语多' },
  ],
  wenyi: [
    { weight: 7, test: (f) => f.literary >= 2 && f.codeBlocks === 0, reason: '文学散文' },
    { weight: 5, test: (f) => f.chars > 2000 && f.h2 >= 2, reason: '长篇叙述' },
    { weight: 3, test: (f) => f.blockquotes >= 2, reason: '引用丰富' },
    { weight: 2, test: (f) => f.chineseChars / (f.enWords + 1) > 10, reason: '中文为主' },
  ],
};

export function recommend(markdown: string): Recommendation[] {
  if (!markdown || !markdown.trim()) {
    // 空文档：晴野优先
    return TEMPLATES.map((t) => ({
      templateId: t.id,
      score: t.id === 'qingye' ? 3 : 1,
      reasons: t.id === 'qingye' ? ['空文档 · 推荐通用版式'] : [],
    })).sort((a, b) => b.score - a.score);
  }
  const f = analyze(markdown);
  return TEMPLATES.map((t) => {
    const rules = RULES[t.id] || [];
    let score = 0;
    const reasons: string[] = [];
    for (const r of rules) {
      if (r.test(f)) {
        score += r.weight;
        reasons.push(r.reason);
      }
    }
    return { templateId: t.id, score, reasons };
  }).sort((a, b) => b.score - a.score);
}
