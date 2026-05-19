import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from './i18n';
import Sidebar from './components/Sidebar';
import AISettingsDialog from './components/AISettingsDialog';
import BeautifyDialog from './components/BeautifyDialog';
import FormatToolbar, { FormatAction } from './components/FormatToolbar';
import ImageTransferPanel, { TransferImage } from './components/ImageTransferPanel';
import { getCaretCoordinates } from './utils/textareaCaret';
import { findOpenFormatting } from './utils/formatSplit';
import { ensureCache } from './utils/imageStore';
import { renderMarkdown, buildStandaloneHTML } from './utils/markdown';
import { toTwitterText, toWeChatHTML, toZhihuHTML } from './utils/copyAdapters';
import { AIConfig, loadAIConfig } from './utils/aiClient';
import { imagesFromDataTransfer, insertImagesAtCaret } from './utils/imageUpload';
import { syncPromoDocsForLocale } from './utils/sample';
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
  FontId,
  PaletteId,
  TemplateId,
  ThemeMode,
  TEMPLATE_STORAGE_KEY,
  getStoredTemplate,
  isFont,
  isPalette,
} from './utils/themes';

type Tab = 'edit' | 'preview';

const THEME_KEY = 'markdown-ai:theme';
const PALETTE_KEY = 'markdown-ai:palette';
const FONT_KEY = 'markdown-ai:font';
const TEMPLATE_KEY = TEMPLATE_STORAGE_KEY;
const SIDEBAR_KEY = 'markdown-ai:sidebar-collapsed';

