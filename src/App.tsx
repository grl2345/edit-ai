import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import AISettingsDialog from './components/AISettingsDialog';
import BeautifyDialog from './components/BeautifyDialog';
import FormatToolbar, { FormatAction } from './components/FormatToolbar';
import { getCaretCoordinates } from './utils/textareaCaret';
import { findOpenFormatting } from './utils/formatSplit';
import { ensureCache } from './utils/imageStore';
import { renderMarkdown, buildStandaloneHTML } from './utils/markdown';
import { toTwitterText, toWeChatHTML } from './utils/copyAdapters';
import { AIConfig, loadAIConfig } from './utils/aiClient';
import { imagesFromDataTransfer, insertImagesAtCaret } from './utils/imageUpload';
import {
  Doc,
  DocsState,
  extractTitle,
  firstDocId,
  getDescendantIds,
  loadDocs,
  makeDoc,
  makeFolder,
  saveDocs,
} from './utils/storage';
import {
  DEFAULT_FONT,
  DEFAULT_PALETTE,
  DEFAULT_TEMPLATE,
  FontId,
  PaletteId,
  TemplateId,
  ThemeMode,
  isFont,
  isPalette,
  isTemplate,
} from './utils/themes';

type Tab = 'edit' | 'preview';

const THEME_KEY = 'markdown-ai:theme';
const PALETTE_KEY = 'markdown-ai:palette';
const FONT_KEY = 'markdown-ai:font';
const TEMPLATE_KEY = 'markdown-ai:template';
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

  const [template, setTemplate] = useState<TemplateId>(() => {
    const v = localStorage.getItem(TEMPLATE_KEY);
    return isTemplate(v) ? v : DEFAULT_TEMPLATE;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    () => localStorage.getItem(SIDEBAR_KEY) === '1'
  );

  const [tab, setTab] = useState<Tab>('edit');
  const [toast, setToast] = useState<string>('');
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [aiSettingsOpen, setAISettingsOpen] = useState<boolean>(false);
  const [aiBeautifyOpen, setAIBeautifyOpen] = useState<boolean>(false);
  const [aiCfg, setAICfg] = useState<AIConfig | null>(() => loadAIConfig());
  const previewRef = useRef<HTMLDivElement>(null);
  const copyWrapRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number>();
  const [dragOver, setDragOver] = useState(false);
  // 图片仓库异步加载完成后 bump 一下，让预览 useMemo 重新跑、把图填上
  const [imagesVersion, setImagesVersion] = useState(0);
  const [formatToolbar, setFormatToolbar] = useState<{
    top: number;
    left: number;
    start: number;
    end: number;
  } | null>(null);

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
    () =>
      state.nodes.find(
        (n) => n.id === state.activeId && n.type === 'doc'
      ),
    [state]
  );

  const html = useMemo(
    () => renderMarkdown(active?.content ?? ''),
    // imagesVersion 让仓库异步加载完后预览重新渲染、把 app-img:xxx 解成 data URL
    [active, imagesVersion]
  );

  useEffect(() => {
    let cancelled = false;
    ensureCache().then(() => {
      if (!cancelled) setImagesVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-theme', theme);
    r.setAttribute('data-palette', palette);
    r.setAttribute('data-font', font);
    r.setAttribute('data-template', template);
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(PALETTE_KEY, palette);
    localStorage.setItem(FONT_KEY, font);
    localStorage.setItem(TEMPLATE_KEY, template);
  }, [theme, palette, font, template]);

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
      nodes: s.nodes.map((n) =>
        n.id === active.id ? { ...n, content, updatedAt: Date.now() } : n
      ),
    }));
  }

  function handleCreateDoc(parentId: string | null = null) {
    const doc = makeDoc('', '未命名文档', parentId);
    setState((s) => {
      const nodes = parentId
        ? s.nodes.map((n) =>
            n.id === parentId ? { ...n, expanded: true } : n
          )
        : s.nodes;
      return { nodes: [doc, ...nodes], activeId: doc.id };
    });
    showToast('已新建文档');
  }

  function handleCreateFolder(parentId: string | null = null) {
    const folder = makeFolder('新建目录', parentId);
    setState((s) => {
      const nodes = parentId
        ? s.nodes.map((n) =>
            n.id === parentId ? { ...n, expanded: true } : n
          )
        : s.nodes;
      return { nodes: [folder, ...nodes], activeId: s.activeId };
    });
    showToast('已新建目录');
  }

  function handleSelect(id: string) {
    setState((s) => {
      const target = s.nodes.find((n) => n.id === id);
      if (!target || target.type !== 'doc') return s;
      return { ...s, activeId: id };
    });
  }

  function handleRename(id: string, title: string) {
    setState((s) => ({
      ...s,
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, title, updatedAt: Date.now() } : n
      ),
    }));
  }

  function handleToggleFolder(id: string) {
    setState((s) => ({
      ...s,
      nodes: s.nodes.map((n) =>
        n.id === id && n.type === 'folder'
          ? { ...n, expanded: n.expanded === false ? true : false }
          : n
      ),
    }));
  }

  function handleDelete(id: string) {
    setState((s) => {
      const target = s.nodes.find((n) => n.id === id);
      if (!target) return s;
      const toRemove = new Set<string>([id, ...getDescendantIds(s.nodes, id)]);
      const next = s.nodes.filter((n) => !toRemove.has(n.id));
      let activeId = s.activeId;
      if (toRemove.has(activeId) || !next.find((n) => n.id === activeId)) {
        const fallback = firstDocId(next);
        if (fallback) {
          activeId = fallback;
        } else {
          const fresh = makeDoc('', '未命名文档');
          return { nodes: [fresh, ...next], activeId: fresh.id };
        }
      }
      return { nodes: next, activeId };
    });
    showToast('已删除');
  }

  function handleDuplicate(id: string) {
    setState((s) => {
      const src = s.nodes.find((n) => n.id === id);
      if (!src || src.type !== 'doc') return s;
      const copy: Doc = {
        ...src,
        id: makeDoc().id,
        title: `${src.title} 副本`,
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      const idx = s.nodes.findIndex((n) => n.id === id);
      const nodes = [...s.nodes];
      nodes.splice(idx + 1, 0, copy);
      return { nodes, activeId: copy.id };
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
    const styled = toWeChatHTML(node.innerHTML, palette, font, theme, template);
    const ok = await writeRich(styled, node.innerText);
    showToast(ok ? '已复制公众号样式，到编辑器粘贴即可' : '已复制纯文本（浏览器不支持富文本写入）');
  }

  async function handleCopyTwitter() {
    setCopyMenuOpen(false);
    if (!active) return;
    const { text, chars, tweets } = toTwitterText(active.content ?? '');
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
    const content = active.content ?? '';
    const title = active.title || extractTitle(content, 'markdown');
    const blob = new Blob(
      [buildStandaloneHTML(content, title, { palette, font, theme, template })],
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

  async function insertImageFiles(files: File[]) {
    if (!active || files.length === 0) return;
    const ta = editorRef.current;
    const source = active.content ?? '';
    const caret = ta ? ta.selectionStart : source.length;
    const result = await insertImagesAtCaret(source, caret, files);
    if (!result.ok || result.nextValue === undefined) {
      showToast(result.message);
      return;
    }
    updateContent(result.nextValue);
    showToast(result.message);
    if (ta && result.nextCaret !== undefined) {
      const pos = result.nextCaret;
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(pos, pos);
      });
    }
  }

  function handleImagePick() {
    if (!active) {
      showToast('请先选择一个文档');
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    await insertImageFiles(files);
  }

  function handleEditorDragOver(e: React.DragEvent<HTMLDivElement>) {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }

  function handleEditorDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  }

  async function handleEditorDrop(e: React.DragEvent<HTMLDivElement>) {
    const files = imagesFromDataTransfer(e.dataTransfer);
    if (files.length === 0) {
      setDragOver(false);
      return;
    }
    e.preventDefault();
    setDragOver(false);
    await insertImageFiles(files);
  }

  function handleEditorSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;
    const { selectionStart: start, selectionEnd: end } = ta;
    if (start === end) {
      setFormatToolbar(null);
      return;
    }
    // 用 selectionStart 算坐标，工具栏放在选区起点的上方
    const caret = getCaretCoordinates(ta, start);
    const top = caret.top - ta.scrollTop - 38;
    const left = caret.left - ta.scrollLeft;
    setFormatToolbar({ top, left, start, end });
  }

  function applyFormat(action: FormatAction) {
    if (!active || !formatToolbar) return;
    const { start, end } = formatToolbar;
    const ta = editorRef.current;
    if (!ta) return;
    const src = ta.value;
    const selected = src.slice(start, end);
    if (!selected) return;

    let replaced = selected;
    switch (action.type) {
      case 'color': {
        // 选区已经被颜色 span 完整包住时，直接换色，避免嵌套
        const wrap = /^<span style="color:[^"]*">([\s\S]*)<\/span>$/;
        const m = selected.match(wrap);
        const inner = m ? m[1] : selected;
        replaced = `<span style="color:${action.value}">${inner}</span>`;
        break;
      }
      case 'clearColor': {
        replaced = selected
          .replace(/<span\s+style="color:[^"]*">/g, '')
          .replace(/<\/span>/g, '');
        break;
      }
      case 'bold': {
        const wrap = /^\*\*([\s\S]+)\*\*$/;
        const m = selected.match(wrap);
        replaced = m ? m[1] : `**${selected}**`;
        break;
      }
      case 'highlight': {
        const wrap = /^==([\s\S]+)==$/;
        const m = selected.match(wrap);
        replaced = m ? m[1] : `==${selected}==`;
        break;
      }
    }

    setFormatToolbar(null);
    replaceWithUndoableInsert(ta, start, end, replaced);
    // execCommand 把光标留在插入末尾；这里把它再撑回成选区，让用户能继续叠 buff
    const newEnd = start + replaced.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start, newEnd);
    });
  }

  function handleEditorKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Enter') return;
    // Shift+Enter 留给"软换行"，Cmd/Ctrl+Enter 留给系统快捷键
    if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
    const ta = e.currentTarget;
    if (ta.selectionStart !== ta.selectionEnd) return; // 选中状态下走原生替换
    const fmt = findOpenFormatting(ta.value, ta.selectionStart);
    if (!fmt) return; // 不在任何格式里，原生回车

    e.preventDefault();
    const pos = ta.selectionStart;
    const insertion = fmt.close + '\n\n' + fmt.open;
    replaceWithUndoableInsert(ta, pos, pos, insertion);
    // 光标落在 reopen 之后，刚好可以继续打字
    const newPos = pos + insertion.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    });
  }

  async function handleEditorPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = imagesFromDataTransfer(e.clipboardData);
    if (files.length === 0) return;
    e.preventDefault();
    await insertImageFiles(files);
  }

  async function handleCopyMarkdown() {
    setCopyMenuOpen(false);
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.content ?? '');
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
          nodes={state.nodes}
          activeId={state.activeId}
          collapsed={sidebarCollapsed}
          appearance={{
            palette,
            font,
            theme,
            template,
            content: active?.content ?? '',
            onPalette: setPalette,
            onFont: setFont,
            onTheme: setTheme,
            onTemplate: setTemplate,
          }}
          onSelect={handleSelect}
          onCreateDoc={handleCreateDoc}
          onCreateFolder={handleCreateFolder}
          onRename={handleRename}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onToggleFolder={handleToggleFolder}
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
                <span>{active?.content?.length ?? 0} 字</span>
                <div style={{ flex: 1 }} />
                <button
                  className="pane-action-icon"
                  onClick={handleImagePick}
                  title="插入图片（也可拖拽 / 粘贴）"
                  aria-label="插入图片"
                >
                  <ImageIcon />
                </button>
                <button
                  className="pane-action"
                  onClick={() => {
                    if (!active?.content?.trim()) {
                      showToast('文档为空，无需排版');
                      return;
                    }
                    if (!aiCfg) {
                      setAISettingsOpen(true);
                      showToast('先配置 AI 服务');
                      return;
                    }
                    setAIBeautifyOpen(true);
                  }}
                  title="用 AI 重新排版（保留原文字句）"
                >
                  ✦ AI 美化排版
                </button>
                <button
                  className="pane-action-icon"
                  onClick={() => setAISettingsOpen(true)}
                  title="AI 服务配置"
                  aria-label="AI 服务配置"
                >
                  ⚙
                </button>
              </div>
              <div
                className={`editor-wrap ${dragOver ? 'drag-over' : ''}`}
                onDragOver={handleEditorDragOver}
                onDragLeave={handleEditorDragLeave}
                onDrop={handleEditorDrop}
              >
                <textarea
                  ref={editorRef}
                  className="editor"
                  value={active?.content ?? ''}
                  onChange={(e) => {
                    updateContent(e.target.value);
                    setFormatToolbar(null);
                  }}
                  onKeyDown={handleEditorKeyDown}
                  onPaste={handleEditorPaste}
                  onSelect={handleEditorSelect}
                  onBlur={() => {
                    // 不要立刻关，给工具栏按钮一次 onMouseDown 拦截的机会
                    window.setTimeout(() => setFormatToolbar(null), 120);
                  }}
                  onScroll={() => setFormatToolbar(null)}
                  spellCheck={false}
                  placeholder="在这里写 Markdown…（可直接拖拽 / 粘贴图片）"
                />
                {formatToolbar && (
                  <FormatToolbar
                    style={{
                      top: Math.max(4, formatToolbar.top),
                      left: Math.max(8, formatToolbar.left),
                    }}
                    onAction={applyFormat}
                  />
                )}
                {dragOver && (
                  <div className="editor-drop-hint">松开即可插入图片</div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleFileInputChange}
                />
              </div>
            </section>
            <section className={`pane ${tab === 'preview' ? 'active' : ''}`}>
              <div className="pane-head">
                <span className="pane-tag">Preview</span>
              </div>
              <div className="preview-scroll">
                <article
                  className="preview-inner prose"
                  data-template={template}
                  ref={previewRef}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            </section>
          </main>
        </div>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>

      <AISettingsDialog
        open={aiSettingsOpen}
        onClose={() => setAISettingsOpen(false)}
        onSaved={(cfg) => {
          setAICfg(cfg);
          showToast('AI 配置已保存');
        }}
      />

      {aiCfg && active && (
        <BeautifyDialog
          open={aiBeautifyOpen}
          source={active.content ?? ''}
          cfg={aiCfg}
          onApply={(next) => {
            updateContent(next);
            showToast('已应用 AI 美化排版');
          }}
          onClose={() => setAIBeautifyOpen(false)}
        />
      )}
    </div>
  );
}

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'markdown';
}

/**
 * 在 textarea 的 [start,end) 处插入 text，并保留浏览器原生 undo 栈。
 *
 * React 受控 textarea 直接 setState 会把 value 整段替换，textarea 的撤销栈
 * 当场报废（Cmd+Z 没反应）。document.execCommand('insertText') 是 textarea
 * 上唯一能把改动塞进原生 undo 栈的 API，虽然标记为 deprecated，但所有主流
 * 浏览器仍然支持，且会触发 input 事件让 React 受控值同步更新。
 *
 * execCommand 不可用时退化为直接 setRangeText + 手动派发 input 事件——会丢
 * undo 但至少功能不坏。
 */
function replaceWithUndoableInsert(
  ta: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string
) {
  ta.focus();
  ta.setSelectionRange(start, end);
  let ok = false;
  try {
    ok = document.execCommand('insertText', false, text);
  } catch {
    ok = false;
  }
  if (ok) return;
  // 退化路径
  ta.setRangeText(text, start, end, 'end');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
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
function ImageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M21 16l-5-5-9 9" />
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
