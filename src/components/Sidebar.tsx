import { useEffect, useRef, useState } from 'react';
import type { Doc } from '../utils/storage';
import AppearancePanel, { AppearancePanelProps } from './AppearancePanel';

interface SidebarProps {
  docs: Doc[];
  activeId: string;
  collapsed: boolean;
  appearance: AppearancePanelProps;
  onSelect(id: string): void;
  onCreate(): void;
  onRename(id: string, title: string): void;
  onDelete(id: string): void;
  onDuplicate(id: string): void;
}

export default function Sidebar({
  docs,
  activeId,
  collapsed,
  appearance,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onDuplicate,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuId) return;
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setMenuId(null);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuId]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-hidden={collapsed}>
      <div className="sidebar-section">
        <span className="sidebar-section-title">文档</span>
        <button className="sidebar-new" onClick={onCreate} title="新建文档">
          <PlusIcon /> 新建
        </button>
      </div>

      <div className="doc-list" role="listbox">
        {docs.length === 0 && <div className="doc-empty">还没有文档，点 “新建” 开始</div>}
        {docs.map((d) => (
          <div
            key={d.id}
            role="option"
            aria-selected={d.id === activeId}
            className={`doc-item ${d.id === activeId ? 'active' : ''}`}
            onClick={() => {
              if (renamingId !== d.id) onSelect(d.id);
            }}
            onDoubleClick={() => setRenamingId(d.id)}
          >
            {renamingId === d.id ? (
              <RenameInput
                initial={d.title}
                onSubmit={(v) => {
                  const t = v.trim() || d.title;
                  onRename(d.id, t);
                  setRenamingId(null);
                }}
                onCancel={() => setRenamingId(null)}
              />
            ) : (
              <>
                <div className="doc-item-title" title={d.title}>
                  {d.title || '未命名'}
                </div>
                <div className="doc-item-meta">{formatTime(d.updatedAt)}</div>
                <button
                  className="doc-item-menu"
                  aria-label="more"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuId(menuId === d.id ? null : d.id);
                  }}
                >
                  <DotsIcon />
                </button>
                {menuId === d.id && (
                  <div className="menu-pop" ref={popRef} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setRenamingId(d.id);
                        setMenuId(null);
                      }}
                    >
                      重命名
                    </button>
                    <button
                      onClick={() => {
                        onDuplicate(d.id);
                        setMenuId(null);
                      }}
                    >
                      复制副本
                    </button>
                    <button
                      className="danger"
                      onClick={() => {
                        if (confirm(`删除 “${d.title || '未命名'}”？此操作不可撤销。`)) {
                          onDelete(d.id);
                        }
                        setMenuId(null);
                      }}
                    >
                      删除
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
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

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  if (sameDay) return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
