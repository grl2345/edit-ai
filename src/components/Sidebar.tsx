import { useEffect, useMemo, useRef, useState } from 'react';
import type { FsNode } from '../utils/storage';
import AppearancePanel, { AppearancePanelProps } from './AppearancePanel';

interface SidebarProps {
  nodes: FsNode[];
  activeId: string;
  collapsed: boolean;
  appearance: AppearancePanelProps;
  onSelect(id: string): void;
  onCreateDoc(parentId?: string | null): void;
  onCreateFolder(parentId?: string | null): void;
  onRename(id: string, title: string): void;
  onDelete(id: string): void;
  onDuplicate(id: string): void;
  onToggleFolder(id: string): void;
}

export default function Sidebar({
  nodes,
  activeId,
  collapsed,
  appearance,
  onSelect,
  onCreateDoc,
  onCreateFolder,
  onRename,
  onDelete,
  onDuplicate,
  onToggleFolder,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const newMenuRef = useRef<HTMLDivElement>(null);

  const childMap = useMemo(() => {
    const m = new Map<string | null, FsNode[]>();
    for (const n of nodes) {
      const key = n.parentId;
      const arr = m.get(key) ?? [];
      arr.push(n);
      m.set(key, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    }
    return m;
  }, [nodes]);

  useEffect(() => {
    if (!menuId && !newMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuId && popRef.current && !popRef.current.contains(t)) {
        setMenuId(null);
      }
      if (newMenuOpen && newMenuRef.current && !newMenuRef.current.contains(t)) {
        setNewMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [menuId, newMenuOpen]);

  function confirmDelete(n: FsNode) {
    const desc =
      n.type === 'folder'
        ? `目录 “${n.title || '未命名目录'}” 及其全部内容`
        : `“${n.title || '未命名'}”`;
    if (window.confirm(`确定删除 ${desc}？此操作不可撤销。`)) {
      onDelete(n.id);
    }
    setMenuId(null);
  }

  function renderRow(n: FsNode, depth: number) {
    const isFolder = n.type === 'folder';
    const expanded = isFolder ? n.expanded !== false : false;
    const children = childMap.get(n.id) ?? [];
    const isActive = !isFolder && n.id === activeId;
    const isRenaming = renamingId === n.id;

    return (
      <div key={n.id} className="tree-branch">
        <div
          role={isFolder ? 'treeitem' : 'option'}
          aria-selected={isActive}
          aria-expanded={isFolder ? expanded : undefined}
          className={`tree-row ${isActive ? 'active' : ''} ${isFolder ? 'is-folder' : 'is-doc'}`}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => {
            if (isRenaming) return;
            if (isFolder) onToggleFolder(n.id);
            else onSelect(n.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setRenamingId(n.id);
          }}
        >
          {isFolder ? (
            <span className={`tree-chevron ${expanded ? 'open' : ''}`}>
              <CaretRightIcon />
            </span>
          ) : (
            <span className="tree-chevron spacer" />
          )}
          <span className={`tree-icon ${isFolder ? 'folder' : 'doc'}`}>
            {isFolder ? <FolderIcon /> : <DocIcon />}
          </span>

          {isRenaming ? (
            <RenameInput
              initial={n.title}
              onSubmit={(v) => {
                onRename(n.id, v.trim() || n.title);
                setRenamingId(null);
              }}
              onCancel={() => setRenamingId(null)}
            />
          ) : (
            <span className="tree-title" title={n.title}>
              {n.title || (isFolder ? '未命名目录' : '未命名')}
            </span>
          )}

          {!isRenaming && (
            <div className="tree-actions" onClick={(e) => e.stopPropagation()}>
              {isFolder && (
                <button
                  className="tree-icon-btn"
                  aria-label="在此目录下新建文档"
                  title="新建文档"
                  onClick={() => {
                    if (n.expanded === false) onToggleFolder(n.id);
                    onCreateDoc(n.id);
                  }}
                >
                  <PlusIcon />
                </button>
              )}
              <button
                className="tree-icon-btn"
                aria-label="更多操作"
                title="更多"
                onClick={() => setMenuId(menuId === n.id ? null : n.id)}
              >
                <DotsIcon />
              </button>
              {menuId === n.id && (
                <div className="menu-pop tree-menu" ref={popRef}>
                  {isFolder && (
                    <>
                      <button
                        onClick={() => {
                          if (n.expanded === false) onToggleFolder(n.id);
                          onCreateDoc(n.id);
                          setMenuId(null);
                        }}
                      >
                        新建文档
                      </button>
                      <button
                        onClick={() => {
                          if (n.expanded === false) onToggleFolder(n.id);
                          onCreateFolder(n.id);
                          setMenuId(null);
                        }}
                      >
                        新建子目录
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setRenamingId(n.id);
                      setMenuId(null);
                    }}
                  >
                    重命名
                  </button>
                  {!isFolder && (
                    <button
                      onClick={() => {
                        onDuplicate(n.id);
                        setMenuId(null);
                      }}
                    >
                      复制副本
                    </button>
                  )}
                  <button className="danger" onClick={() => confirmDelete(n)}>
                    删除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isFolder && expanded && children.length > 0 && (
          <div className="tree-children" role="group">
            {children.map((c) => renderRow(c, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  const roots = childMap.get(null) ?? [];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-hidden={collapsed}>
      <div className="sidebar-section">
        <span className="sidebar-section-title">文档</span>
        <div className="new-wrap" ref={newMenuRef}>
          <button
            className="sidebar-new"
            onClick={() => setNewMenuOpen((o) => !o)}
            title="新建"
            aria-haspopup="menu"
            aria-expanded={newMenuOpen}
          >
            <PlusIcon /> <span>新建</span> <CaretDownIcon />
          </button>
          {newMenuOpen && (
            <div className="menu-pop new-menu" role="menu">
              <button
                onClick={() => {
                  setNewMenuOpen(false);
                  onCreateDoc(null);
                }}
              >
                <DocIcon />
                <span>新建文档</span>
              </button>
              <button
                onClick={() => {
                  setNewMenuOpen(false);
                  onCreateFolder(null);
                }}
              >
                <FolderIcon />
                <span>新建目录</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="doc-list tree-list" role="tree">
        {roots.length === 0 && (
          <div className="doc-empty">还没有内容，点 “新建” 开始</div>
        )}
        {roots.map((r) => renderRow(r, 0))}
      </div>

      <AppearancePanel {...appearance} />
    </aside>
  );
}

function RenameInput({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: string;
  onSubmit(v: string): void;
  onCancel(): void;
}) {
  const [val, setVal] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      className="doc-rename-input"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onSubmit(val)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSubmit(val);
        if (e.key === 'Escape') onCancel();
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
function CaretDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function CaretRightIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
