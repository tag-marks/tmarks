/**
 * 底部 Dock 栏组件 - 显示置顶书签
 * 参考 macOS Dock 和 mtab 底部栏设计
 */

import { useEffect, useState } from 'react';
import { useTMarksSync } from '../hooks/useTMarksSync';

// 获取 favicon URL
function getFaviconUrl(url: string, favicon?: string): string {
  if (favicon) return favicon;
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

export function DockBar() {
  const { syncState, pinnedBookmarks, fetchPinnedBookmarks } = useTMarksSync();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchPinnedBookmarks().finally(() => setHasLoaded(true));
  }, [fetchPinnedBookmarks]);

  // 双击刷新
  const handleDoubleClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchPinnedBookmarks();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // 加载中或无书签时不显示
  if (!hasLoaded || syncState.error || pinnedBookmarks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-fadeIn">
      <div 
        className={`flex items-end gap-1 px-3 py-2 rounded-2xl glass-dark cursor-default ${isRefreshing ? 'animate-pulse' : ''}`}
        onDoubleClick={handleDoubleClick}
        title="双击刷新"
      >
        {pinnedBookmarks.map((bookmark) => (
          <a
            key={bookmark.id}
            href={bookmark.url}
            className="group relative flex flex-col items-center transition-all duration-200"
            onMouseEnter={() => setHoveredId(bookmark.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              transform: hoveredId === bookmark.id ? 'translateY(-8px) scale(1.15)' : 'translateY(0) scale(1)',
            }}
          >
            {/* 悬浮标题提示 */}
            {hoveredId === bookmark.id && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-black/80 text-white text-xs whitespace-nowrap z-50 animate-fadeIn">
                {bookmark.title}
              </div>
            )}
            
            {/* 图标 */}
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden hover:bg-white/20 transition-colors">
              <img
                src={getFaviconUrl(bookmark.url, bookmark.favicon)}
                alt={bookmark.title}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=64`;
                  if (!target.src.includes('google.com/s2/favicons')) {
                    target.src = googleFaviconUrl;
                  } else {
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.fallback-letter')) {
                      const span = document.createElement('span');
                      span.className = 'fallback-letter text-lg font-medium text-white/70';
                      span.textContent = bookmark.title.charAt(0).toUpperCase();
                      parent.appendChild(span);
                    }
                  }
                }}
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
