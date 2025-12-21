import { useEffect, useMemo, useState } from 'react';
import {
  Home,
  Folder,
  Briefcase,
  GraduationCap,
  Wrench,
  Code,
  Film,
  Music,
  ShoppingCart,
  Star,
  Globe,
  Zap,
  BookMarked,
  BookMarked as TMarksIcon,
  Settings,
} from 'lucide-react';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { StorageService } from '@/lib/utils/storage';
import { getTMarksUrls } from '@/lib/constants/urls';

interface BookmarkSidebarProps {
  onOpenSettings?: () => void;
}

function pickIconByTitle(title: string) {
  const t = (title || '').toLowerCase();

  if (t.includes('工作') || t.includes('协作') || t.includes('办公') || t.includes('jira') || t.includes('notion')) return Briefcase;
  if (t.includes('学习') || t.includes('课程') || t.includes('文档') || t.includes('知识') || t.includes('book')) return GraduationCap;
  if (t.includes('开发') || t.includes('代码') || t.includes('github') || t.includes('api')) return Code;
  if (t.includes('工具') || t.includes('软件') || t.includes('效率')) return Wrench;
  if (t.includes('视频') || t.includes('影视') || t.includes('电影') || t.includes('bilibili') || t.includes('youtube')) return Film;
  if (t.includes('音乐') || t.includes('播客')) return Music;
  if (t.includes('购物') || t.includes('电商')) return ShoppingCart;
  if (t.includes('收藏') || t.includes('喜欢') || t.includes('favorite')) return Star;
  if (t.includes('社交') || t.includes('论坛') || t.includes('社区')) return Globe;
  if (t.includes('ai') || t.includes('模型') || t.includes('gpt') || t.includes('chat')) return Zap;
  if (t.includes('书签') || t.includes('网址') || t.includes('链接')) return BookMarked;

  return Folder;
}

export function BookmarkSidebar({ onOpenSettings }: BookmarkSidebarProps) {
  const { gridItems, currentFolderId, setCurrentFolderId } = useNewtabStore();

  const [tmarksUrl, setTmarksUrl] = useState('');

  useEffect(() => {
    const loadTMarksUrl = async () => {
      const config = await StorageService.getTMarksConfig();
      if (config?.bookmarkApiUrl) {
        const baseUrl = config.bookmarkApiUrl.replace(/\/api\/?$/, '');
        setTmarksUrl(baseUrl);
      } else {
        setTmarksUrl(getTMarksUrls().BASE_URL);
      }
    };
    loadTMarksUrl();
  }, []);

  const byId = useMemo(() => new Map(gridItems.map((i) => [i.id, i] as const)), [gridItems]);

  const rootFolders = useMemo(() => {
    return gridItems
      .filter((i) => i.type === 'bookmarkFolder' && !!i.browserBookmarkId && (i.parentId ?? null) === null)
      .sort((a, b) => a.position - b.position);
  }, [gridItems]);

  const navBaseFolderId = useMemo(() => {
    if (rootFolders.length !== 1) return null;
    const only = rootFolders[0];
    const title = only.bookmarkFolder?.title || '';
    const isContainer = /^backup\b/i.test(title) || title.includes('备份') || title.includes('Backup');
    return isContainer ? only.id : null;
  }, [rootFolders]);

  const topFolders = useMemo(() => {
    if (!navBaseFolderId) return rootFolders;
    return gridItems
      .filter((i) => i.type === 'bookmarkFolder' && !!i.browserBookmarkId && (i.parentId ?? null) === navBaseFolderId)
      .sort((a, b) => a.position - b.position);
  }, [gridItems, navBaseFolderId, rootFolders]);

  const activeTopFolderId = useMemo(() => {
    if (!currentFolderId) return null;
    let cursor: string | null = currentFolderId;

    while (cursor) {
      const item = byId.get(cursor);
      if (!item || item.type !== 'bookmarkFolder') return null;
      const parentId = item.parentId ?? null;

      // 如果有容器层（Backup），高亮其下一层分类
      if (navBaseFolderId) {
        if (parentId === navBaseFolderId) return item.id;
        cursor = parentId;
        continue;
      }

      // 没有容器层：高亮根层分类
      if (parentId === null) return item.id;
      cursor = parentId;
    }

    return null;
  }, [byId, currentFolderId, navBaseFolderId]);

  return (
    <div
      data-bookmark-sidebar="1"
      className="fixed left-3 top-1/2 -translate-y-1/2 z-30 rounded-2xl p-2 animate-fadeIn flex flex-col"
      style={{
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
      }}
    >
      <div
        className="flex flex-col gap-1 overflow-y-auto max-h-[72vh] pr-0.5"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.35) rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
            !currentFolderId
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/15'
          }`}
          title="首页"
        >
          <Home className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-white/20 mx-auto my-1" />

        {topFolders.map((f) => {
          const title = f.bookmarkFolder?.title || '文件夹';
          const isActive = activeTopFolderId === f.id;
          const Icon = pickIconByTitle(title);

          return (
            <button
              key={f.id}
              onClick={() => setCurrentFolderId(f.id)}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/15'
              }`}
              title={title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      <div className="w-6 h-px bg-white/20 mx-auto my-2" />

      {tmarksUrl && (
        <button
          onClick={() => window.open(tmarksUrl, '_blank')}
          className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 text-white/70 hover:text-white hover:bg-white/15"
          title="TMarks 书签"
        >
          <TMarksIcon className="w-4 h-4" />
        </button>
      )}

      {tmarksUrl && <div className="w-6 h-px bg-white/20 mx-auto my-2" />}

      <button
        onClick={onOpenSettings}
        className="relative w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90 text-white/70 hover:text-white hover:bg-white/15"
        title="设置"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
}