export default function App() {
  const { t, format, locale, setLocale } = useI18n();
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

  const [template, setTemplate] = useState<TemplateId>(() => getStoredTemplate());

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
    // 首次访问：移动端默认收起，避免抽屉盖住正文
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 820px)').matches;
  });

  const [tab, setTab] = useState<Tab>('edit');
  const [toast, setToast] = useState<string>('');
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  // "已自动保存 · HH:MM" 指示：state 改动 250ms 后落盘，落盘时刷新
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [aiSettingsOpen, setAISettingsOpen] = useState<boolean>(false);
  const [aiBeautifyOpen, setAIBeautifyOpen] = useState<boolean>(false);
  const [aiCfg, setAICfg] = useState<AIConfig | null>(() => loadAIConfig());
  const previewRef = useRef<HTMLDivElement>(null);
  const copyWrapRef = useRef<HTMLDivElement>(null);
  const exportWrapRef = useRef<HTMLDivElement>(null);
  const initialStateRef = useRef(true);
  const prevLocaleRef = useRef(locale);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number>();
  const [dragOver, setDragOver] = useState(false);
  // 图片仓库异步加载完成后 bump 一下，让预览 useMemo 重新跑、把图填上
  const [imagesVersion, setImagesVersion] = useState(0);
  const [imageTransfer, setImageTransfer] = useState<{
    images: TransferImage[];
    title: string;
    hint: string;
  } | null>(null);
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

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (exportWrapRef.current && !exportWrapRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [exportMenuOpen]);

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
    // 首次挂载不算"用户编辑"，跳过 saving 指示
    if (initialStateRef.current) {
      initialStateRef.current = false;
      return;
    }
    setSaving(true);
    const id = window.setTimeout(() => {
      saveDocs(state);
      setLastSavedAt(Date.now());
      setSaving(false);
    }, 250);
    return () => window.clearTimeout(id);
  }, [state]);

  useEffect(() => {
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    setState((s) => {
      const nodes = syncPromoDocsForLocale(s.nodes, locale);
      return nodes === s.nodes ? s : { ...s, nodes };
    });
  }, [locale]);

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
    const doc = makeDoc('', t.doc.newDoc, parentId);
    setState((s) => {
      const nodes = parentId
        ? s.nodes.map((n) =>
            n.id === parentId ? { ...n, expanded: true } : n
          )
        : s.nodes;
      return { nodes: [doc, ...nodes], activeId: doc.id };
    });
    showToast(t.toast.docCreated);
  }

  function handleCreateFolder(parentId: string | null = null) {
    const folder = makeFolder(t.doc.newFolder, parentId);
    setState((s) => {
      const nodes = parentId
        ? s.nodes.map((n) =>
            n.id === parentId ? { ...n, expanded: true } : n
          )
        : s.nodes;
      return { nodes: [folder, ...nodes], activeId: s.activeId };
    });
    showToast(t.toast.folderCreated);
  }

  function handleSelect(id: string) {
    setState((s) => {
      const target = s.nodes.find((n) => n.id === id);
      if (!target || target.type !== 'doc') return s;
      return { ...s, activeId: id };
    });
    // 移动端：选完文档自动关侧栏，让用户看到正文
    if (window.matchMedia('(max-width: 820px)').matches) {
      setSidebarCollapsed(true);
    }
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
          const fresh = makeDoc('', t.doc.newDoc);
          return { nodes: [fresh, ...next], activeId: fresh.id };
        }
      }
      return { nodes: next, activeId };
    });
    showToast(t.toast.deleted);
  }

  function handleDuplicate(id: string) {
    setState((s) => {
      const src = s.nodes.find((n) => n.id === id);
      if (!src || src.type !== 'doc') return s;
      const copy: Doc = {
        ...src,
        id: makeDoc().id,
        title: `${src.title} ${t.doc.duplicateSuffix}`,
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      const idx = s.nodes.findIndex((n) => n.id === id);
      const nodes = [...s.nodes];
      nodes.splice(idx + 1, 0, copy);
      return { nodes, activeId: copy.id };
    });
    showToast(t.toast.duplicated);
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
    showToast(ok ? t.toast.copyRichOk : t.toast.copyRichFail);
  }

  async function handleCopyWeChat() {
    setCopyMenuOpen(false);
    const node = previewRef.current;
    if (!node) return;
    const styled = toWeChatHTML(node.innerHTML, palette, font, theme, template);
    const ok = await writeRich(styled, node.innerText);
    showToast(ok ? t.toast.copyWechatOk : t.toast.copyWechatFail);
  }

  async function handleCopyZhihu() {
    setCopyMenuOpen(false);
    const node = previewRef.current;
    if (!node) return;
    const { html, images } = toZhihuHTML(node.innerHTML);
    const ok = await writeRich(html, node.innerText);
    if (images.length === 0) {
      showToast(ok ? t.toast.copyZhihuOk : t.toast.copyZhihuFail);
      return;
    }
    setImageTransfer({
      images,
      title: t.imageTransfer.zhihuTitle,
      hint: t.imageTransfer.zhihuHint,
    });
    showToast(
      ok ? format(t.toast.copyZhihuStep, { count: images.length }) : t.toast.copyZhihuFail
    );
  }

  async function handleCopyTwitter() {
    setCopyMenuOpen(false);
    if (!active) return;
    const node = previewRef.current;
    const { text, chars, tweets } = toTwitterText(active.content ?? '');
    // 从预览 DOM 拿到已解引用的图片列表（src 是真实 data URL）
    const images: TransferImage[] = [];
    if (node) {
      node.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') ?? '';
        const alt = img.getAttribute('alt') ?? '';
        if (src) images.push({ src, alt });
      });
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      showToast(t.toast.copyFail);
      return;
    }
    const threadHint =
      tweets > 1
        ? format(t.toast.twitterThreadMulti, { chars, tweets })
        : format(t.toast.twitterThreadSingle, { chars });
    if (images.length === 0) {
      showToast(format(t.toast.copyTwitterOk, { hint: threadHint }));
      return;
    }
    setImageTransfer({
      images,
      title: t.imageTransfer.twitterTitle,
      hint: t.imageTransfer.twitterHint,
    });
    showToast(`${format(t.toast.copyTwitterOk, { hint: threadHint })} · ${format(t.toast.copyTwitterStep, { count: images.length })}`);
  }

  function handleExportHTML() {
    setExportMenuOpen(false);
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
    showToast(t.toast.htmlDownloaded);
  }

  function handleExportAll() {
    setExportMenuOpen(false);
    const payload = {
      app: 'markdown-ai',
      version: 1,
      exportedAt: new Date().toISOString(),
      // 仅导出文档与目录结构，外观偏好不归档
      nodes: state.nodes,
      activeId: state.activeId,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, '-');
    a.href = url;
    a.download = `markdown-ai-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    const docCount = state.nodes.filter((n) => n.type === 'doc').length;
    showToast(format(t.toast.backupExported, { count: docCount }));
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
      showToast(t.toast.selectDocFirst);
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
      showToast(t.toast.copyMdOk);
    } catch {
      showToast(t.toast.copyFail);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-left">
          <button
            className="icon-btn"
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? t.app.expandSidebar : t.app.collapseSidebar}
            aria-label="toggle sidebar"
          >
            <MenuIcon />
          </button>
          <div className="brand">
            <div className="brand-icon">M</div>
            <div className="brand-text">Markdown AI</div>
            <div className="brand-sub">{t.app.brandSub}</div>
          </div>
        </div>
        <div className="actions">
          <div className="copy-wrap" ref={copyWrapRef}>
            <button
              className="btn"
              onClick={() => setCopyMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={copyMenuOpen}
              title={t.app.copyTitle}
            >
              <span className="txt">{t.app.copy}</span>
              <CaretIcon />
            </button>
            {copyMenuOpen && (
              <div className="copy-menu" role="menu">
                <div className="copy-menu-group">{t.copyMenu.groupOneClick}</div>
                <button onClick={handleCopyWeChat} role="menuitem">
                  <span className="menu-title">{t.copyMenu.wechatTitle}</span>
                  <span className="menu-desc">{t.copyMenu.wechatDesc}</span>
                </button>
                <button onClick={handleCopyRich} role="menuitem">
                  <span className="menu-title">{t.copyMenu.richTitle}</span>
                  <span className="menu-desc">{t.copyMenu.richDesc}</span>
                </button>
                <button onClick={handleCopyMarkdown} role="menuitem">
                  <span className="menu-title">{t.copyMenu.mdTitle}</span>
                  <span className="menu-desc">{t.copyMenu.mdDesc}</span>
                </button>
                <div className="copy-menu-group">
                  {t.copyMenu.groupStep} <span className="copy-menu-group-hint">{t.copyMenu.groupStepHint}</span>
                </div>
                <button onClick={handleCopyZhihu} role="menuitem">
                  <span className="menu-title">
                    {t.copyMenu.zhihuTitle} <span className="menu-tag">{t.copyMenu.stepTag}</span>
                  </span>
                  <span className="menu-desc">{t.copyMenu.zhihuDesc}</span>
                </button>
                <button onClick={handleCopyTwitter} role="menuitem">
                  <span className="menu-title">
                    {t.copyMenu.twitterTitle} <span className="menu-tag">{t.copyMenu.stepTag}</span>
                  </span>
                  <span className="menu-desc">{t.copyMenu.twitterDesc}</span>
                </button>
              </div>
            )}
          </div>
          <div className="copy-wrap" ref={exportWrapRef}>
            <button
              className="btn primary"
              onClick={() => setExportMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              title={t.app.exportTitle}
            >
              <span className="txt">{t.app.export}</span>
              <CaretIcon />
            </button>
            {exportMenuOpen && (
              <div className="copy-menu" role="menu">
                <button onClick={handleExportHTML} role="menuitem">
                  <span className="menu-title">{t.exportMenu.htmlTitle}</span>
                  <span className="menu-desc">{t.exportMenu.htmlDesc}</span>
                </button>
                <button onClick={handleExportAll} role="menuitem">
                  <span className="menu-title">{t.exportMenu.backupTitle}</span>
                  <span className="menu-desc">{t.exportMenu.backupDesc}</span>
                </button>
              </div>
            )}
          </div>
          <div className="lang-switch" role="group" aria-label={t.app.langSwitch}>
            <button
              type="button"
              className={locale === 'zh' ? 'active' : ''}
              onClick={() => setLocale('zh')}
            >
              {t.app.langZh}
            </button>
            <button
              type="button"
              className={locale === 'en' ? 'active' : ''}
              onClick={() => setLocale('en')}
            >
              {t.app.langEn}
            </button>
          </div>
          <button
            className="icon-btn"
            onClick={() => setTheme((th) => (th === 'light' ? 'dark' : 'light'))}
            title={theme === 'light' ? t.app.toggleDark : t.app.toggleLight}
            aria-label="toggle theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      <div className="body">
        {!sidebarCollapsed && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarCollapsed(true)}
            aria-hidden
          />
        )}
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
              {t.editor.tabEdit}
            </button>
            <button
              className={tab === 'preview' ? 'active' : ''}
              onClick={() => setTab('preview')}
            >
              {t.editor.tabPreview}
            </button>
          </div>

          <main className="panes">
            <section className={`pane ${tab === 'edit' ? 'active' : ''}`}>
              <div className="pane-head">
                <span className="pane-tag">Markdown</span>
                <span className="pane-title" title={active?.title}>
                  {active?.title || t.editor.untitled}
                </span>
                <span>{active?.content?.length ?? 0} {t.editor.charUnit}</span>
                <span
                  className={`save-indicator ${saving ? 'saving' : 'saved'}`}
                  title={
                    saving
                      ? t.editor.savingTitle
                      : lastSavedAt
                      ? format(t.editor.savedAt, { time: new Date(lastSavedAt).toLocaleString() })
                      : ''
                  }
                >
                  <span className="save-dot" />
                  {saving ? t.editor.saving : `${t.editor.saved} ${formatSavedTime(lastSavedAt)}`}
                </span>
                <div style={{ flex: 1 }} />
                <button
                  className="pane-action-icon"
                  onClick={handleImagePick}
                  title={t.editor.insertImage}
                  aria-label={t.editor.insertImage}
                >
                  <ImageIcon />
                </button>
                <button
                  className="pane-action"
                  onClick={() => {
                    if (!active?.content?.trim()) {
                      showToast(t.toast.emptyDocBeautify);
                      return;
                    }
                    if (!aiCfg) {
                      setAISettingsOpen(true);
                      showToast(t.toast.configureAiFirst);
                      return;
                    }
                    setAIBeautifyOpen(true);
                  }}
                  title={t.editor.beautifyTitle}
                >
                  {t.editor.beautify}
                </button>
                <button
                  className="pane-action-icon"
                  onClick={() => setAISettingsOpen(true)}
                  title={t.editor.aiSettings}
                  aria-label={t.editor.aiSettings}
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
                  placeholder={t.editor.placeholder}
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
                  <div className="editor-drop-hint">{t.editor.dropHint}</div>
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

      {imageTransfer && (
        <ImageTransferPanel
          images={imageTransfer.images}
          title={imageTransfer.title}
          hint={imageTransfer.hint}
          onToast={showToast}
          onClose={() => setImageTransfer(null)}
        />
      )}

      <AISettingsDialog
        open={aiSettingsOpen}
        onClose={() => setAISettingsOpen(false)}
        onSaved={(cfg) => {
          setAICfg(cfg);
          showToast(t.toast.aiSaved);
        }}
      />

      {aiCfg && active && (
        <BeautifyDialog
          open={aiBeautifyOpen}
          source={active.content ?? ''}
          cfg={aiCfg}
          onApply={(next, { keepOriginal }) => {
            if (keepOriginal) {
              // 把当前文档应用美化前的内容存一份副本插到列表里，跟着活动文档同级
              const backup: Doc = {
                ...active,
                id: makeDoc().id,
                title: `${active.title || t.editor.untitled} · ${t.beautify.beforeBackupSuffix}`,
                content: active.content ?? '',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              setState((s) => {
                const idx = s.nodes.findIndex((n) => n.id === active.id);
                const nodes = [...s.nodes];
                // 把副本插在原文档紧接其后
                nodes.splice(idx + 1, 0, backup);
                // 同时把当前文档内容换为美化后的版本
                return {
                  ...s,
                  nodes: nodes.map((n) =>
                    n.id === active.id ? { ...n, content: next, updatedAt: Date.now() } : n
                  ),
                };
              });
              showToast(t.toast.beautifyAppliedBackup);
            } else {
              updateContent(next);
              showToast(t.toast.beautifyApplied);
            }
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

function formatSavedTime(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
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
