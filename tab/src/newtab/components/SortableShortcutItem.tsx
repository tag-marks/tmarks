/**
 * 可排序的快捷方式项组件
 */

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Pencil, GripVertical } from 'lucide-react';
import { useNewtabStore } from '../hooks/useNewtabStore';
import type { Shortcut } from '../types';

interface SortableShortcutItemProps {
  shortcut: Shortcut;
  style?: 'icon' | 'card';
}

export function SortableShortcutItem({ shortcut }: SortableShortcutItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { removeShortcut, updateShortcut, incrementClickCount } = useNewtabStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shortcut.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const handleClick = () => {
    incrementClickCount(shortcut.id);
    window.location.href = shortcut.url;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTitle = prompt('修改名称:', shortcut.title);
    if (newTitle && newTitle !== shortcut.title) {
      updateShortcut(shortcut.id, { title: newTitle });
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeShortcut(shortcut.id);
  };

  const getFaviconUrl = () => {
    if (shortcut.favicon) return shortcut.favicon;
    try {
      const domain = new URL(shortcut.url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`
        relative flex flex-col items-center gap-2 cursor-pointer
        ${isDragging ? 'opacity-50' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 图标容器 - 参考 mtab 样式 */}
      <div
        className={`
          relative w-16 h-16 rounded-2xl glass flex items-center justify-center overflow-hidden
          hover:bg-white/20 transition-all duration-200
          ${isDragging ? 'shadow-xl ring-2 ring-white/30' : ''}
        `}
      >
        {/* 拖拽手柄 */}
        {isHovered && (
          <div
            {...attributes}
            {...listeners}
            className="absolute top-1 left-1 p-0.5 rounded cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3 text-white/40" />
          </div>
        )}

        {/* 操作按钮 */}
        {isHovered && (
          <div className="absolute top-1 right-1 flex gap-0.5 animate-scaleIn">
            <button
              onClick={handleEdit}
              className="p-0.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Pencil className="w-2.5 h-2.5 text-white" />
            </button>
            <button
              onClick={handleRemove}
              className="p-0.5 rounded-full bg-white/20 hover:bg-red-500/80 transition-colors"
            >
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        )}

        {/* 图标 */}
        {getFaviconUrl() ? (
          <img
            src={getFaviconUrl()}
            alt={shortcut.title}
            className="w-9 h-9 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-letter')) {
                const span = document.createElement('span');
                span.className = 'fallback-letter text-xl font-medium text-white';
                span.textContent = shortcut.title.charAt(0).toUpperCase();
                parent.appendChild(span);
              }
            }}
          />
        ) : (
          <span className="text-xl font-medium text-white">
            {shortcut.title.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* 标题 - 在容器外面 */}
      <span className="text-xs text-white/80 truncate max-w-[80px] text-center">
        {shortcut.title}
      </span>
    </div>
  );
}
