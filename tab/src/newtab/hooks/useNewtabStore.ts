/**
 * NewTab 状态管理
 */

import { create } from 'zustand';
import type { Shortcut, ShortcutGroup, ShortcutFolder, NewTabSettings, NewTabStorage, GridItem, GridItemType, GridItemSize } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEY, DEFAULT_GROUPS } from '../constants';
import { StorageService } from '@/lib/utils/storage';
import { getTMarksUrls } from '@/lib/constants/urls';
import { getWidgetMeta, getDefaultWidgetConfig } from '../components/widgets/widgetRegistry';

let writableRootBookmarkIdPromise: Promise<string | null> | null = null;

// 文件夹最大嵌套层级限制
const MAX_FOLDER_DEPTH = 5;

function pruneEmptySecondLevelFolders(
  items: GridItem[],
  currentFolderId: string | null,
): { items: GridItem[]; currentFolderId: string | null; changed: boolean } {
  const itemsById = new Map(items.map((i) => [i.id, i] as const));
  const childCount = new Map<string, number>();
  for (const item of items) {
    if (item.parentId) {
      childCount.set(item.parentId, (childCount.get(item.parentId) ?? 0) + 1);
    }
  }

  const toRemove = new Set<string>();
  for (const item of items) {
    if (item.type !== 'bookmarkFolder' || item.browserBookmarkId || !item.parentId) continue;
    const parent = itemsById.get(item.parentId);
    const parentIsRoot = parent && (parent.parentId ?? null) === null;
    if (parentIsRoot && (childCount.get(item.id) ?? 0) === 0) {
      toRemove.add(item.id);
    }
  }

  if (toRemove.size === 0) {
    return { items, currentFolderId, changed: false };
  }

  const filtered = items.filter((item) => !toRemove.has(item.id));

  const scopeMap = new Map<string, GridItem[]>();
  filtered.forEach((item) => {
    const key = `${item.groupId ?? 'home'}|${item.parentId ?? 'root'}`;
    if (!scopeMap.has(key)) scopeMap.set(key, []);
    scopeMap.get(key)!.push(item);
  });

  const posById = new Map<string, number>();
  scopeMap.forEach((scopeItems) => {
    scopeItems.sort((a, b) => a.position - b.position);
    scopeItems.forEach((item, index) => {
      posById.set(item.id, index);
    });
  });

  const reordered = filtered.map((item) => {
    const nextPos = posById.get(item.id);
    return nextPos !== undefined && nextPos !== item.position ? { ...item, position: nextPos } : item;
  });

  const nextCurrentFolderId = currentFolderId && toRemove.has(currentFolderId) ? null : currentFolderId;
  return { items: reordered, currentFolderId: nextCurrentFolderId, changed: true };
}

async function getWritableRootBookmarkId(browserBookmarksRootId: string | null): Promise<string | null> {
  if (!browserBookmarksRootId) return null;
  if (browserBookmarksRootId !== '0') return browserBookmarksRootId;

  if (writableRootBookmarkIdPromise) {
    return writableRootBookmarkIdPromise;
  }

  writableRootBookmarkIdPromise = (async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.bookmarks) return null;

      const tree = await chrome.bookmarks.getTree();
      const root = tree[0];

      const byId = root.children?.find((c) => c.id === '1' && !c.url);
      if (byId) return byId.id;

      const titles = new Set([
        'Bookmarks Bar',
        'Bookmarks bar',
        'Bookmarks Toolbar',
        '书签栏',
        '收藏夹栏',
        'Favorites bar',
        '收藏夹',
      ]);
      const byTitle = root.children?.find((c) => !c.url && titles.has(c.title));
      if (byTitle) return byTitle.id;

      const firstFolder = root.children?.find((c) => !c.url);
      return firstFolder?.id || null;
    } catch {
      return null;
    }
  })();

  return writableRootBookmarkIdPromise;
}

