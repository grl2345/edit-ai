import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import { renderMarkdown, buildStandaloneHTML } from './utils/markdown';
import { toTwitterText, toWeChatHTML } from './utils/copyAdapters';
import {
  Doc,
  DocsState,
  extractTitle,
  loadDocs,
  makeDoc,
  saveDocs,
} from './utils/storage';
import {
  DEFAULT_FONT,
  DEFAULT_PALETTE,
  FontId,
  PaletteId,
  ThemeMode,
  isFont,
  isPalette,
} from './utils/themes';

type Tab = 'edit' | 'preview';

const THEME_KEY = 'markdown-ai:theme';
const PALETTE_KEY = 'markdown-ai:palette';
const FONT_KEY = 'markdown-ai:font';
const SIDEBAR_KEY = 'markdown-ai:sidebar-collapsed';

export default function App() {
  const [state, setState] = useState<DocsState>(() => loadDocs());

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [palette, setPalette] = useState<PaletteId>(() => {
    const v = localStorage.getItem(PALETTE_KEY);
    return isPalette(v) ? v : DEFAULT_PALETTE;
  });

  const [font, setFont] = useState<FontId>(() => {
    const v = localStorage.getItem(FONT_KEY);
    return isFont(v) ? v : DEFAULT_FONT;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_KEY) === '1'
  );

  const [tab, setTab] = useState<Tab>('edit');
  const [toast, setToast] = useState<string>('');
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const copyWrapRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number>();

  useEffect(() => {
    if (!copyMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (copyWrapRef.current && !copyWrapRef.current.contains(e.target as Node)) {
        setCopyMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [copyMenuOpen]);

  const active: Doc | undefined = useMemo(
    () => state.docs.find((d) => d.id === state.activeId),
    [state]
  );

  const html = useMemo(() => renderMarkdown(active?.content ?? ''), [active]);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme', theme);
    r.setAttribute('data-palette', palette);
    r.setAttribute('data-font', font);
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(PALETTE_KEY, palette);
    localStorage.setItem(FONT_KEY, font);
  }, [theme, palette, font]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  useEffect(() => {
    const id = window.setTimeout(() => saveDocs(state), 250);
    return () => window.clearTimeout(id);
  }, [state]);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 1800);
  }

  function updateContent(content: string) {
    if (!active) return;
    setState((s) => ({
      ...s,
      docs: s.docs.map((d) =>
        d.id === active.id ? { ...d, content, updatedAt: Date.now() } : d
      ),
    }));
  }

  function handleCreate() {
    const doc = makeDoc('', '未命名文档');
    setState((s) => ({ docs: [doc, ...s.docs], activeId: doc.id }));
    showToast('已新建文档');
  }

  function handleSelect(id: string) {
    setState((s) => ({ ...s, activeId: id }));
  }

  function handleRename(id: string, title: string) {
    setState((s) => ({
      ...s,
      docs: s.docs.map((d) => (d.id === id ? { ...d, title, updatedAt: Date.now() } : d)),
    }));
  }

  function handleDelete(id: string) {
    setState((s) => {
      const idx = s.docs.findIndex((d) => d.id === id);
      const next = s.docs.filter((d) => d.id !== id);
      let activeId = s.activeId;
      if (activeId === id) {
        if (next.length === 0) {
          const fresh = makeDoc('', '未命名文档');
          return { docs: [fresh], activeId: fresh.id };
        }
        activeId = next[Math.max(0, idx - 1)]?.id ?? next[0].id;
      }
      return { docs: next, activeId };
    });
    showToast('已删除');
  }

  function handleDuplicate(id: string) {
    setState((s) => {
      const src = s.docs.find((d) => d.id === id);
      if (!src) return s;
      const copy: Doc = {
        ...src,
        id: makeDoc().id,
        title: `${src.title} 副本`,
        updatedAt: Date.now(),
      };
      const idx = s.docs.findIndex((d) => d.id === id);
      const docs = [...s.docs];
      docs.splice(idx + 1, 0, copy);
      return { docs, activeId: copy.id };
    });
    showToast('已复制副本');
  }

  async function writeRich(htmlContent: string, plain: string): Promise<boolean> {
    try {
      if (
        navigator.clipboard &&
        'write' in navigator.clipboard &&
        typeof ClipboardItem !== 'undefined'
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ]);
        return true;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(plain);
    } catch {
      return false;
    }
    return false;
  }

  async function handleCopyRich() {
    setCopyMenuOpen(false);
    const node = previewRef.current;
    if (!node) return;
    const ok = await writeRich(node.innerHTML, node.innerText);
    showToast(ok ? '已复制富文本，可贴到飞书 / Notion / 语雀' : '当前浏览器不支持富文本，已复制纯文本');
  }

  async function handleCopyWeChat() {
    setCopyMenuOpen(false);
    const node = previewRef.current;
    if (!node) return;
    const styled = toWeChatHTML(node.innerHTML, palette, font, theme);
    const ok = await writeRich(styled, node.innerText);
    showToast(ok ? '已复制公众号样式，到编辑器粘贴即可' : '已复制纯文本（浏览器不支持富文本写入）');
  }

  async function handleCopyTwitter() {
    setCopyMenuOpen(false);
    if (!active) return;
    const { text, chars, tweets } = toTwitterText(active.content);
    try {
      await navigator.clipboard.writeText(text);
      const hint = tweets > 1 ? `（${chars} 字，约 ${tweets} 条）` : `（${chars} 字）`;
      showToast(`已复制推特纯文本 ${hint}`);
    } catch {
      showToast('复制失败');
    }
  }

  function handleExportHTML() {
    if (!active) return;
    const title = active.title || extractTitle(active.content, 'markdown');
    const blob = new Blob(
      [buildStandaloneHTML(active.content, title, { palette, font, theme })],
      { type: 'text/html;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(title)}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('HTML 已下载');
  }

  async function handleCopyMarkdown() {
    setCopyMenuOpen(false);
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.content);
      showToast('Markdown 源码已复制');
    } catch {
      showToast('复制失败');
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-left">
          <button
            className="icon-btn"
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
            aria-label="toggle sidebar"
          >
            <MenuIcon />
          </button>
          <div className="brand">
            <div className="brand-icon">M</div>
            <div className="brand-text">Markdown AI</div>
            <div className="brand-sub">在线渲染</div>
          </div>
        </div>
        <div className="actions">
          <div className="copy-wrap" ref={copyWrapRef}>
            <button
              className="btn"
              onClick={() => setCopyMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={copyMenuOpen}
              title="复制到不同平台"
            >
              <span className="txt">复制</span>
              <CaretIcon />
            </button>
            {copyMenuOpen && (
              <div className="copy-menu" role="menu">
                <button onClick={handleCopyWeChat} role="menuitem">
                  <span className="menu-title">公众号</span>
                  <span className="menu-desc">带样式 · 直接粘到编辑器</span>
                </button>
                <button onClick={handleCopyRich} role="menuitem">
                  <span className="menu-title">飞书 / Notion / 语雀</span>
                  <span className="menu-desc">通用富文本</span>
                </button>
                <button onClick={handleCopyTwitter} role="menuitem">
                  <span className="menu-title">推特 / X</span>
                  <span className="menu-desc">精炼纯文本 · 字数提示</span>
                </button>
                <button onClick={handleCopyMarkdown} role="menuitem">
                  <span className="menu-title">Markdown 源码</span>
                  <span className="menu-desc">原文 · 跨工具迁移</span>
                </button>
              </div>
            )}
          </div>
          <button className="btn primary" onClick={handleExportHTML} title="导出独立 HTML">
            <span className="txt">导出 HTML</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            title={theme === 'light' ? '切换深色' : '切换浅色'}
            aria-label="toggle theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      <div className="body">
        <Sidebar
          docs={state.docs}
          activeId={state.activeId}
          collapsed={sidebarCollapsed}
          appearance={{
            palette,
            font,
            theme,
            onPalette: setPalette,
            onFont: setFont,
            onTheme: setTheme,
          }}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onRename={handleRename}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="mobile-tabs" role="tablist">
            <button className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}>
              编辑
            </button>
            <button
              className={tab === 'preview' ? 'active' : ''}
              onClick={() => setTab('preview')}
            >
              预览
            </button>
          </div>

          <main className="panes">
            <section className={`pane ${tab === 'edit' ? 'active' : ''}`}>
              <div className="pane-head">
                <span className="pane-tag">Markdown</span>
                <span className="pane-title" title={active?.title}>
                  {active?.title || '未命名'}
                </span>
                <span>{active?.content.length ?? 0} 字</span>
              </div>
              <textarea
                className="editor"
                value={active?.content ?? ''}
                onChange={(e) => updateContent(e.target.value)}
                spellCheck={false}
                placeholder="在这里写 Markdown…"
              />
            </section>
            <section className={`pane ${tab === 'preview' ? 'active' : ''}`}>
              <div className="pane-head">
                <span className="pane-tag">Preview</span>
              </div>
              <div className="preview-scroll">
                <article
                  className="preview-inner prose"
                  ref={previewRef}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </section>
          </main>
        </div>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'markdown';
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function CaretIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
