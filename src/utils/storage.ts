import { getStoredLocale } from '../i18n';
import { en } from '../i18n/locales/en';
import { zh } from '../i18n/locales/zh';
import { getSampleMd, isLegacySampleDoc } from './sample';

export type NodeType = 'doc' | 'folder';

export interface FsNode {
  id: string;
  type: NodeType;
  title: string;
  parentId: string | null;
  content?: string;
  expanded?: boolean;
  updatedAt: number;
  createdAt: number;
}

export type Doc = FsNode;

const NODES_KEY = 'markdown-ai:nodes';
const ACTIVE_KEY = 'markdown-ai:active-doc';
const LEGACY_DOCS_KEY = 'markdown-ai:docs';
const LEGACY_DOC_KEY = 'markdown-ai:doc';
const SAMPLE_VERSION_KEY = 'markdown-ai:sample-version';
const CURRENT_SAMPLE_VERSION = 4;

function maybeUpgradePromoSample(nodes: FsNode[]): FsNode[] {
  try {
    const ver = Number(localStorage.getItem(SAMPLE_VERSION_KEY) || '0');
    const locale = getStoredLocale();
    const msg = locale === 'en' ? en : zh;
    const promo = getSampleMd(locale);
    let changed = false;
    for (const n of nodes) {
      if (n.type !== 'doc') continue;
      const content = n.content ?? '';
      const needsUpgrade =
        isLegacySampleDoc(n.title, content) ||
        (ver < CURRENT_SAMPLE_VERSION &&
          content.trimStart().startsWith('# Markdown AI'));
      if (needsUpgrade) {
        n.title = msg.doc.sampleTitle;
        n.content = promo;
        n.updatedAt = Date.now();
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(
        SAMPLE_VERSION_KEY,
        String(CURRENT_SAMPLE_VERSION)
      );
    }
  } catch {
    /* ignore */
  }
  return nodes;
}

function uid(prefix = 'n'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function extractTitle(md: string, fallback = '未命名文档'): string {
  const h1 = md.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim().slice(0, 60);
  const firstLine = md.split('\n').find((l) => l.trim());
  if (firstLine) return firstLine.trim().slice(0, 60);
  return fallback;
}

export function makeDoc(
  content = '',
  title?: string,
  parentId: string | null = null
): FsNode {
  const t = title ?? extractTitle(content, '新文档');
  const now = Date.now();
  return {
    id: uid('d'),
    type: 'doc',
    title: t,
    parentId,
    content,
    updatedAt: now,
    createdAt: now,
  };
}

export function makeFolder(
  title = '新建目录',
  parentId: string | null = null
): FsNode {
  const now = Date.now();
  return {
    id: uid('f'),
    type: 'folder',
    title,
    parentId,
    expanded: true,
    updatedAt: now,
    createdAt: now,
  };
}

export interface DocsState {
  nodes: FsNode[];
  activeId: string;
}

export function getDescendantIds(nodes: FsNode[], id: string): string[] {
  const out: string[] = [];
  const walk = (pid: string) => {
    for (const n of nodes) {
      if (n.parentId === pid) {
        out.push(n.id);
        if (n.type === 'folder') walk(n.id);
      }
    }
  };
  walk(id);
  return out;
}

export function firstDocId(nodes: FsNode[]): string | undefined {
  return nodes.find((n) => n.type === 'doc')?.id;
}

export function loadDocs(): DocsState {
  try {
    const raw = localStorage.getItem(NODES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FsNode[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const saved = localStorage.getItem(ACTIVE_KEY);
        const has =
          saved && parsed.find((n) => n.id === saved && n.type === 'doc');
        const activeId = has ? (saved as string) : firstDocId(parsed) ?? '';
        return { nodes: maybeUpgradePromoSample(parsed), activeId };
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const rawOld = localStorage.getItem(LEGACY_DOCS_KEY);
    if (rawOld) {
      const oldDocs = JSON.parse(rawOld) as Array<{
        id: string;
        title: string;
        content: string;
        updatedAt: number;
      }>;
      if (Array.isArray(oldDocs) && oldDocs.length > 0) {
        const now = Date.now();
        const migrated: FsNode[] = oldDocs.map((d) => ({
          id: d.id,
          type: 'doc',
          title: d.title,
          parentId: null,
          content: d.content,
          updatedAt: d.updatedAt ?? now,
          createdAt: d.updatedAt ?? now,
        }));
        const saved = localStorage.getItem(ACTIVE_KEY);
        const activeId =
          saved && migrated.find((n) => n.id === saved)
            ? (saved as string)
            : migrated[0].id;
        return { nodes: migrated, activeId };
      }
    }
  } catch {
    /* ignore */
  }

  const legacy = localStorage.getItem(LEGACY_DOC_KEY);
  if (legacy && legacy.trim()) {
    const m = makeDoc(legacy);
    localStorage.removeItem(LEGACY_DOC_KEY);
    return { nodes: [m], activeId: m.id };
  }

  const locale = getStoredLocale();
  const msg = locale === 'en' ? en : zh;
  const initial = makeDoc(getSampleMd(locale), msg.doc.sampleTitle);
  return { nodes: [initial], activeId: initial.id };
}

export function saveDocs(state: DocsState) {
  try {
    localStorage.setItem(NODES_KEY, JSON.stringify(state.nodes));
    localStorage.setItem(ACTIVE_KEY, state.activeId);
  } catch {
    /* ignore quota */
  }
}
