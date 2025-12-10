/**
 * NewTab 类型定义
 */

// 快捷方式分组
export interface ShortcutGroup {
  id: string;
  name: string;
  icon: string; // Lucide 图标名称
  position: number;
}

// 快捷方式
export interface Shortcut {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  position: number;
  createdAt: number;
  clickCount: number;
  groupId?: string; // 所属分组 ID，undefined 表示默认分组
}

// 壁纸类型
export type WallpaperType = 'color' | 'image' | 'bing' | 'unsplash';

// 壁纸配置
export interface WallpaperConfig {
  type: WallpaperType;
  value: string; // 颜色值或图片 URL
  blur: number;
  brightness: number;
}

// 搜索引擎
export type SearchEngine = 'google' | 'bing' | 'baidu' | 'duckduckgo' | 'sogou' | 'zhihu' | 'bilibili' | 'github';

// 搜索引擎配置
export interface SearchEngineConfig {
  id: SearchEngine;
  name: string;
  url: string;
  icon: string;
}

// 时钟格式
export type ClockFormat = '12h' | '24h';

// NewTab 设置
export interface NewTabSettings {
  // 时钟
  showClock: boolean;
  clockFormat: ClockFormat;
  showDate: boolean;
  showSeconds: boolean;
  
  // 搜索
  showSearch: boolean;
  searchEngine: SearchEngine;
  
  // 快捷方式
  showShortcuts: boolean;
  shortcutColumns: 4 | 6 | 8;
  shortcutStyle: 'icon' | 'card';
  
  // 壁纸
  wallpaper: WallpaperConfig;
  
  // TMarks 同步
  showPinnedBookmarks: boolean;
  enableSearchSuggestions: boolean;

  // 问候语
  showGreeting: boolean;
  userName: string;

  // 农历
  showLunar: boolean;

  // 天气
  showWeather: boolean;

  // 待办事项
  showTodo: boolean;

  // 备忘录
  showNotes: boolean;

  // 热搜
  showHotSearch: boolean;
  hotSearchType: HotSearchType;

  // 每日诗词
  showPoetry: boolean;
}

// NewTab 存储数据
export interface NewTabStorage {
  shortcuts: Shortcut[];
  shortcutGroups: ShortcutGroup[];
  activeGroupId: string | null; // 当前激活的分组，null 表示全部
  settings: NewTabSettings;
  tmarksSyncedAt?: number;
}

// 搜索结果
export interface SearchResult {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  source: 'shortcut' | 'bookmark';
}

// TMarks 书签（用于同步）
export interface TMarksBookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  is_pinned?: boolean;
}

// 同步状态
export interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number | null;
  error: string | null;
}

// 待办事项
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

// 天气数据
export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  city: string;
  updatedAt: number;
}

// 备忘录
export interface NoteData {
  content: string;
  updatedAt: number;
}

// 热搜项
export interface HotSearchItem {
  title: string;
  hot: number | string;
  url: string;
}

// 热搜类型
export type HotSearchType = 'baidu' | 'weibo' | 'zhihu' | 'bilibili';

// 诗词
export interface Poetry {
  content: string;
  author: string;
  title: string;
}
