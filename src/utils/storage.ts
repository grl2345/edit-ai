import { SAMPLE_MD } from './sample';

export interface Doc {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

const DOCS_KEY = 'markdown-ai:docs';
const ACTIVE_KEY = 'markdown-ai:active-doc';
const LEGACY_DOC_KEY = 'markdown-ai:doc';

function uid(): string {
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function extractTitle(md: string, fallback = '未命名文档'): string {
  const h1 = md.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim().slice(0, 60);
  const firstLine = md.split('\n').find((l) => l.trim());
  if (firstLine) return firstLine.trim().slice(0, 60);
  return fallback;
}

export function makeDoc(content = '', title?: string): Doc {
  const t = title ?? extractTitle(content, '新文档');
  return {
    id: uid(),
    title: t,
    content,
    updatedAt: Date.now(),
  };
}

export interface DocsState {
  docs: Doc[];
  activeId: string;
}

export function loadDocs(): DocsState {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Doc[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeId =
          localStorage.getItem(ACTIVE_KEY) && parsed.find((d) => d.id === localStorage.getItem(ACTIVE_KEY))
            ? (localStorage.getItem(ACTIVE_KEY) as string)
            : parsed[0].id;
        return { docs: parsed, activeId };
      }
    }
  } catch {
    /* ignore */
  }

  const legacy = localStorage.getItem(LEGACY_DOC_KEY);
  if (legacy && legacy.trim()) {
    const migrated = makeDoc(legacy);
    localStorage.removeItem(LEGACY_DOC_KEY);
    return { docs: [migrated], activeId: migrated.id };
  }

  const initial = makeDoc(SAMPLE_MD, 'Markdown AI · 示例');
  return { docs: [initial], activeId: initial.id };
}

export function saveDocs(state: DocsState) {
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify(state.docs));
    localStorage.setItem(ACTIVE_KEY, state.activeId);
  } catch {
    /* ignore quota */
  }
}
