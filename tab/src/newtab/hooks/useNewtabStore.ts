/**
 * NewTab 状态管理
 */

import { create } from 'zustand';
import type { Shortcut, ShortcutGroup, NewTabSettings, NewTabStorage } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEY, DEFAULT_GROUPS } from '../constants';
import { StorageService } from '@/lib/utils/storage';
import { getTMarksUrls } from '@/lib/constants/urls';

// 同步 NewTab 数据到后端（静默执行，不阻塞 UI）
async function syncNewtabToBackend(data: {
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  settings: NewTabSettings;
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
          position: s.position,
        })),
        groups: data.groups.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon,
          position: g.position,
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
          showWeather: data.settings.showWeather,
          showTodo: data.settings.showTodo,
          showHotSearch: data.settings.showHotSearch,
          showPinnedBookmarks: data.settings.showPinnedBookmarks,
          searchEngine: data.settings.searchEngine,
        },
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
  settings: NewTabSettings;
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
  activeGroupId: string | null;
  settings: NewTabSettings;
  isLoading: boolean;
  
  // Actions
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  
  // 快捷方式操作
  addShortcut: (shortcut: Omit<Shortcut, 'id' | 'position' | 'createdAt' | 'clickCount'>) => void;
  updateShortcut: (id: string, updates: Partial<Shortcut>) => void;
  removeShortcut: (id: string) => void;
  reorderShortcuts: (fromIndex: number, toIndex: number) => void;
  incrementClickCount: (id: string) => void;
  
  // 分组操作
  setActiveGroup: (groupId: string | null) => void;
  addGroup: (name: string, icon: string) => void;
  updateGroup: (id: string, updates: Partial<ShortcutGroup>) => void;
  removeGroup: (id: string) => void;
  getFilteredShortcuts: () => Shortcut[];
  
  // 设置操作
  updateSettings: (updates: Partial<NewTabSettings>) => void;
}

// 生成唯一 ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const useNewtabStore = create<NewTabState>((set, get) => ({
  shortcuts: [],
  shortcutGroups: DEFAULT_GROUPS,
  activeGroupId: null,
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  
  loadData: async () => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const data = result[STORAGE_KEY] as NewTabStorage | undefined;
      
      if (data) {
        set({
          shortcuts: data.shortcuts || [],
          shortcutGroups: data.shortcutGroups || DEFAULT_GROUPS,
          activeGroupId: data.activeGroupId ?? null,
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load newtab data:', error);
      set({ isLoading: false });
    }
  },
  
  saveData: async () => {
    const { shortcuts, shortcutGroups, activeGroupId, settings } = get();
    const data: NewTabStorage = { shortcuts, shortcutGroups, activeGroupId, settings };
    
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: data });
    } catch (error) {
      console.error('Failed to save newtab data:', error);
    }
  },
  
  addShortcut: (shortcut) => {
    const { shortcuts, shortcutGroups, settings, saveData } = get();
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

    // 异步同步到后端（防抖）
    debouncedSync({ shortcuts: newShortcuts, groups: shortcutGroups, settings });
  },
  
  updateShortcut: (id, updates) => {
    const { shortcuts, shortcutGroups, settings, saveData } = get();
    const newShortcuts = shortcuts.map((s) => (s.id === id ? { ...s, ...updates } : s));
    set({ shortcuts: newShortcuts });
    saveData();
    debouncedSync({ shortcuts: newShortcuts, groups: shortcutGroups, settings });
  },

  removeShortcut: (id) => {
    const { shortcuts, shortcutGroups, settings, saveData } = get();
    const filtered = shortcuts.filter((s) => s.id !== id);
    const reordered = filtered.map((s, index) => ({ ...s, position: index }));
    set({ shortcuts: reordered });
    saveData();
    debouncedSync({ shortcuts: reordered, groups: shortcutGroups, settings });
  },

  reorderShortcuts: (fromIndex, toIndex) => {
    const { shortcuts, shortcutGroups, settings, saveData } = get();
    const newShortcuts = [...shortcuts];
    const [removed] = newShortcuts.splice(fromIndex, 1);
    newShortcuts.splice(toIndex, 0, removed);
    const reordered = newShortcuts.map((s, index) => ({ ...s, position: index }));
    set({ shortcuts: reordered });
    saveData();
    debouncedSync({ shortcuts: reordered, groups: shortcutGroups, settings });
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
  
  updateSettings: (updates) => {
    const { shortcuts, shortcutGroups, settings, saveData } = get();
    const newSettings = { ...settings, ...updates };
    set({ settings: newSettings });
    saveData();
    debouncedSync({ shortcuts, groups: shortcutGroups, settings: newSettings });
  },

  // 分组操作
  setActiveGroup: (groupId) => {
    const { saveData } = get();
    set({ activeGroupId: groupId });
    saveData();
    // 不需要同步 activeGroupId，这是本地状态
  },

  addGroup: (name, icon) => {
    const { shortcuts, shortcutGroups, settings, saveData } = get();
    const newGroup: ShortcutGroup = {
      id: generateId(),
      name,
      icon,
      position: shortcutGroups.length,
    };
    const newGroups = [...shortcutGroups, newGroup];
    set({ shortcutGroups: newGroups });
    saveData();
    debouncedSync({ shortcuts, groups: newGroups, settings });
  },

  updateGroup: (id, updates) => {
    const { shortcuts, shortcutGroups, settings, saveData } = get();
    const newGroups = shortcutGroups.map((g) => (g.id === id ? { ...g, ...updates } : g));
    set({ shortcutGroups: newGroups });
    saveData();
    debouncedSync({ shortcuts, groups: newGroups, settings });
  },

  removeGroup: (id) => {
    const { shortcutGroups, shortcuts, activeGroupId, settings, saveData } = get();
    const updatedShortcuts = shortcuts.map((s) =>
      s.groupId === id ? { ...s, groupId: undefined } : s
    );
    const filtered = shortcutGroups.filter((g) => g.id !== id);
    set({
      shortcutGroups: filtered,
      shortcuts: updatedShortcuts,
      activeGroupId: activeGroupId === id ? null : activeGroupId,
    });
    saveData();
    debouncedSync({ shortcuts: updatedShortcuts, groups: filtered, settings });
  },
  
  getFilteredShortcuts: () => {
    const { shortcuts, activeGroupId } = get();
    if (activeGroupId === null) {
      return shortcuts; // 显示全部
    }
    return shortcuts.filter((s) => s.groupId === activeGroupId);
  },
}));