// 同步 NewTab 数据到后端（静默执行，不阻塞 UI）
async function syncNewtabToBackend(data: {
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  folders: ShortcutFolder[];
  settings: NewTabSettings;
  gridItems: GridItem[];
}) {
  try {
    const configuredUrl = await StorageService.getBookmarkSiteApiUrl();
    const apiKey = await StorageService.getBookmarkSiteApiKey();

    if (!apiKey) {
      console.log('[NewTab Sync] 未配置 API Key，跳过同步');
      return;
    }

    const baseUrl = configuredUrl?.endsWith('/api')
      ? configuredUrl
      : getTMarksUrls(configuredUrl || undefined).API_BASE;

    const response = await fetch(`${baseUrl}/tab/newtab/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        shortcuts: data.shortcuts.map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          favicon: s.favicon,
          group_id: s.groupId,
          folder_id: s.folderId,
          position: s.position,
        })),
        groups: data.groups.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          position: g.position,
        })),
        folders: data.folders.map((f) => ({
          id: f.id,
          name: f.name,
          icon: f.icon,
          group_id: f.groupId,
          position: f.position,
        })),
        settings: {
          columns: data.settings.shortcutColumns,
          style: data.settings.shortcutStyle,
          showTitle: true,
          backgroundType: data.settings.wallpaper.type,
          backgroundValue: data.settings.wallpaper.value,
          backgroundBlur: data.settings.wallpaper.blur,
          backgroundDim: data.settings.wallpaper.brightness,
          showSearch: data.settings.showSearch,
          showClock: data.settings.showClock,
          showPinnedBookmarks: data.settings.showPinnedBookmarks,
          searchEngine: data.settings.searchEngine,
        },
        gridItems: data.gridItems.map((item) => ({
          id: item.id,
          type: item.type,
          size: item.size,
          position: item.position,
          group_id: item.groupId,
          shortcut: item.shortcut,
          config: item.config,
        })),
      }),
    });

    if (response.ok) {
      console.log('[NewTab Sync] 数据已同步到后端');
    } else {
      console.warn('[NewTab Sync] 同步失败:', response.status);
    }
  } catch (error) {
    // 静默失败，不影响本地操作
    console.warn('[NewTab Sync] 同步失败:', error);
  }
}

// 防抖同步（避免频繁请求）
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSync(data: {
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  folders: ShortcutFolder[];
  settings: NewTabSettings;
  gridItems: GridItem[];
}) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    syncNewtabToBackend(data);
  }, 2000); // 2秒防抖
}

interface NewTabState {
  // 数据
  shortcuts: Shortcut[];
  shortcutGroups: ShortcutGroup[];
  shortcutFolders: ShortcutFolder[];
  activeGroupId: string | null;
  settings: NewTabSettings;
  isLoading: boolean;
  gridItems: GridItem[];
  currentFolderId: string | null;
  browserBookmarksRootId: string | null;
  homeBrowserFolderId: string | null;
  isApplyingBrowserBookmarks: boolean;
  browserBookmarkWriteLockUntil: number;
  
  // Actions
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  
  // 快捷方式操作
  addShortcut: (shortcut: Omit<Shortcut, 'id' | 'position' | 'createdAt' | 'clickCount'>) => void;
  updateShortcut: (id: string, updates: Partial<Shortcut>) => void;
  removeShortcut: (id: string) => void;
  reorderShortcuts: (fromIndex: number, toIndex: number) => void;
  incrementClickCount: (id: string) => void;
  getFilteredShortcuts: () => Shortcut[];
  
  // 分组操作
  setActiveGroup: (groupId: string | null) => void;
  addGroup: (name: string, icon: string) => void;
  updateGroup: (id: string, updates: Partial<ShortcutGroup>) => void;
  removeGroup: (id: string) => void;

  // 文件夹操作
  addFolder: (name: string, groupId?: string) => string;
  updateFolder: (id: string, updates: Partial<ShortcutFolder>) => void;
  removeFolder: (id: string) => void;
  getFolderShortcuts: (folderId: string) => Shortcut[];
  moveShortcutToFolder: (shortcutId: string, folderId: string | undefined) => void;
  
  // 设置操作
  updateSettings: (updates: Partial<NewTabSettings>) => void;

  // 网格项操作
  addGridItem: (
    type: GridItemType,
    options?: {
      size?: GridItemSize;
      groupId?: string;
      shortcut?: GridItem['shortcut'];
      bookmarkFolder?: GridItem['bookmarkFolder'];
      parentId?: string | null;
    }
  ) => void;
  updateGridItem: (id: string, updates: Partial<GridItem>) => void;
  removeGridItem: (id: string) => void;
  removeGridFolder: (id: string, mode: 'keep' | 'all') => void;
  reorderGridItems: (fromIndex: number, toIndex: number) => void;
  getFilteredGridItems: () => GridItem[];
  migrateToGridItems: () => void;
  setCurrentFolderId: (folderId: string | null) => void;
  moveGridItemToFolder: (id: string, folderId: string | null) => void;
  reorderGridItemsInCurrentScope: (activeId: string, overId: string) => void;
  reorderGridItemsInFolderScope: (folderId: string, activeId: string, overId: string) => void;
  cleanupEmptySecondLevelFolders: () => void;
  setBrowserBookmarksRootId: (rootId: string | null) => void;
  setHomeBrowserFolderId: (folderId: string | null) => void;
  setIsApplyingBrowserBookmarks: (isApplying: boolean) => void;
  setBrowserBookmarkWriteLockUntil: (until: number) => void;
  replaceBrowserBookmarkGridItems: (items: GridItem[], options?: { groupIds?: string[] }) => void;
  ensureGroupBookmarkFolderId: (groupId: string) => Promise<string | null>;

  // Browser bookmarks incremental apply (browser -> NewTab)
  upsertBrowserBookmarkNode: (node: { id: string; parentId?: string; title?: string; url?: string; index?: number }) => void;
  removeBrowserBookmarkById: (bookmarkId: string) => void;
  applyBrowserBookmarkChildrenOrder: (parentBookmarkId: string, orderedChildBookmarkIds: string[]) => void;
  mirrorHomeItemsToBrowser: (ids: string[]) => void;
  setGroupBookmarkFolderId: (groupId: string, folderId: string | null) => void;
}

// 生成唯一 ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const hasBookmarksApi = () => typeof chrome !== 'undefined' && !!chrome.bookmarks;

const HOME_FOLDER_TITLE = 'NewTab Home';
const STORAGE_KEY_HOME_FOLDER_ID = 'tmarks_home_bookmark_id';

async function getSavedHomeFolderId(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_HOME_FOLDER_ID);
    const savedId = result[STORAGE_KEY_HOME_FOLDER_ID];
    return typeof savedId === 'string' ? savedId : null;
  } catch {
    return null;
  }
}

async function saveHomeFolderId(id: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY_HOME_FOLDER_ID]: id });
  } catch {
    // ignore
  }
}

export async function ensureHomeFolder(rootId: string | null): Promise<{ id: string; wasRecreated: boolean } | null> {
  if (!hasBookmarksApi() || !rootId) {
    console.log('[TMarks] ensureHomeFolder: 无效的 rootId 或无书签 API');
    return null;
  }

  const savedId = await getSavedHomeFolderId();
  console.log(`[TMarks] ensureHomeFolder: 已保存的首页文件夹ID: ${savedId}`);
  
  if (savedId) {
    try {
      const nodes = await chrome.bookmarks.get(savedId);
      const node = nodes?.[0];
      if (node && !node.url) {
        const parentId = (node as any).parentId;
        if (parentId !== rootId) {
          console.log(`[TMarks] ensureHomeFolder: 移动首页文件夹到 TMarks 下`);
          await chrome.bookmarks.move(node.id, { parentId: rootId });
        }
        await saveHomeFolderId(node.id);
        console.log(`[TMarks] ensureHomeFolder: 使用已存在的首页文件夹 ID: ${node.id}`);
        return { id: node.id, wasRecreated: false };
      }
    } catch (e) {
      console.log('[TMarks] ensureHomeFolder: 保存的ID无效，继续查找或创建');
    }
  }

  try {
    const children = await chrome.bookmarks.getChildren(rootId);
    const existing = children.find((c) => !c.url && c.title === HOME_FOLDER_TITLE);
    if (existing) {
      await saveHomeFolderId(existing.id);
      console.log(`[TMarks] ensureHomeFolder: 找到已存在的首页文件夹 ID: ${existing.id}`);
      return { id: existing.id, wasRecreated: false };
    }

    console.log('[TMarks] ensureHomeFolder: 创建新的首页文件夹');
    const created = await chrome.bookmarks.create({
      parentId: rootId,
      title: HOME_FOLDER_TITLE,
    });
    await saveHomeFolderId(created.id);
    console.log(`[TMarks] ensureHomeFolder: 已创建首页文件夹 ID: ${created.id}`);
    return { id: created.id, wasRecreated: savedId !== null };
  } catch (e) {
    console.error('[TMarks] ensureHomeFolder: 创建首页文件夹失败:', e);
    return null;
  }
}

const isHomeRootItem = (item: GridItem) => (item.groupId ?? 'home') === 'home' && (item.parentId ?? null) === null;

export const useNewtabStore = create<NewTabState>((set, get) => {
  const ensureHomeFolderId = async (): Promise<string | null> => {
    const state = get();
    if (!state.browserBookmarksRootId) return null;
    let homeFolderId = state.homeBrowserFolderId;
    if (homeFolderId) return homeFolderId;
    const ensured = await ensureHomeFolder(state.browserBookmarksRootId);
    if (!ensured) return null;
    homeFolderId = ensured.id;
    state.setHomeBrowserFolderId(homeFolderId);
    return homeFolderId;
  };

  const ensureGroupFolderId = async (groupId: string): Promise<string | null> => {
    const state = get();
    if (!hasBookmarksApi()) return null;
    if (!state.browserBookmarksRootId) return null;
    if (groupId === 'home') {
      return ensureHomeFolderId();
    }

    const group = state.shortcutGroups.find((g) => g.id === groupId);
    if (!group) return null;

    const verifyFolder = async (folderId?: string): Promise<string | null> => {
      if (!folderId) return null;
      try {
        const nodes = await chrome.bookmarks.get(folderId);
        const node = nodes?.[0];
        if (node && !node.url) {
          return folderId;
        }
      } catch {
        // ignore
      }
      return null;
    };

    const existing = await verifyFolder(group.bookmarkFolderId ?? undefined);
    if (existing) return existing;

    const rootId = state.browserBookmarksRootId;
    if (!rootId) return null;

    try {
      const children = await chrome.bookmarks.getChildren(rootId);
      const matched = children.find((c) => !c.url && c.title === group.name);
      if (matched) {
        state.setGroupBookmarkFolderId(groupId, matched.id);
        return matched.id;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const inferGroupIdFromBookmarkParent = (parentBookmarkId?: string): string => {
    const state = get();
    if (!parentBookmarkId) return 'home';
    if (parentBookmarkId === state.homeBrowserFolderId) return 'home';
    const matchedGroup = state.shortcutGroups.find((g) => g.bookmarkFolderId === parentBookmarkId);
    if (matchedGroup) return matchedGroup.id;
    const parentGrid = state.gridItems.find(
      (item) => item.browserBookmarkId === parentBookmarkId && item.type === 'bookmarkFolder'
    );
    return parentGrid?.groupId ?? 'home';
  };

  const isRootContainerBookmarkId = (bookmarkId?: string | null) => {
    if (!bookmarkId) return false;
    const state = get();
    if (bookmarkId === state.homeBrowserFolderId) return true;
    return state.shortcutGroups.some((group) => group.bookmarkFolderId === bookmarkId);
  };

  const resolveBookmarkParentId = async (opts: {
    parentGridId?: string | null;
    inferredGroupId?: string | null;
  }): Promise<string | null> => {
    const state = get();
    if (!state.browserBookmarksRootId) return null;

    if (opts.parentGridId) {
      const parentGrid = state.gridItems.find((i) => i.id === opts.parentGridId);
      if (parentGrid?.browserBookmarkId) return parentGrid.browserBookmarkId;
    }

    const groupId = opts.inferredGroupId ?? state.activeGroupId ?? 'home';
    if ((opts.parentGridId ?? null) === null) {
      if (groupId === 'home') {
        const homeId = await ensureHomeFolderId();
        if (homeId) return homeId;
      } else {
        const groupFolderId = await ensureGroupFolderId(groupId);
        if (groupFolderId) return groupFolderId;
      }
    }

    if (groupId === 'home') {
      const homeId = await ensureHomeFolderId();
      if (homeId) return homeId;
    } else {
      const groupFolderId = await ensureGroupFolderId(groupId);
      if (groupFolderId) return groupFolderId;
    }

    const writable = await getWritableRootBookmarkId(state.browserBookmarksRootId);
    return writable ?? state.browserBookmarksRootId;
  };

  const mirrorHomeItemToBrowser = async (itemId: string) => {
    const state = get();
    if (!hasBookmarksApi()) return;
    if (!state.browserBookmarksRootId) return;
    const item = state.gridItems.find((i) => i.id === itemId);
    if (!item) return;
    if (item.browserBookmarkId) return;
    if (!isHomeRootItem(item)) return;
    if (item.type === 'shortcut' && !item.shortcut?.url) return;

    let parentBookmarkId = await ensureHomeFolderId();
    if (!parentBookmarkId) return;

    state.setBrowserBookmarkWriteLockUntil(Date.now() + 1200);
    try {
      let created: chrome.bookmarks.BookmarkTreeNode | undefined;
      if (item.type === 'bookmarkFolder') {
        created = await chrome.bookmarks.create({
          parentId: parentBookmarkId,
          title: item.bookmarkFolder?.title || '文件夹',
        });
      } else if (item.type === 'shortcut') {
        created = await chrome.bookmarks.create({
          parentId: parentBookmarkId,
          title: item.shortcut?.title || item.shortcut?.url || '快捷方式',
          url: item.shortcut?.url,
        });
      }

      if (!created?.id) return;

      set({
        gridItems: get().gridItems.map((gridItem) =>
          gridItem.id === item.id
            ? {
                ...gridItem,
                browserBookmarkId: created!.id,
              }
            : gridItem
        ),
      });
      state.saveData();
    } catch (e) {
      console.warn('[NewTab] Failed to mirror home item to browser:', e);
    }
  };

  return {
  shortcuts: [],
  shortcutGroups: DEFAULT_GROUPS,
  shortcutFolders: [],
  activeGroupId: 'home', // 默认选中首页
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  gridItems: [],
  currentFolderId: null,
  browserBookmarksRootId: null,
  homeBrowserFolderId: null,
  isApplyingBrowserBookmarks: false,
  browserBookmarkWriteLockUntil: 0,
  
  loadData: async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const data = result[STORAGE_KEY] as NewTabStorage | undefined;
      
      // 确保分组数据有效
      const groups = data?.shortcutGroups?.length ? data.shortcutGroups : DEFAULT_GROUPS;
      
      // 验证 activeGroupId 是否有效，如果无效则使用第一个分组
      let activeGroupId = data?.activeGroupId;
      if (!activeGroupId || !groups.some(g => g.id === activeGroupId)) {
        activeGroupId = groups[0]?.id || 'home';
      }
      
      // 合并设置，确保新增的设置项有默认值
      const settings = { ...DEFAULT_SETTINGS, ...(data?.settings || {}) };
      
      set({
        shortcuts: data?.shortcuts || [],
        shortcutGroups: groups,
        shortcutFolders: data?.shortcutFolders || [],
        activeGroupId,
        settings,
        gridItems: data?.gridItems || [],
        currentFolderId: null,
        browserBookmarksRootId: null,
        homeBrowserFolderId: null,
        isApplyingBrowserBookmarks: false,
        browserBookmarkWriteLockUntil: 0,
        isLoading: false,
      });
      
      // 如果是首次加载（没有数据），保存默认数据
      if (!data) {
        const { saveData } = get();
        saveData();
      }
    } catch (error) {
      console.error('Failed to load newtab data:', error);
      set({ isLoading: false });
    }
  },

  removeGridFolder: (id, mode) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, currentFolderId, saveData } = get();
    const target = gridItems.find((i) => i.id === id);
    if (!target || target.type !== 'bookmarkFolder') return;

    if (mode === 'all') {
      get().removeGridItem(id);
      return;
    }

    // mode === 'keep': move all nested descendants to parent level
    const targetGroupId = target.groupId;
    const targetParentId = target.parentId ?? null;

    // Recursively collect all descendant IDs (folders to be flattened)
    const foldersToFlatten = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of gridItems) {
        if (item.type === 'bookmarkFolder' && item.parentId && foldersToFlatten.has(item.parentId) && !foldersToFlatten.has(item.id)) {
          foldersToFlatten.add(item.id);
          changed = true;
        }
      }
    }

    // Collect all items that need to be moved to parent level (direct children of any flattened folder)
    const itemsToMove = gridItems
      .filter((item) => item.parentId && foldersToFlatten.has(item.parentId))
      .sort((a, b) => a.position - b.position);

    // Remove all flattened folders from the list
    const filtered = gridItems.filter((item) => !foldersToFlatten.has(item.id));

    const existingSiblings = filtered
      .filter((item) => item.groupId === targetGroupId && (item.parentId ?? null) === targetParentId)
      .sort((a, b) => a.position - b.position);

    const movedToParent = new Map(
      itemsToMove.map((item, index) => [
        item.id,
        {
          parentId: targetParentId ?? undefined,
          position: existingSiblings.length + index,
        },
      ] as const)
    );

    const moved = filtered.map((item) => {
      const next = movedToParent.get(item.id);
      return next ? { ...item, parentId: next.parentId, position: next.position } : item;
    });

    const scopeItems = moved
      .filter((item) => item.groupId === targetGroupId && (item.parentId ?? null) === targetParentId)
      .sort((a, b) => a.position - b.position);
    const posById = new Map(scopeItems.map((item, index) => [item.id, index] as const));
    const reordered = moved.map((item) => {
      const nextPos = posById.get(item.id);
      return nextPos === undefined ? item : { ...item, position: nextPos };
    });

    const nextCurrentFolderId = currentFolderId && foldersToFlatten.has(currentFolderId) ? null : currentFolderId;
    set({ gridItems: reordered, currentFolderId: nextCurrentFolderId });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: reordered });
  },

  cleanupEmptySecondLevelFolders: () => {
    const {
      gridItems,
      currentFolderId,
      shortcuts,
      shortcutGroups,
      shortcutFolders,
      settings,
      saveData,
    } = get();

    const { items, currentFolderId: nextFolderId, changed } = pruneEmptySecondLevelFolders(gridItems, currentFolderId);
    if (!changed) return;

    set({ gridItems: items, currentFolderId: nextFolderId });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: items });
  },

  reorderGridItemsInFolderScope: (folderId, activeId, overId) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const folder = gridItems.find((i) => i.id === folderId);
    if (!folder) return;

    const targetGroupId = folder.groupId ?? 'home';
    const scopeItems = gridItems
      .filter((item) => item.groupId === targetGroupId && (item.parentId ?? null) === folderId)
      .sort((a, b) => a.position - b.position);

    const fromIndex = scopeItems.findIndex((i) => i.id === activeId);
    const toIndex = scopeItems.findIndex((i) => i.id === overId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const reorderedScope = [...scopeItems];
    const [removed] = reorderedScope.splice(fromIndex, 1);
    reorderedScope.splice(toIndex, 0, removed);

    const positionById = new Map(reorderedScope.map((item, index) => [item.id, index] as const));
    const newGridItems = gridItems.map((item) => {
      const nextPos = positionById.get(item.id);
      return nextPos === undefined ? item : { ...item, position: nextPos };
    });

    set({ gridItems: newGridItems });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: newGridItems });

    const state = get();
    const activeItem = scopeItems[fromIndex];
    if (!state.isApplyingBrowserBookmarks && activeItem?.browserBookmarkId) {
      (async () => {
        try {
          const parentBookmarkId = await resolveBookmarkParentId({
            parentGridId: folderId,
            inferredGroupId: state.gridItems.find((i) => i.id === folderId)?.groupId ?? null,
          });
          if (!parentBookmarkId) return;

          state.setBrowserBookmarkWriteLockUntil(Date.now() + 800);
          await chrome.bookmarks.move(activeItem.browserBookmarkId!, {
            parentId: parentBookmarkId,
            index: toIndex,
          });
        } catch (e) {
          console.warn('[NewTab] Failed to reorder browser bookmark:', e);
        }
      })();
    }
  },
  
  saveData: async () => {
    const { shortcuts, shortcutGroups, shortcutFolders, activeGroupId, settings, gridItems } = get();
    const data: NewTabStorage = { shortcuts, shortcutGroups, shortcutFolders, activeGroupId, settings, gridItems };
    
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: data });
    } catch (error) {
      console.error('Failed to save newtab data:', error);
    }
  },
  
  addShortcut: (shortcut) => {
    const { shortcuts, shortcutGroups, settings, gridItems, saveData } = get();
    const newShortcut: Shortcut = {
      ...shortcut,
      id: generateId(),
      position: shortcuts.length,
      createdAt: Date.now(),
      clickCount: 0,
    };

    const newShortcuts = [...shortcuts, newShortcut];
    set({ shortcuts: newShortcuts });
    saveData();

    // 异步下载并缓存 favicon
    (async () => {
      try {
        const { downloadFavicon } = await import('../utils/favicon');
        const base64 = await downloadFavicon(newShortcut.url);
        if (base64) {
          const { updateShortcut } = get();
          updateShortcut(newShortcut.id, { faviconBase64: base64 });
        }
      } catch (error) {
        console.error('Failed to cache favicon:', error);
      }
    })();

    // 异步同步到后端（防抖）
    const { shortcutFolders } = get();
    debouncedSync({ shortcuts: newShortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },
  
  updateShortcut: (id, updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newShortcuts = shortcuts.map((s) => (s.id === id ? { ...s, ...updates } : s));
    set({ shortcuts: newShortcuts });
    saveData();
    debouncedSync({ shortcuts: newShortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },

  removeShortcut: (id) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const filtered = shortcuts.filter((s) => s.id !== id);
    const reordered = filtered.map((s, index) => ({ ...s, position: index }));
    set({ shortcuts: reordered });
    saveData();
    debouncedSync({ shortcuts: reordered, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },

  reorderShortcuts: (fromIndex, toIndex) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newShortcuts = [...shortcuts];
    const [removed] = newShortcuts.splice(fromIndex, 1);
    newShortcuts.splice(toIndex, 0, removed);
    const reordered = newShortcuts.map((s, index) => ({ ...s, position: index }));
    set({ shortcuts: reordered });
    saveData();
    debouncedSync({ shortcuts: reordered, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },
  
  incrementClickCount: (id) => {
    const { shortcuts, saveData } = get();
    set({
      shortcuts: shortcuts.map((s) =>
        s.id === id ? { ...s, clickCount: s.clickCount + 1 } : s
      ),
    });
    saveData();
  },

  ensureGroupBookmarkFolderId: (groupId) => ensureGroupFolderId(groupId),
  
  updateSettings: (updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newSettings = { ...settings, ...updates };
    set({ settings: newSettings });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings: newSettings, gridItems });
  },

  // 分组操作
  setActiveGroup: (groupId) => {
    const { saveData } = get();
    // 切换分组时清除当前文件夹，避免显示上一个分组的文件夹内容
    set({ activeGroupId: groupId, currentFolderId: null });
    saveData();
  },  // 不需要同步 activeGroupId，这是本地状态
  
  addGroup: (name, icon) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newGroup: ShortcutGroup = {
      id: generateId(),
      name,
      icon,
      position: shortcutGroups.length,
    };
    const newGroups = [...shortcutGroups, newGroup];
    set({ shortcutGroups: newGroups });
    saveData();
    debouncedSync({ shortcuts, groups: newGroups, folders: shortcutFolders, settings, gridItems });
  },

  updateGroup: (id, updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newGroups = shortcutGroups.map((g) => (g.id === id ? { ...g, ...updates } : g));
    set({ shortcutGroups: newGroups });
    saveData();
    debouncedSync({ shortcuts, groups: newGroups, folders: shortcutFolders, settings, gridItems });
  },

  removeGroup: (id) => {
    const { shortcutGroups, shortcutFolders, shortcuts, activeGroupId, settings, gridItems, saveData } = get();
    // 不允许删除首页分组
    if (id === 'home') {
      console.warn('不能删除首页分组');
      return;
    }
    // 删除分组时，将该分组的快捷方式移到首页
    const updatedShortcuts = shortcuts.map((s) =>
      s.groupId === id ? { ...s, groupId: 'home' } : s
    );
    const filtered = shortcutGroups.filter((g) => g.id !== id);
    set({
      shortcutGroups: filtered,
      shortcuts: updatedShortcuts,
      activeGroupId: activeGroupId === id ? 'home' : activeGroupId,
    });
    saveData();
    debouncedSync({ shortcuts: updatedShortcuts, groups: filtered, folders: shortcutFolders, settings, gridItems });
  },
  
  getFilteredShortcuts: () => {
    const { shortcuts, activeGroupId } = get();
    // 如果没有选中分组，默认显示首页分组
    const targetGroupId = activeGroupId ?? 'home';
    // 只返回不在文件夹内的快捷方式
    return shortcuts.filter((s) => s.groupId === targetGroupId && !s.folderId);
  },

  // 文件夹操作
  addFolder: (name, groupId) => {
    const { shortcuts, shortcutGroups, shortcutFolders, activeGroupId, settings, gridItems, saveData } = get();
    const newFolder: ShortcutFolder = {
      id: generateId(),
      name,
      position: shortcutFolders.length,
      groupId: groupId ?? activeGroupId ?? undefined,
      createdAt: Date.now(),
    };
    const newFolders = [...shortcutFolders, newFolder];
    set({ shortcutFolders: newFolders });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: newFolders, settings, gridItems });
    return newFolder.id;
  },

  updateFolder: (id, updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newFolders = shortcutFolders.map((f) => (f.id === id ? { ...f, ...updates } : f));
    set({ shortcutFolders: newFolders });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: newFolders, settings, gridItems });
  },

  removeFolder: (id) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    // 删除文件夹时，将文件夹内的快捷方式移出
    const updatedShortcuts = shortcuts.map((s) =>
      s.folderId === id ? { ...s, folderId: undefined } : s
    );
    const filtered = shortcutFolders.filter((f) => f.id !== id);
    set({ shortcutFolders: filtered, shortcuts: updatedShortcuts });
    saveData();
    debouncedSync({ shortcuts: updatedShortcuts, groups: shortcutGroups, folders: filtered, settings, gridItems });
  },

  getFolderShortcuts: (folderId) => {
    const { shortcuts } = get();
    return shortcuts.filter((s) => s.folderId === folderId);
  },

  moveShortcutToFolder: (shortcutId, folderId) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newShortcuts = shortcuts.map((s) =>
      s.id === shortcutId ? { ...s, folderId } : s
    );
    set({ shortcuts: newShortcuts });
    saveData();
    debouncedSync({ shortcuts: newShortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems });
  },

  // 网格项操作
  addGridItem: (type, options = {}) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, activeGroupId, currentFolderId, saveData } = get();
    const meta = getWidgetMeta(type);
    const defaultConfig = getDefaultWidgetConfig(type);
    
    const newItem: GridItem = {
      id: generateId(),
      type,
      size: options.size || meta.sizeConfig.defaultSize,
      position: gridItems.length,
      groupId: options.groupId ?? activeGroupId ?? undefined,
      parentId: (options.parentId ?? currentFolderId) ?? undefined,
      shortcut: options.shortcut,
      bookmarkFolder: options.bookmarkFolder,
      config: type !== 'shortcut' ? defaultConfig : undefined,
      createdAt: Date.now(),
    };

    const newGridItems = [...gridItems, newItem];
    set({ gridItems: newGridItems });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: newGridItems });

    const { isApplyingBrowserBookmarks } = get();
    if (!isApplyingBrowserBookmarks && (type === 'shortcut' || type === 'bookmarkFolder')) {
      (async () => {
        try {
          const state = get();
          const parentBookmarkId = await resolveBookmarkParentId({
            parentGridId: newItem.parentId ?? null,
            inferredGroupId: newItem.groupId ?? null,
          });
          if (!parentBookmarkId) return;

          state.setBrowserBookmarkWriteLockUntil(Date.now() + 800);

          if (type === 'bookmarkFolder') {
            const created = await chrome.bookmarks.create({
              parentId: parentBookmarkId,
              title: newItem.bookmarkFolder?.title || '文件夹',
            });

            set({
              gridItems: get().gridItems.map((i) =>
                i.id === newItem.id ? { ...i, browserBookmarkId: created.id } : i
              ),
            });
            state.saveData();
          }

          if (type === 'shortcut' && newItem.shortcut?.url) {
            const created = await chrome.bookmarks.create({
              parentId: parentBookmarkId,
              title: newItem.shortcut.title,
              url: newItem.shortcut.url,
            });

            set({
              gridItems: get().gridItems.map((i) =>
                i.id === newItem.id ? { ...i, browserBookmarkId: created.id } : i
              ),
            });
            state.saveData();
          }
        } catch (e) {
          console.warn('[NewTab] Failed to create browser bookmark:', e);
        }
      })();
    }

    // 如果是快捷方式类型，异步下载并缓存 favicon
    if (type === 'shortcut' && options.shortcut?.url) {
      (async () => {
        try {
          const { downloadFavicon } = await import('../utils/favicon');
          const base64 = await downloadFavicon(options.shortcut!.url);
          if (base64) {
            const { updateGridItem } = get();
            updateGridItem(newItem.id, {
              shortcut: {
                ...options.shortcut!,
                faviconBase64: base64,
              },
            });
          }
        } catch (error) {
          console.error('Failed to cache favicon for grid item:', error);
        }
      })();
    }
  },

  updateGridItem: (id, updates) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newGridItems = gridItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    set({ gridItems: newGridItems });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: newGridItems });

    const { isApplyingBrowserBookmarks } = get();
    const target = gridItems.find((i) => i.id === id);
    if (!isApplyingBrowserBookmarks && target?.browserBookmarkId) {
      if (target.type === 'bookmarkFolder' && updates.bookmarkFolder?.title) {
        (async () => {
          try {
            get().setBrowserBookmarkWriteLockUntil(Date.now() + 800);
            await chrome.bookmarks.update(target.browserBookmarkId!, { title: updates.bookmarkFolder!.title });
          } catch (e) {
            console.warn('[NewTab] Failed to update browser folder:', e);
          }
        })();
      }

      if (target.type === 'shortcut' && updates.shortcut) {
        (async () => {
          try {
            get().setBrowserBookmarkWriteLockUntil(Date.now() + 800);
            await chrome.bookmarks.update(target.browserBookmarkId!, {
              title: updates.shortcut?.title,
              url: updates.shortcut?.url,
            });
          } catch (e) {
            console.warn('[NewTab] Failed to update browser bookmark:', e);
          }
        })();
      }
    }
  },

  removeGridItem: (id) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, currentFolderId, saveData } = get();

    const target = gridItems.find((i) => i.id === id);
    if (!target) return;

    let toDelete = new Set<string>([id]);

    if (target.type === 'bookmarkFolder') {
      let changed = true;
      while (changed) {
        changed = false;
        for (const item of gridItems) {
          const parentId = item.parentId;
          if (parentId && toDelete.has(parentId) && !toDelete.has(item.id)) {
            toDelete.add(item.id);
            changed = true;
          }
        }
      }
    }

    const filtered = gridItems.filter((item) => !toDelete.has(item.id));

    const targetGroupId = target.groupId;
    const targetParentId = target.parentId ?? null;
    const siblings = filtered
      .filter(
        (item) =>
          item.groupId === targetGroupId && (item.parentId ?? null) === targetParentId
      )
      .sort((a, b) => a.position - b.position);

    const siblingPosById = new Map(siblings.map((item, index) => [item.id, index] as const));
    const reordered = filtered.map((item) => {
      const nextPos = siblingPosById.get(item.id);
      return nextPos === undefined ? item : { ...item, position: nextPos };
    });

    const nextCurrentFolderId = currentFolderId && toDelete.has(currentFolderId) ? null : currentFolderId;
    set({ gridItems: reordered, currentFolderId: nextCurrentFolderId });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: reordered });

    const { isApplyingBrowserBookmarks } = get();
    if (!isApplyingBrowserBookmarks) {
      const bookmarkIdsToDelete: string[] = [];
      for (const item of gridItems) {
        if (toDelete.has(item.id) && item.browserBookmarkId) {
          bookmarkIdsToDelete.push(item.browserBookmarkId);
        }
      }

      if (bookmarkIdsToDelete.length > 0) {
        (async () => {
          try {
            get().setBrowserBookmarkWriteLockUntil(Date.now() + 1200);
            for (const bid of bookmarkIdsToDelete) {
              try {
                await chrome.bookmarks.removeTree(bid);
              } catch {
                try {
                  await chrome.bookmarks.remove(bid);
                } catch {
                  // ignore
                }
              }
            }
          } catch (e) {
            console.warn('[NewTab] Failed to remove browser bookmark(s):', e);
          }
        })();
      }
    }
  },

  reorderGridItems: (fromIndex, toIndex) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const newGridItems = [...gridItems];
    const [removed] = newGridItems.splice(fromIndex, 1);
    newGridItems.splice(toIndex, 0, removed);
    const reordered = newGridItems.map((item, index) => ({ ...item, position: index }));
    set({ gridItems: reordered });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: reordered });
  },

  getFilteredGridItems: () => {
    const { gridItems, activeGroupId, currentFolderId } = get();
    // 如果没有选中分组，默认显示首页分组
    const targetGroupId = activeGroupId ?? 'home';

    const currentFolderItem = currentFolderId ? gridItems.find((i) => i.id === currentFolderId) : null;
    const isBrowserFolderScope = !!currentFolderItem?.browserBookmarkId;

    // 首页（root）：只展示自建内容（非浏览器同步项）
    if (!currentFolderId) {
      return gridItems
        .filter((item) => {
          const inGroup = item.groupId === targetGroupId;
          const inFolder = (item.parentId ?? null) === null;
          return inGroup && inFolder;
        })
        .sort((a, b) => a.position - b.position);
    }

    // 浏览器同步文件夹：只展示浏览器同步的子项（避免混入首页组件/按钮）
    if (isBrowserFolderScope) {
      return gridItems
        .filter((item) => {
          const inFolder = (item.parentId ?? null) === (currentFolderId ?? null);
          return !!item.browserBookmarkId && inFolder;
        })
        .sort((a, b) => a.position - b.position);
    }

    // 自建文件夹：维持原逻辑
    return gridItems
      .filter((item) => {
        const inGroup = item.groupId === targetGroupId;
        const inFolder = (item.parentId ?? null) === (currentFolderId ?? null);
        return inGroup && inFolder;
      })
      .sort((a, b) => a.position - b.position);
  },

  setCurrentFolderId: (folderId) => {
    set({ currentFolderId: folderId });
  },

  moveGridItemToFolder: (id, folderId) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const moving = gridItems.find((i) => i.id === id);
    if (!moving) return;

    // 计算目标文件夹深度
    const getDepth = (parentId: string | null): number => {
      if (!parentId) return 0;
      const parent = gridItems.find((i) => i.id === parentId);
      if (!parent) return 0;
      return 1 + getDepth(parent.parentId ?? null);
    };

    const targetDepth = getDepth(folderId);
    
    // 如果移动的是文件夹，计算其最大子层级深度
    const getMaxChildDepth = (itemId: string): number => {
      const children = gridItems.filter((i) => i.parentId === itemId);
      if (children.length === 0) return 0;
      return 1 + Math.max(...children.map((c) => getMaxChildDepth(c.id)));
    };

    const movingMaxChildDepth = moving.type === 'bookmarkFolder' ? getMaxChildDepth(moving.id) : 0;
    const totalDepth = targetDepth + 1 + movingMaxChildDepth;

    // 超出最大层级限制时阻止移动
    if (totalDepth > MAX_FOLDER_DEPTH) {
      console.warn(`[NewTab] 文件夹层级超出限制 (${totalDepth} > ${MAX_FOLDER_DEPTH})`);
      return;
    }

    const targetParentId = folderId ?? null;
    const isBrowserSynced = !!moving.browserBookmarkId;
    const inferredGroupId = (() => {
      if (isBrowserSynced) return moving.groupId ?? 'home';

      const activeGroupId = get().activeGroupId ?? 'home';

      const targetFolder = folderId ? gridItems.find((i) => i.id === folderId) : null;
      const sourceFolder = moving.parentId ? gridItems.find((i) => i.id === moving.parentId) : null;

      return (targetFolder?.groupId ?? sourceFolder?.groupId ?? moving.groupId ?? activeGroupId) as string;
    })();

    const targetScope = gridItems
      .filter((item) => {
        if (item.id === id) return false;
        if ((item.parentId ?? null) !== targetParentId) return false;
        if (isBrowserSynced) return !!item.browserBookmarkId;
        return !item.browserBookmarkId && (item.groupId ?? 'home') === inferredGroupId;
      })
      .sort((a, b) => a.position - b.position);

    const nextPosition = targetScope.length;

    const newGridItems = gridItems.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        groupId: inferredGroupId,
        parentId: targetParentId ?? undefined,
        position: nextPosition,
      };
    });
    set({ gridItems: newGridItems });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: newGridItems });

    if (!isBrowserSynced && inferredGroupId === 'home' && targetParentId === null) {
      get().mirrorHomeItemsToBrowser([id]);
    }

    const state = get();
    if (!state.isApplyingBrowserBookmarks && moving.browserBookmarkId) {
      (async () => {
        try {
          const targetParentBookmarkId = await resolveBookmarkParentId({
            parentGridId: folderId,
            inferredGroupId,
          });
          if (!targetParentBookmarkId) return;

          state.setBrowserBookmarkWriteLockUntil(Date.now() + 800);
          await chrome.bookmarks.move(moving.browserBookmarkId!, {
            parentId: targetParentBookmarkId,
            index: nextPosition,
          });
        } catch (e) {
          console.warn('[NewTab] Failed to move browser bookmark:', e);
        }
      })();
    }
  },

  reorderGridItemsInCurrentScope: (activeId, overId) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, activeGroupId, currentFolderId, saveData } = get();
    const targetGroupId = activeGroupId ?? 'home';
    const scopeItems = gridItems
      .filter((item) => item.groupId === targetGroupId && (item.parentId ?? null) === (currentFolderId ?? null))
      .sort((a, b) => a.position - b.position);

    const fromIndex = scopeItems.findIndex((i) => i.id === activeId);
    const toIndex = scopeItems.findIndex((i) => i.id === overId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const reorderedScope = [...scopeItems];
    const [removed] = reorderedScope.splice(fromIndex, 1);
    reorderedScope.splice(toIndex, 0, removed);

    const positionById = new Map(reorderedScope.map((item, index) => [item.id, index] as const));
    const newGridItems = gridItems.map((item) => {
      const nextPos = positionById.get(item.id);
      return nextPos === undefined ? item : { ...item, position: nextPos };
    });

    set({ gridItems: newGridItems });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, folders: shortcutFolders, settings, gridItems: newGridItems });

    const state = get();
    const activeItem = scopeItems[fromIndex];
    if (
      !state.isApplyingBrowserBookmarks &&
      activeItem?.browserBookmarkId
    ) {
      (async () => {
        try {
          const parentBookmarkId = await resolveBookmarkParentId({
            parentGridId: state.currentFolderId,
            inferredGroupId: targetGroupId,
          });
          if (!parentBookmarkId) return;

          state.setBrowserBookmarkWriteLockUntil(Date.now() + 800);
          await chrome.bookmarks.move(activeItem.browserBookmarkId!, {
            parentId: parentBookmarkId,
            index: toIndex,
          });
        } catch (e) {
          console.warn('[NewTab] Failed to reorder browser bookmark:', e);
        }
      })();
    }
  },

  setBrowserBookmarksRootId: (rootId) => {
    set((state) => ({
      browserBookmarksRootId: rootId,
      homeBrowserFolderId: rootId ? state.homeBrowserFolderId : null,
    }));
  },

  setHomeBrowserFolderId: (folderId) => {
    set({ homeBrowserFolderId: folderId });
  },

  setGroupBookmarkFolderId: (groupId, folderId) => {
    const { shortcuts, shortcutGroups, shortcutFolders, settings, gridItems, saveData } = get();
    const nextGroups = shortcutGroups.map((group) =>
      group.id === groupId ? { ...group, bookmarkFolderId: folderId ?? undefined } : group
    );
    set({ shortcutGroups: nextGroups });
    saveData();
    debouncedSync({ shortcuts, groups: nextGroups, folders: shortcutFolders, settings, gridItems });
  },

  setIsApplyingBrowserBookmarks: (isApplying) => {
    set({ isApplyingBrowserBookmarks: isApplying });
  },

  setBrowserBookmarkWriteLockUntil: (until) => {
    set({ browserBookmarkWriteLockUntil: until });
  },

  replaceBrowserBookmarkGridItems: (items, options) => {
    const { gridItems, saveData } = get();
    const inferredGroups = Array.from(
      new Set(items.map((item) => (item.groupId ?? 'home') as string))
    );
    const targetGroupIds = new Set(
      options?.groupIds && options.groupIds.length > 0 ? options.groupIds : inferredGroups
    );
    const preserved = gridItems.filter((item) => {
      if (!item.browserBookmarkId) return true;
      if (targetGroupIds.size === 0) return false;
      const groupId = item.groupId ?? 'home';
      return !targetGroupIds.has(groupId);
    });
    const normalized = items.map((item) => ({
      ...item,
      parentId: item.parentId ?? null,
      groupId: item.groupId ?? 'home',
    }));
    const next = [...preserved, ...normalized];
    set({ gridItems: next });
    saveData();
  },

  upsertBrowserBookmarkNode: (node) => {
    const { gridItems, saveData, browserBookmarksRootId } = get();
    if (!browserBookmarksRootId) return;

    const gridId = `bb-${node.id}`;
    const existing = gridItems.find((i) => i.id === gridId);

    const parentBookmarkId = node.parentId;
    const groupId = inferGroupIdFromBookmarkParent(parentBookmarkId);
    let parentId: string | undefined;
    if (parentBookmarkId) {
      if (isRootContainerBookmarkId(parentBookmarkId)) {
        parentId = null as unknown as undefined;
      } else if (parentBookmarkId === browserBookmarksRootId) {
        parentId = undefined;
      } else {
        parentId = `bb-${parentBookmarkId}`;
      }
    }

    const position = typeof node.index === 'number' ? node.index : existing?.position ?? 0;

    const nextItem: GridItem = {
      id: gridId,
      type: node.url ? 'shortcut' : 'bookmarkFolder',
      size: existing?.size ?? '1x1',
      position,
      groupId,
      parentId,
      browserBookmarkId: node.id,
      shortcut: node.url
        ? {
            url: node.url,
            title: node.title || node.url,
            favicon: existing?.shortcut?.favicon,
            faviconBase64: existing?.shortcut?.faviconBase64,
          }
        : undefined,
      bookmarkFolder: !node.url
        ? {
            title: node.title || existing?.bookmarkFolder?.title || '文件夹',
          }
        : undefined,
      config: existing?.config,
      createdAt: existing?.createdAt ?? Date.now(),
    };

    const preservedNonBrowser = gridItems.filter((i) => !i.browserBookmarkId);
    const preservedBrowserOthers = gridItems.filter((i) => i.browserBookmarkId && i.id !== gridId);
    const next = [...preservedNonBrowser, ...preservedBrowserOthers, nextItem];

    set({ gridItems: next });
    saveData();
  },

  removeBrowserBookmarkById: (bookmarkId) => {
    const { gridItems, currentFolderId, saveData } = get();
    const targetGridId = `bb-${bookmarkId}`;
    const target = gridItems.find((i) => i.id === targetGridId);
    if (!target) return;

    let toDelete = new Set<string>([targetGridId]);
    if (target.type === 'bookmarkFolder') {
      let changed = true;
      while (changed) {
        changed = false;
        for (const item of gridItems) {
          const parentId = item.parentId;
          if (parentId && toDelete.has(parentId) && !toDelete.has(item.id)) {
            toDelete.add(item.id);
            changed = true;
          }
        }
      }
    }

    const filtered = gridItems.filter((i) => !toDelete.has(i.id));

    const nextCurrentFolderId = currentFolderId && toDelete.has(currentFolderId) ? null : currentFolderId;
    set({ gridItems: filtered, currentFolderId: nextCurrentFolderId });
    saveData();
  },

  applyBrowserBookmarkChildrenOrder: (parentBookmarkId, orderedChildBookmarkIds) => {
    const { gridItems, browserBookmarksRootId, saveData } = get();
    if (!browserBookmarksRootId) return;

    const parentId =
      parentBookmarkId === browserBookmarksRootId
        ? undefined
        : isRootContainerBookmarkId(parentBookmarkId)
          ? null as unknown as undefined
          : `bb-${parentBookmarkId}`;
    const posByBookmarkId = new Map(orderedChildBookmarkIds.map((id, index) => [id, index] as const));
    const groupId = inferGroupIdFromBookmarkParent(parentBookmarkId);

    const next = gridItems.map((item) => {
      if (!item.browserBookmarkId) return item;
      const nextPos = posByBookmarkId.get(item.browserBookmarkId);
      if (nextPos === undefined) return item;
      return {
        ...item,
        parentId,
        groupId: !parentId ? groupId : item.groupId ?? groupId,
        position: nextPos,
      };
    });

    set({ gridItems: next });
    saveData();
  },

  mirrorHomeItemsToBrowser: (ids) => {
    ids.forEach((id) => {
      void mirrorHomeItemToBrowser(id);
    });
  },

  // 数据迁移：将旧的 shortcuts 迁移到 gridItems
  migrateToGridItems: () => {
    const { shortcuts, gridItems, saveData } = get();
    
    // 如果没有 shortcuts，不需要迁移
    if (shortcuts.length === 0) return;

    // 找出尚未迁移的快捷方式
    const existingShortcutIds = new Set(
      gridItems
        .filter(item => item.type === 'shortcut' && item.shortcut)
        .map(item => item.id)
    );

    const newShortcuts = shortcuts.filter(s => !existingShortcutIds.has(s.id));
    
    if (newShortcuts.length === 0) return;

    // 迁移新的快捷方式
    const migratedItems: GridItem[] = newShortcuts.map((shortcut, index) => ({
      id: shortcut.id,
      type: 'shortcut' as GridItemType,
      size: '1x1' as GridItemSize,
      position: gridItems.length + index,
      groupId: shortcut.groupId,
      shortcut: {
        url: shortcut.url,
        title: shortcut.title,
        favicon: shortcut.favicon,
      },
      createdAt: shortcut.createdAt,
    }));

    const newGridItems = [...gridItems, ...migratedItems];
    set({ gridItems: newGridItems });
    saveData();
    console.log('[NewTab] 已迁移', migratedItems.length, '个快捷方式到网格系统');
  },



  // 清空所有网格项
  };
});
