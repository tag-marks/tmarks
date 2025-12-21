import { cacheManager } from '@/lib/services/cache-manager';
import { tagRecommender } from '@/lib/services/tag-recommender';
import { bookmarkService } from '@/lib/services/bookmark-service';
import { bookmarkAPI } from '@/lib/services/bookmark-api';
import { syncPendingTabGroups } from '@/lib/services/tab-collection';
import { StorageService } from '@/lib/utils/storage';
import { callAI } from '@/lib/services/ai-client';
import { NEWTAB_FOLDER_PROMPT_TEMPLATE, NEWTAB_WORKSPACE_ORGANIZE_PROMPT_TEMPLATE } from '@/lib/constants/newtabPrompts';
import { STORAGE_KEY } from '@/newtab/constants';
import type { Shortcut } from '@/newtab/types';
import type { Message, MessageResponse } from '@/types';

async function reportAiOrganizeProgress(payload: {
  sessionId: string;
  level: 'info' | 'success' | 'warn' | 'error';
  step: string;
  message: string;
  detail?: any;
}) {
  try {
    await chrome.runtime.sendMessage({
      type: 'AI_ORGANIZE_PROGRESS',
      payload: {
        ...payload,
        ts: Date.now(),
      },
    });
  } catch {
    // ignore
  }
}

/**
 * Background service worker for Chrome Extension
 */

async function getBookmarksBarRootId(): Promise<string | null> {
  try {
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
}

const TMARKS_ROOT_TITLE = 'TMarks';
const TMARKS_STORAGE_KEY_ROOT_ID = 'tmarks_root_bookmark_id';
const HISTORY_MAX_RESULTS = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TOP_HISTORY_LIMIT = 20;
const ROOT_PATH_PLACEHOLDER = '[ROOT]';

/**
 * 获取已保存的 TMarks 根文件夹 ID
 */
async function getSavedNewtabRootFolderId(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(TMARKS_STORAGE_KEY_ROOT_ID);
    const savedId = result[TMARKS_STORAGE_KEY_ROOT_ID];
    return typeof savedId === 'string' ? savedId : null;
  } catch {
    return null;
  }
}

/**
 * 保存 TMarks 根文件夹 ID
 */
async function saveNewtabRootFolderId(id: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [TMARKS_STORAGE_KEY_ROOT_ID]: id });
  } catch {
    // ignore
  }
}

/**
 * 检查书签文件夹是否存在（通过 ID）
 */
async function checkNewtabFolderExists(folderId: string): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
  try {
    const nodes = await chrome.bookmarks.get(folderId);
    const node = nodes?.[0];
    // 确保是文件夹（没有 url）
    if (node && !node.url) {
      return node;
    }
    return null;
  } catch {
    return null;
  }
}

interface EnsureNewtabRootFolderResult {
  id: string;
  wasRecreated: boolean;
}

/**
 * 确保 TMarks 根文件夹存在
 * - 优先通过已保存的 ID 查找（即使被改名也能识别）
 * - 如果 ID 对应的文件夹被删除，则重新创建并返回 wasRecreated = true
 * - 如果是首次使用，尝试查找名为 TMarks 的文件夹，否则创建新的
 */
async function ensureNewtabRootFolder(): Promise<EnsureNewtabRootFolderResult | null> {
  try {
    const barId = await getBookmarksBarRootId();
    if (!barId) return null;

    // 1. 尝试通过已保存的 ID 查找
    const savedId = await getSavedNewtabRootFolderId();
    if (savedId) {
      const existingNode = await checkNewtabFolderExists(savedId);
      if (existingNode) {
        // 文件夹存在（即使被改名了也能通过 ID 找到）
        return { id: savedId, wasRecreated: false };
      }
      // 文件夹被删除了，需要重新创建
      console.log('[TMarks Background] 根文件夹被删除，正在重新创建...');
    }

    // 2. 如果没有保存的 ID 或文件夹被删除，尝试按名称查找（兼容旧版本）
    const barChildren = await chrome.bookmarks.getChildren(barId);
    
    // 尝试查找名为 TMarks 的文件夹
    const existingByName = barChildren.find((c) => !c.url && c.title === TMARKS_ROOT_TITLE);
    if (existingByName) {
      await saveNewtabRootFolderId(existingByName.id);
      return { id: existingByName.id, wasRecreated: false };
    }

    // 兼容旧版本：查找旧名称的文件夹并重命名
    const OLD_ROOT_TITLE = 'AI 书签助手 NewTab';
    const existingOld = barChildren.find((c) => !c.url && c.title === OLD_ROOT_TITLE);
    if (existingOld) {
      try {
        await chrome.bookmarks.update(existingOld.id, { title: TMARKS_ROOT_TITLE });
      } catch {
        // ignore
      }
      await saveNewtabRootFolderId(existingOld.id);
      return { id: existingOld.id, wasRecreated: false };
    }

    // 3. 创建新的根文件夹
    const createdRoot = await chrome.bookmarks.create({ parentId: barId, title: TMARKS_ROOT_TITLE });
    await saveNewtabRootFolderId(createdRoot.id);

    // 判断是首次创建还是重建
    const wasRecreated = savedId !== null;
    if (wasRecreated) {
      console.log('[TMarks Background] 根文件夹已重新创建，ID:', createdRoot.id);
    } else {
      console.log('[TMarks Background] 根文件夹已创建，ID:', createdRoot.id);
    }

    return { id: createdRoot.id, wasRecreated };
  } catch {
    return null;
  }
}

async function copyBookmarkTreeToFolder(opts: {
  sourceRoot: chrome.bookmarks.BookmarkTreeNode;
  targetParentId: string;
  skipSourceId?: string;
}) {
  const stack: Array<{ children: chrome.bookmarks.BookmarkTreeNode[]; index: number; targetParentId: string }>= [];
  const counts = { folders: 0, bookmarks: 0 };

  const pushChildren = (children: chrome.bookmarks.BookmarkTreeNode[] | undefined, targetParentId: string) => {
    if (!children || children.length === 0) return;
    stack.push({ children, index: 0, targetParentId });
  };

  pushChildren(opts.sourceRoot.children, opts.targetParentId);

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    if (frame.index >= frame.children.length) {
      stack.pop();
      continue;
    }

    const node = frame.children[frame.index];
    const nodeIndex = frame.index;
    frame.index += 1;

    if (opts.skipSourceId && node.id === opts.skipSourceId) {
      continue;
    }
    if (!node.url && node.title === TMARKS_ROOT_TITLE) {
      continue;
    }

    if (node.url) {
      await chrome.bookmarks.create({
        parentId: frame.targetParentId,
        index: nodeIndex,
        title: node.title || node.url,
        url: node.url,
      });
      counts.bookmarks += 1;
      continue;
    }

    const createdFolder = await chrome.bookmarks.create({
      parentId: frame.targetParentId,
      index: nodeIndex,
      title: node.title || '文件夹',
    });
    counts.folders += 1;
    pushChildren(node.children, createdFolder.id);
  }

  return counts;
}

async function importAllBookmarksToNewtab(newtabRootId: string) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const folderTitle = `Imported ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const importFolder = await chrome.bookmarks.create({ parentId: newtabRootId, title: folderTitle });

  const tree = await chrome.bookmarks.getTree();
  const sourceRoot = tree?.[0];
  if (!sourceRoot) {
    throw new Error('Bookmarks root not found');
  }

  const counts = await copyBookmarkTreeToFolder({
    sourceRoot,
    targetParentId: importFolder.id,
    skipSourceId: newtabRootId,
  });

  return { importFolderId: importFolder.id, folderTitle, counts };
}

function safeParseJson(text: string): any {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  const tryParse = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  const normalizeJsonText = (s: string) => {
    const t = (s || '').trim();
    if (!t) return '';
    return t.replace(/,\s*([}\]])/g, '$1');
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    const fenced = tryParse(normalizeJsonText(fenceMatch[1]));
    if (fenced) return fenced;
  }

  const objStart = trimmed.indexOf('{');
  const objEnd = trimmed.lastIndexOf('}');
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    const obj = tryParse(normalizeJsonText(trimmed.slice(objStart, objEnd + 1)));
    if (obj) return obj;
  }

  const arrStart = trimmed.indexOf('[');
  const arrEnd = trimmed.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    const arr = tryParse(normalizeJsonText(trimmed.slice(arrStart, arrEnd + 1)));
    if (arr) return arr;
  }

  const keyMatch = trimmed.match(/"domainMoves"|"domain_moves"/);
  if (keyMatch?.index !== undefined) {
    const start = trimmed.lastIndexOf('{', keyMatch.index);
    if (start !== -1) {
      const slice = trimmed.slice(start);
      const sliceNormalized = normalizeJsonText(slice);

      const candidates: string[] = [];
      candidates.push(sliceNormalized);

      const lastBrace = sliceNormalized.lastIndexOf('}');
      if (lastBrace !== -1) {
        const toLastBrace = sliceNormalized.slice(0, lastBrace + 1);
        candidates.push(toLastBrace);

        const keyIndex = toLastBrace.search(/"domainMoves"|"domain_moves"/);
        if (keyIndex !== -1) {
          const arrOpen = toLastBrace.indexOf('[', keyIndex);
          const arrClose = toLastBrace.lastIndexOf(']');
          if (arrOpen !== -1 && arrClose < arrOpen) {
            candidates.push(`${toLastBrace}]}`);
          }
        }
      }

      for (const c of candidates) {
        const parsed = tryParse(c);
        if (parsed) return parsed;
      }
    }
  }

  return null;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname || '';
  } catch {
    return '';
  }
}

async function ensureFolderPath(rootId: string, path: string, cache: Map<string, string>): Promise<string> {
  const normalized = (path || '').split('/').map((s) => s.trim()).filter(Boolean).join('/');
  if (!normalized) return rootId;
  const existing = cache.get(normalized);
  if (existing) return existing;

  const parts = normalized.split('/');
  let currentId = rootId;
  let currentPath = '';
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const cachedId = cache.get(currentPath);
    if (cachedId) {
      currentId = cachedId;
      continue;
    }

    const children = await chrome.bookmarks.getChildren(currentId);
    const found = children.find((c) => !c.url && c.title === part);
    if (found) {
      cache.set(currentPath, found.id);
      currentId = found.id;
      continue;
    }

    const created = await chrome.bookmarks.create({ parentId: currentId, title: part });
    cache.set(currentPath, created.id);
    currentId = created.id;
  }

  return currentId;
}

function sanitizeAiOrganizePath(path: string): string {
  const parts = (path || '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  return parts.slice(0, 2).join('/');
}

type CollectedBookmark = {
  id: string;
  title: string;
  url: string;
  domain: string;
  path: string;
};

async function collectAllBrowserBookmarks(skipRootId?: string): Promise<CollectedBookmark[]> {
  const tree = await chrome.bookmarks.getTree();
  const sourceRoot = tree?.[0];
  const items: CollectedBookmark[] = [];

  if (!sourceRoot) return items;

  const stack: Array<{ node: chrome.bookmarks.BookmarkTreeNode; path: string; parentPath: string }> = [
    { node: sourceRoot, path: '', parentPath: '' },
  ];
  while (stack.length > 0) {
    const { node, path, parentPath } = stack.pop()!;

    if (skipRootId && node.id === skipRootId) {
      continue;
    }

    if (node.url) {
      const url = node.url || '';
      const folderPath = parentPath || ROOT_PATH_PLACEHOLDER;
      items.push({
        id: node.id,
        title: node.title || url,
        url,
        domain: getHostname(url),
        path: folderPath,
      });
      continue;
    }

    const children = node.children || [];
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      const childTitle = (child.title || '').trim() || '未命名';
      const isFolder = !child.url;
      const childPath = isFolder ? (path ? `${path}/${childTitle}` : childTitle) : path;
      stack.push({
        node: child,
        path: childPath,
        parentPath: path,
      });
    }
  }

  return items;
}

function clampHistoryDays(value: number): number {
  if (!Number.isFinite(value)) {
    return 30;
  }
  const rounded = Math.round(value);
  return Math.max(1, Math.min(90, rounded));
}

function clampHistoryTopN(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TOP_HISTORY_LIMIT;
  }
  const rounded = Math.round(value);
  return Math.max(5, Math.min(100, rounded));
}

function clampTopLevelCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 5;
  }
  const rounded = Math.round(value);
  return Math.max(3, Math.min(7, rounded));
}

async function loadNewtabShortcuts(): Promise<Shortcut[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const data = result?.[STORAGE_KEY];
    if (data && typeof data === 'object' && Array.isArray((data as any).shortcuts)) {
      return (data as any).shortcuts as Shortcut[];
    }
    return [];
  } catch {
    return [];
  }
}

type ShortcutDomainStat = { clickCount: number; shortcutCount: number };

type DomainBookmarkItem = {
  id: string;
  title: string;
  url: string;
  path: string;
};

function aggregateShortcutStats(shortcuts: Shortcut[]): Map<string, ShortcutDomainStat> {
  const map = new Map<string, ShortcutDomainStat>();
  for (const shortcut of shortcuts || []) {
    if (!shortcut?.url) continue;
    const domain = getHostname(shortcut.url) || '(no-domain)';
    const next = map.get(domain) || { clickCount: 0, shortcutCount: 0 };
    next.shortcutCount += 1;
    next.clickCount += typeof shortcut.clickCount === 'number' ? shortcut.clickCount : 0;
    map.set(domain, next);
  }
  return map;
}

type DomainHistoryStat = { count: number; lastVisitTime: number };

async function collectDomainHistoryStats(days: number): Promise<{
  domains: Map<string, DomainHistoryStat>;
  totalItems: number;
  truncated: boolean;
}> {
  if (!chrome.history || typeof chrome.history.search !== 'function') {
    throw new Error('History API unavailable');
  }
  const startTime = Date.now() - days * DAY_MS;
  const results = await chrome.history.search({
    text: '',
    startTime,
    maxResults: HISTORY_MAX_RESULTS,
  });
  const domains = new Map<string, DomainHistoryStat>();
  for (const item of results) {
    if (!item?.url) continue;
    const domain = getHostname(item.url) || '(no-domain)';
    const stat = domains.get(domain) || { count: 0, lastVisitTime: 0 };
    stat.count += 1;
    if (typeof item.lastVisitTime === 'number' && item.lastVisitTime > stat.lastVisitTime) {
      stat.lastVisitTime = item.lastVisitTime;
    }
    domains.set(domain, stat);
  }
  return {
    domains,
    totalItems: results.length,
    truncated: results.length >= HISTORY_MAX_RESULTS,
  };
}

// Preload AI context
tagRecommender.preloadContext().catch(() => {
  // Silently fail - AI features will work on-demand
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First time install - maybe show welcome page
  } else if (details.reason === 'update') {
    // Extension updated
  }
});

// Auto-sync cache periodically
function getMsUntilNextDailySync(): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(23, 0, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

async function runAutoSync() {
  try {
    const config = await StorageService.loadConfig();
    if (!config.preferences.autoSync) {
      return;
    }
    await cacheManager.autoSync(config.preferences.syncInterval);
  } catch (error) {
    // Silently fail - will retry on next schedule
  }
}

async function startAutoSync() {
  const scheduleNext = () => {
    const delay = getMsUntilNextDailySync();

    setTimeout(async () => {
      await runAutoSync();
      scheduleNext();
    }, delay);
  };

  scheduleNext();
}

// Start auto-sync
startAutoSync().catch(() => {});

// Sync pending bookmarks on startup
bookmarkService.syncPendingBookmarks().catch(() => {});

// Sync pending tab groups on startup
(async () => {
  try {
    const config = await StorageService.loadConfig();
    if (config.bookmarkSite.apiKey) {
      await syncPendingTabGroups(config.bookmarkSite);
    }
  } catch (error) {
    // Silently fail
  }
})();

// 定时刷新置顶书签
async function refreshPinnedBookmarksCache() {
  try {
    console.log('[Background] 开始刷新置顶书签缓存');
    
    // 清除缓存
    await chrome.storage.local.remove('tmarks_pinned_bookmarks_cache');
    
    // 通知所有 NewTab 页面刷新
    await chrome.runtime.sendMessage({
      type: 'REFRESH_PINNED_BOOKMARKS',
      payload: { timestamp: Date.now(), source: 'scheduled' }
    }).catch(() => {
      // 如果没有页面在监听，忽略错误
    });
    
    console.log('[Background] 置顶书签缓存刷新完成');
  } catch (error) {
    console.error('[Background] 刷新置顶书签缓存失败:', error);
  }
}

// 计算到下次刷新的毫秒数
function getMsUntilNextRefresh(refreshTime: 'morning' | 'evening'): number {
  const now = new Date();
  const target = new Date(now);
  
  // 设置目标时间
  if (refreshTime === 'morning') {
    target.setHours(8, 0, 0, 0); // 早上 8:00
  } else {
    target.setHours(22, 0, 0, 0); // 晚上 22:00
  }
  
  // 如果目标时间已过，设置为明天
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
}

// 启动定时刷新
async function startPinnedBookmarksAutoRefresh() {
  const scheduleNext = async () => {
    try {
      // 读取 NewTab 设置
      const result = await chrome.storage.local.get('newtab');
      const newtabData = result.newtab as any;
      
      if (!newtabData?.settings?.autoRefreshPinnedBookmarks) {
        // 如果未启用自动刷新，1小时后再检查
        setTimeout(scheduleNext, 60 * 60 * 1000);
        return;
      }
      
      const refreshTime = newtabData.settings.pinnedBookmarksRefreshTime || 'morning';
      const delay = getMsUntilNextRefresh(refreshTime);
      
      console.log(`[Background] 下次置顶书签刷新时间: ${refreshTime === 'morning' ? '早上 8:00' : '晚上 22:00'}, 距离: ${Math.round(delay / 1000 / 60)} 分钟`);
      
      setTimeout(async () => {
        await refreshPinnedBookmarksCache();
        scheduleNext();
      }, delay);
    } catch (error) {
      // 出错后1小时重试
      setTimeout(scheduleNext, 60 * 60 * 1000);
    }
  };
  
  scheduleNext();
}

// 启动定时刷新
startPinnedBookmarksAutoRefresh().catch(() => {});

console.log('[BG] init', {
  runtimeId: chrome.runtime.id,
  loadedAt: new Date().toISOString(),
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    try {
      console.log('[BG] onMessage', {
        runtimeId: chrome.runtime.id,
        senderId: sender?.id,
        senderUrl: sender?.url,
        rawType: (message as any)?.type,
      });
    } catch {
      // ignore
    }

    // Handle async operations
    handleMessage(message, sender)
      .then(response => sendResponse(response))
      .catch(error => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });

    // Return true to indicate async response
    return true;
  }
);

/**
 * Handle messages from popup/content scripts
 */
async function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  const type = String((message as any)?.type ?? '')
    .trim()
    .toUpperCase();

  switch (type) {
    case 'AI_ORGANIZE_PROGRESS': {
      return { success: true, data: {} };
    }

    case 'EXTRACT_PAGE_INFO': {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

      // 检查URL是否可访问（排除chrome://等特殊页面）
      const url = tab.url || '';
      if (url.startsWith('chrome://') || 
          url.startsWith('chrome-extension://') || 
          url.startsWith('edge://') ||
          url.startsWith('about:') ||
          !url) {
        return {
          success: true,
          data: {
            title: tab.title || 'Untitled',
            url: url,
            description: '',
            content: '',
            thumbnail: ''
          }
        };
      }

      // 辅助函数：带超时的消息发送
      const sendMessageWithTimeout = async (tabId: number, msg: Message, timeoutMs: number = 3000): Promise<MessageResponse> => {
        return Promise.race([
          chrome.tabs.sendMessage(tabId, msg),
          new Promise<MessageResponse>((_, reject) => 
            setTimeout(() => reject(new Error('Message timeout')), timeoutMs)
          )
        ]);
      };

      // 辅助函数：获取基本页面信息作为fallback
      const getBasicPageInfo = async (tabId: number) => {
        try {
          const currentTab = await chrome.tabs.get(tabId);
          return {
            success: true,
            data: {
              title: currentTab.title || 'Untitled',
              url: currentTab.url || '',
              description: '',
              content: '',
              thumbnail: ''
            }
          };
        } catch (error) {
          return {
            success: true,
            data: {
              title: 'Untitled',
              url: url,
              description: '',
              content: '',
              thumbnail: ''
            }
          };
        }
      };

      // 步骤1: 检测content script是否存活
      let isContentScriptAlive = false;
      try {
        await sendMessageWithTimeout(tab.id, { type: 'PING' }, 1000);
        isContentScriptAlive = true;
      } catch (pingError) {
        // Content script not responding, will try to inject
      }

      // 步骤2: 如果content script不存在，尝试注入
      if (!isContentScriptAlive) {
        try {
          // 获取manifest中的content script配置
          const manifest = chrome.runtime.getManifest();
          const contentScripts = manifest.content_scripts?.[0];
          
          if (!contentScripts || !contentScripts.js || contentScripts.js.length === 0) {
            return await getBasicPageInfo(tab.id);
          }

          const scriptPath = contentScripts.js[0];
          
          // 注入content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [scriptPath]
          });

          // 等待脚本初始化，并验证注入是否成功
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // 验证注入是否成功
          try {
            await sendMessageWithTimeout(tab.id, { type: 'PING' }, 1000);
            isContentScriptAlive = true;
          } catch (verifyError) {
            return await getBasicPageInfo(tab.id);
          }
        } catch (injectError) {
          return await getBasicPageInfo(tab.id);
        }
      }

      // 步骤3: 发送实际的提取请求
      if (isContentScriptAlive) {
        try {
          const response = await sendMessageWithTimeout(tab.id, message, 5000);
          
          // 验证响应数据的完整性
          if (response.success && response.data) {
            return response;
          } else {
            return await getBasicPageInfo(tab.id);
          }
        } catch (extractError) {
          return await getBasicPageInfo(tab.id);
        }
      }

      // 步骤4: 最终fallback
      return await getBasicPageInfo(tab.id);
    }

    case 'RECOMMEND_TAGS': {
      const pageInfo = message.payload;
      const result = await tagRecommender.recommendTags(pageInfo);

      return {
        success: true,
        data: result
      };
    }

    case 'SAVE_BOOKMARK': {
      try {
        const bookmark = message.payload;
        const result = await bookmarkService.saveBookmark(bookmark);

        return {
          success: true,
          data: result
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save bookmark'
        };
      }
    }

    case 'AI_ORGANIZE_NEWTAB_WORKSPACE': {
      try {
        const payload = (message.payload || {}) as {
          rules?: string;
          maxBookmarks?: number;
          promptTemplate?: string;
          sessionId?: string;
          enableHistoryHeat?: boolean;
          historyDays?: number;
          historyHeatTopN?: number;
          strictHierarchy?: boolean;
          allowNewFolders?: boolean;
          preferOriginalPaths?: boolean;
          verboseLogs?: boolean;
          topLevelCount?: number;
        };
        const sessionId = typeof payload.sessionId === 'string' && payload.sessionId.trim()
          ? payload.sessionId.trim()
          : String(Date.now());
        const rules = typeof payload.rules === 'string' ? payload.rules : '';
        const domainBatchSize = Math.min(2000, Math.max(50, Number(payload.maxBookmarks ?? 300)));
        const customPromptTemplate = typeof payload.promptTemplate === 'string' ? payload.promptTemplate.trim() : '';
        const enableHistoryHeat = Boolean(payload.enableHistoryHeat);
        const historyDays = clampHistoryDays(Number(payload.historyDays ?? 30));
        const topHistoryLimit = clampHistoryTopN(Number(payload.historyHeatTopN ?? DEFAULT_TOP_HISTORY_LIMIT));
        const strictHierarchy = Boolean(payload.strictHierarchy);
        const allowNewFolders = strictHierarchy ? false : payload.allowNewFolders !== false;
        const preferOriginalPaths = payload.preferOriginalPaths !== false;
        const verboseLogs = payload.verboseLogs !== false;
        const requestedTopLevelCount = clampTopLevelCount(Number(payload.topLevelCount ?? 5));
        let truncatedDomains = false;

        const sendProgress = async (
          progress: Parameters<typeof reportAiOrganizeProgress>[0],
          options?: { verbose?: boolean },
        ) => {
          const level = progress.level ?? 'info';
          const shouldBeVerbose = options?.verbose ?? (level === 'info');
          if (!verboseLogs && shouldBeVerbose) {
            return;
          }
          await reportAiOrganizeProgress(progress);
        };

        await sendProgress({
          sessionId,
          level: 'info',
          step: 'start',
          message: '开始 AI 整理：准备读取书签与配置',
        }, { verbose: false });

        const newtabRootResult = await ensureNewtabRootFolder();
        if (!newtabRootResult) {
          throw new Error('NewTab root folder not found');
        }
        const newtabRootId = newtabRootResult.id;

        await sendProgress({
          sessionId,
          level: 'info',
          step: 'root',
          message: `已定位工作区根目录: ${newtabRootId}`,
        });

        const sourceBookmarks = await collectAllBrowserBookmarks(newtabRootId);
        if (sourceBookmarks.length === 0) {
          await sendProgress({
            sessionId,
            level: 'warn',
            step: 'collect',
            message: '浏览器没有可整理的书签',
          });
          return {
            success: true,
            data: {
              total: 0,
              processed: 0,
              truncated: truncatedDomains,
              moved: 0,
              createdFolders: 0,
              createdBookmarks: 0,
              message: '浏览器没有可整理的书签',
            },
          };
        }

        const shortcuts = await loadNewtabShortcuts();
        const shortcutStats = aggregateShortcutStats(shortcuts);

        await sendProgress({
          sessionId,
          level: 'info',
          step: 'usage',
          message: `已加载快捷方式: ${shortcuts.length} 个`,
        });

        let historyStats: Map<string, DomainHistoryStat> | null = null;
        if (enableHistoryHeat) {
          if (!chrome.history || typeof chrome.history.search !== 'function') {
            await sendProgress({
              sessionId,
              level: 'warn',
              step: 'history',
              message: '历史记录 API 不可用，跳过热度统计',
            });
          } else {
            try {
              await sendProgress({
                sessionId,
                level: 'info',
                step: 'history',
                message: `读取浏览历史：最近 ${historyDays} 天`,
              });
              const historyResult = await collectDomainHistoryStats(historyDays);
              historyStats = historyResult.domains;
              await sendProgress({
                sessionId,
                level: 'info',
                step: 'history',
                message: `历史记录: ${historyResult.totalItems} 条，覆盖 ${historyStats.size} 个域名${historyResult.truncated ? '（部分截断）' : ''}`,
              });
            } catch (error) {
              await sendProgress({
                sessionId,
                level: 'warn',
                step: 'history',
                message: `历史记录读取失败：${error instanceof Error ? error.message : '未知错误'}，继续使用书签数据`,
              });
            }
          }
        }

        const domainToItems = new Map<string, DomainBookmarkItem[]>();
        for (const b of sourceBookmarks) {
          const domainKey = b.domain || '(no-domain)';
          const list = domainToItems.get(domainKey) || [];
          list.push({ id: b.id, title: b.title, url: b.url, path: b.path });
          domainToItems.set(domainKey, list);
        }

        const folderPathCounts = new Map<string, number>();
        for (const bookmark of sourceBookmarks) {
          const folderPath = bookmark.path || ROOT_PATH_PLACEHOLDER;
          if (!folderPath) continue;
          folderPathCounts.set(folderPath, (folderPathCounts.get(folderPath) ?? 0) + 1);
        }

        const folderPaths = Array.from(folderPathCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 500)
          .map(([path, count]) => ({ path, count }));

        const domainPreferredPathMap = new Map<string, string>();

        await reportAiOrganizeProgress({
          sessionId,
          level: 'info',
          step: 'collect',
          message: `已读取书签: ${sourceBookmarks.length} 个；域名: ${domainToItems.size} 个`,
        });

        const allDomainSummaries = Array.from(domainToItems.entries()).map(([domain, list]) => {
          const domainKey = domain || '(no-domain)';
          const shortcutStat = shortcutStats.get(domainKey) || { clickCount: 0, shortcutCount: 0 };
          const historyStat = historyStats?.get(domainKey);
          const historyCount = historyStat?.count ?? 0;
          const historyLastVisit = historyStat?.lastVisitTime ?? null;
          const recencyScore = historyLastVisit
            ? Math.max(0, Math.min(1, 1 - Math.min((Date.now() - historyLastVisit) / DAY_MS, historyDays) / historyDays))
            : 0;
          const bookmarkCount = list.length;
          const clickCount = shortcutStat.clickCount;
          const heatScoreRaw =
            bookmarkCount * 1 +
            clickCount * 0.5 +
            historyCount * 0.3 +
            recencyScore * 2;
          const heatScore = Number(heatScoreRaw.toFixed(3));
          const pathCountMap = new Map<string, number>();
          for (const item of list) {
            const normalizedPath = item.path || ROOT_PATH_PLACEHOLDER;
            pathCountMap.set(normalizedPath, (pathCountMap.get(normalizedPath) ?? 0) + 1);
          }
          const sortedPathCounts = Array.from(pathCountMap.entries()).sort((a, b) => b[1] - a[1]);
          const topPathCounts = sortedPathCounts.slice(0, 5).map(([path, count]) => ({ path, count }));
          if (topPathCounts.length > 0) {
            domainPreferredPathMap.set(domainKey, topPathCounts[0].path);
          }

          return {
            domain: domainKey,
            count: bookmarkCount,
            bookmarkCount,
            shortcutCount: shortcutStat.shortcutCount,
            clickCount,
            historyCount,
            historyLastVisit,
            historyLastVisitISO: historyLastVisit ? new Date(historyLastVisit).toISOString() : null,
            recencyScore: Number(recencyScore.toFixed(3)),
            heatScore,
            samples: list.slice(0, 3).map((x) => ({ title: x.title, url: x.url, path: x.path })),
            originalPaths: topPathCounts,
          };
        });

        const sortedDomainSummaries = allDomainSummaries.sort((a, b) => {
          if ((b.heatScore ?? 0) !== (a.heatScore ?? 0)) {
            return (b.heatScore ?? 0) - (a.heatScore ?? 0);
          }
          return (b.bookmarkCount ?? b.count ?? 0) - (a.bookmarkCount ?? a.count ?? 0);
        });

        const topHistoryDomains = sortedDomainSummaries.slice(0, Math.min(topHistoryLimit, sortedDomainSummaries.length));

        const domainSummaryBatches: typeof sortedDomainSummaries[] = [];
        for (let i = 0; i < sortedDomainSummaries.length; i += domainBatchSize) {
          domainSummaryBatches.push(sortedDomainSummaries.slice(i, i + domainBatchSize));
        }

        const domainSummariesPayload = {
          totalDomains: sortedDomainSummaries.length,
          totalBatches: domainSummaryBatches.length || 1,
          batchSize: domainBatchSize,
          truncated: false,
          topHistoryLimit,
          topHistoryDomains,
          folderPaths,
          strictHierarchy,
          allowNewFolders,
          preferOriginalPaths,
          batches: (domainSummaryBatches.length ? domainSummaryBatches : [sortedDomainSummaries]).map((domains, index, arr) => ({
            batchIndex: index + 1,
            totalBatches: arr.length,
            waitForMoreBatches: index + 1 < arr.length,
            isFinalBatch: index + 1 === arr.length,
            domains,
          })),
          allBatchesProvided: true,
        };

        await reportAiOrganizeProgress({
          sessionId,
          level: 'info',
          step: 'summarize',
          message: `已生成域名汇总: ${domainSummariesPayload.totalDomains} 个，批次数 ${domainSummariesPayload.totalBatches}（每批 ${domainSummariesPayload.batchSize} 个），历史优先 Top ${topHistoryLimit}`,
        });

        if (domainSummariesPayload.totalBatches > 1) {
          await reportAiOrganizeProgress({
            sessionId,
            level: 'info',
            step: 'summarize',
            message: `域名已按每批 ${domainSummariesPayload.batchSize} 个拆分。AI 将在收到所有批次（isFinalBatch=true 且 allBatchesProvided=true）后再输出结果。`,
          });
        }

        const config = await StorageService.loadConfig();
        const apiKey = config.aiConfig.apiKeys[config.aiConfig.provider];
        if (!apiKey) {
          await reportAiOrganizeProgress({
            sessionId,
            level: 'error',
            step: 'config',
            message: '未配置 AI API Key',
          });
          throw new Error('未配置 AI API Key');
        }

        await reportAiOrganizeProgress({
          sessionId,
          level: 'info',
          step: 'ai_call',
          message: `准备调用 AI: ${config.aiConfig.provider}/${config.aiConfig.model}`,
        });

        const template = customPromptTemplate || NEWTAB_WORKSPACE_ORGANIZE_PROMPT_TEMPLATE;
        const prompt = template
          .split('{{rules}}').join(rules || '(无)')
          .split('{{domainSummariesJson}}').join(JSON.stringify(domainSummariesPayload))
          .split('{{topLevelCount}}').join(String(requestedTopLevelCount));

        const aiResult = await callAI({
          provider: config.aiConfig.provider as any,
          apiKey,
          model: config.aiConfig.model,
          apiUrl: config.aiConfig.apiUrls?.[config.aiConfig.provider],
          prompt,
          temperature: 0.2,
          maxTokens: 2000,
        });

        await reportAiOrganizeProgress({
          sessionId,
          level: 'success',
          step: 'ai_call',
          message: `AI 调用完成（返回长度 ${String(aiResult.content || '').length}）`,
        });

        const aiContent = aiResult.content || '';
        const parsed = safeParseJson(aiContent);
        const domainMovesRaw = Array.isArray(parsed?.domainMoves)
          ? parsed.domainMoves
          : (Array.isArray(parsed?.domain_moves) ? parsed.domain_moves : []);
        const fallbackPathRaw = typeof parsed?.fallbackPath === 'string' ? parsed.fallbackPath : '';
        const fallbackPath =
          sanitizeAiOrganizePath(fallbackPathRaw) || '其他/未分类';

        const domainMoves = domainMovesRaw
          .map((m: any) => {
            const domain = typeof m?.domain === 'string' ? m.domain : '';
            const rawPath = typeof m?.path === 'string' ? m.path : '';
            const sanitizedPath = sanitizeAiOrganizePath(rawPath) || fallbackPath;
            return { domain, path: sanitizedPath };
          })
          .filter((m: any) => m.domain && m.path);

        if (domainMoves.length === 0) {
          const rawPreview = aiContent.trim().slice(0, 1000);
          const extractedObjStart = aiContent.indexOf('{');
          const extractedObjEnd = aiContent.lastIndexOf('}');
          const extracted =
            extractedObjStart !== -1 && extractedObjEnd !== -1 && extractedObjEnd > extractedObjStart
              ? aiContent.slice(extractedObjStart, extractedObjEnd + 1).trim().slice(0, 1500)
              : '';

          console.warn('[NewTab AI Organize] AI result not parsable or empty domainMoves', {
            provider: config.aiConfig.provider,
            model: config.aiConfig.model,
            rawPreview,
            extracted,
            parsed,
          });

          await reportAiOrganizeProgress({
            sessionId,
            level: 'error',
            step: 'parse',
            message: 'AI 返回结果不可解析或为空（domainMoves 为空）',
            detail: {
              rawPreview,
              extracted,
              parsed,
            },
          });
          throw new Error('AI 返回结果不可解析或为空');
        }

        await reportAiOrganizeProgress({
          sessionId,
          level: 'success',
          step: 'parse',
          message: `已解析 AI 规划: domainMoves=${domainMoves.length}，fallbackPath=${fallbackPath}`,
        });

        const domainToPath = new Map<string, string>();
        for (const dm of domainMoves) {
          domainToPath.set(dm.domain, dm.path);
        }

        const rootChildren = await chrome.bookmarks.getChildren(newtabRootId);
        let removedNodes = 0;
        const HOME_FOLDER_TITLE = 'NewTab Home';
        
        for (const child of rootChildren) {
          // 保留 NewTab Home 文件夹，避免影响 NewTab 同步
          if (!child.url && child.title === HOME_FOLDER_TITLE) {
            console.log('[TMarks AI Organize] 保留 NewTab Home 文件夹');
            continue;
          }
          await chrome.bookmarks.removeTree(child.id);
          removedNodes += 1;
        }

        await reportAiOrganizeProgress({
          sessionId,
          level: 'info',
          step: 'cleanup',
          message: `已清空工作区：移除旧目录/书签 ${removedNodes} 个`,
        });

        const folderCache = new Map<string, string>();
        let createdFolders = 0;
        const folderSet = new Set<string>();
        for (const [domainKey] of domainToItems.entries()) {
          const key = domainKey ? domainKey : '(no-domain)';
          const path = domainToPath.get(key) || fallbackPath;
          if (path) folderSet.add(path);
          if (key === '(no-domain)' && !domainToPath.has(key)) {
            // ensure fallback exists
            folderSet.add(fallbackPath);
          }
        }

        for (const folderPath of folderSet) {
          const before = folderCache.size;
          await ensureFolderPath(newtabRootId, folderPath, folderCache);
          const after = folderCache.size;
          if (after > before) {
            createdFolders += after - before;
          }
        }

        await reportAiOrganizeProgress({
          sessionId,
          level: 'info',
          step: 'folders',
          message: `目录准备完成：新建目录 ${createdFolders} 个`,
        });

        let createdBookmarks = 0;
        for (const b of sourceBookmarks) {
          const domainKey = b.domain || '(no-domain)';
          const folderPath = domainToPath.get(domainKey) || fallbackPath;
          const targetParentId = await ensureFolderPath(newtabRootId, folderPath, folderCache);
          await chrome.bookmarks.create({ parentId: targetParentId, title: b.title || b.url, url: b.url });
          createdBookmarks += 1;

          if (createdBookmarks % 100 === 0) {
            await reportAiOrganizeProgress({
              sessionId,
              level: 'info',
              step: 'copy',
              message: `复制书签进度：${createdBookmarks}/${sourceBookmarks.length}`,
            });
          }
        }

        await reportAiOrganizeProgress({
          sessionId,
          level: 'success',
          step: 'done',
          message: `整理完成：创建目录 ${createdFolders} 个，复制书签 ${createdBookmarks} 个`,
        });

        return {
          success: true,
          data: {
            total: sourceBookmarks.length,
            processed: sourceBookmarks.length,
            truncated: truncatedDomains,
            moved: 0,
            createdFolders,
            createdBookmarks,
          },
        };
      } catch (error) {
        const rawMsg = error instanceof Error ? error.message : 'Failed to organize NewTab workspace bookmarks';
        const msg = (() => {
          const m = String(rawMsg || '');
          if (m.includes('429') || m.includes('rate_limit_exceeded')) {
            return 'AI 服务当前拥塞/触发限流（429）。请稍后重试，或切换到其他模型/供应商。';
          }
          return rawMsg;
        })();
        try {
          const payload = (message.payload || {}) as { sessionId?: string };
          const sessionId = typeof payload.sessionId === 'string' && payload.sessionId.trim()
            ? payload.sessionId.trim()
            : String(Date.now());
          await reportAiOrganizeProgress({
            sessionId,
            level: 'error',
            step: 'fatal',
            message: msg,
            detail: {
              rawMessage: rawMsg,
              stack: error instanceof Error ? error.stack : undefined,
            },
          });
        } catch {
          // ignore
        }
        return {
          success: false,
          error: msg,
        };
      }
    }

    case 'SAVE_TO_NEWTAB': {
      try {
        const payload = message.payload as { url: string; title?: string; parentBookmarkId?: string };
        const url = payload?.url;
        const title = payload?.title || payload?.url || 'Untitled';
        if (!url) {
          throw new Error('Missing url');
        }

        const rootResult = await ensureNewtabRootFolder();
        if (!rootResult) {
          throw new Error('NewTab root folder not found');
        }
        const rootId = rootResult.id;

        const parentId = payload.parentBookmarkId || rootId;

        const created = await chrome.bookmarks.create({ parentId, title, url });
        return {
          success: true,
          data: { id: created.id }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save to NewTab'
        };
      }
    }

    case 'IMPORT_ALL_BOOKMARKS_TO_NEWTAB': {
      try {
        const newtabRootResult = await ensureNewtabRootFolder();
        if (!newtabRootResult) {
          throw new Error('NewTab root folder not found');
        }
        const newtabRootId = newtabRootResult.id;

        const importInfo = await importAllBookmarksToNewtab(newtabRootId);

        return {
          success: true,
          data: {
            importFolderId: importInfo.importFolderId,
            folderTitle: importInfo.folderTitle,
            counts: importInfo.counts,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to import bookmarks to NewTab',
        };
      }
    }

    case 'GET_NEWTAB_FOLDER':
    case 'GET_NEWTAB_FOLDERS': {
      try {
        const rootResult = await ensureNewtabRootFolder();
        if (!rootResult) {
          throw new Error('NewTab root folder not found');
        }
        const rootId = rootResult.id;

        const rootFolder = (await chrome.bookmarks.get(rootId))?.[0];
        if (!rootFolder) {
          throw new Error('NewTab root folder not found');
        }

        type FolderNode = { id: string; title: string; parentId: string | null; path: string };
        const folders: FolderNode[] = [];

        const queue: Array<{ node: chrome.bookmarks.BookmarkTreeNode; parentId: string | null; pathPrefix: string }> = [
          { node: rootFolder, parentId: null, pathPrefix: '' },
        ];

        while (queue.length > 0 && folders.length < 200) {
          const { node, parentId, pathPrefix } = queue.shift()!;

          const currentPath = pathPrefix ? `${pathPrefix}/${node.title}` : node.title;
          folders.push({ id: node.id, title: node.title, parentId, path: currentPath });

          const children = await chrome.bookmarks.getChildren(node.id);
          const childFolders = children.filter((c) => !c.url);
          for (const child of childFolders) {
            if (folders.length + queue.length >= 200) break;
            queue.push({ node: child, parentId: node.id, pathPrefix: currentPath });
          }
        }

        return {
          success: true,
          data: { rootId: rootFolder.id, folders }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get NewTab folders'
        };
      }
    }

    case 'RECOMMEND_NEWTAB_FOLDER': {
      try {
        const page = message.payload as { title?: string; url?: string; description?: string };
        const url = page?.url;
        if (!url) {
          throw new Error('Missing url');
        }

        const config = await StorageService.loadConfig();
        if (config.preferences.enableNewtabAI === false) {
          return { success: true, data: { suggestedFolders: [] } };
        }
        const countRaw = Number(config.preferences.newtabFolderRecommendCount ?? 10);
        const recommendCount = Math.min(20, Math.max(1, Number.isFinite(countRaw) ? countRaw : 10));

        const foldersResp = await handleMessage({ type: 'GET_NEWTAB_FOLDERS' } as any, _sender);
        if (!foldersResp.success) {
          throw new Error(foldersResp.error || 'Failed to load folders');
        }
        const folderData = foldersResp.data as { rootId: string; folders: Array<{ id: string; title: string; parentId: string | null; path: string }> };

        const folderPaths = folderData.folders
          .filter((f) => f.id !== folderData.rootId)
          .map((f) => f.path)
          .slice(0, 200);

        const defaultPrompt = NEWTAB_FOLDER_PROMPT_TEMPLATE
          .split('{{title}}').join(page.title || '')
          .split('{{url}}').join(url)
          .split('{{description}}').join(page.description || '无')
          .split('{{recommendCount}}').join(String(recommendCount))
          .split('{{folderPaths}}').join(folderPaths.join('\n'));

        const customTemplate = (config.preferences.newtabFolderPrompt || '').trim();

        const prompt =
          config.preferences.enableNewtabFolderPrompt && customTemplate
            ? customTemplate
                .split('{{title}}').join(page.title || '')
                .split('{{url}}').join(url)
                .split('{{description}}').join(page.description || '无')
                .split('{{recommendCount}}').join(String(recommendCount))
                .split('{{folderPaths}}').join(folderPaths.join('\n'))
            : defaultPrompt;

        const apiKey = config.aiConfig.apiKeys[config.aiConfig.provider];
        if (!apiKey) {
          return { success: true, data: { suggestedFolders: [] } };
        }

        const aiResult = await callAI({
          provider: config.aiConfig.provider as any,
          apiKey,
          model: config.aiConfig.model,
          apiUrl: config.aiConfig.apiUrls?.[config.aiConfig.provider],
          prompt,
        });

        const aiContent = aiResult.content || '';
        const parsed = safeParseJson(aiContent) || { suggestedFolders: [] };

        const suggested = Array.isArray(parsed?.suggestedFolders) ? parsed.suggestedFolders : [];
        if (suggested.length === 0 && aiContent.trim()) {
          console.warn('[NewTab Folder Recommend] AI result not parsable or empty suggestedFolders', {
            provider: config.aiConfig.provider,
            model: config.aiConfig.model,
            rawPreview: aiContent.trim().slice(0, 1000),
            parsed,
          });
        }
        const pathToId = new Map(folderData.folders.map((f) => [f.path, f.id] as const));
        const normalized = suggested
          .map((s: any) => ({
            path: typeof s?.path === 'string' ? s.path : '',
            confidence: typeof s?.confidence === 'number' ? s.confidence : 0,
          }))
          .filter((s: any) => s.path && pathToId.has(s.path))
          .slice(0, recommendCount)
          .map((s: any) => ({
            id: pathToId.get(s.path)!,
            path: s.path,
            confidence: s.confidence,
          }));

        return {
          success: true,
          data: { suggestedFolders: normalized }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to recommend NewTab folder'
        };
      }
    }

    case 'SYNC_CACHE': {
      const result = await cacheManager.fullSync();

      return {
        success: result.success,
        data: result,
        error: result.error
      };
    }

    case 'GET_EXISTING_TAGS': {
      try {
        const tags = await bookmarkAPI.getTags();
        return {
          success: true,
          data: tags
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load tags'
        };
      }
    }

    case 'UPDATE_BOOKMARK_TAGS': {
      try {
        const { bookmarkId, tags } = message.payload;
        
        // 调用 API 更新标签
        await bookmarkAPI.updateBookmarkTags(bookmarkId, tags);

        return {
          success: true,
          data: { message: 'Tags updated successfully' }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update tags'
        };
      }
    }

    case 'UPDATE_BOOKMARK_DESCRIPTION': {
      try {
        const { bookmarkId, description } = message.payload;
        
        // 调用 API 更新描述
        await bookmarkAPI.updateBookmarkDescription(bookmarkId, description);

        return {
          success: true,
          data: { message: 'Description updated successfully' }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update description'
        };
      }
    }

    case 'REFRESH_PINNED_BOOKMARKS': {
      try {
        // 广播消息到所有 NewTab 页面，让它们刷新置顶书签
        const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('src/newtab/index.html') });
        
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'REFRESH_PINNED_BOOKMARKS',
              payload: message.payload
            }).catch(() => {
              // 忽略错误，页面可能已关闭
            });
          }
        }

        return {
          success: true,
          data: { message: 'Pinned bookmarks refresh triggered' }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to refresh pinned bookmarks'
        };
      }
    }

    case 'CREATE_SNAPSHOT': {
      try {
        const { bookmarkId, title, url } = message.payload;
        
        // Get the current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          throw new Error('No active tab found');
        }

        // Capture page using V2 method (separate images)
        let captureResult: { html: string; images: any[] };
        try {
          const capturePromise = chrome.tabs.sendMessage(tab.id, {
            type: 'CAPTURE_PAGE_V2',
            options: {
              inlineCSS: true,
              extractImages: true,
              inlineFonts: false,
              removeScripts: true,
              removeHiddenElements: false,
              maxImageSize: 100 * 1024 * 1024, // 提高到 100MB
              timeout: 30000
            }
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Capture timeout')), 35000);
          });
          
          const response = await Promise.race([capturePromise, timeoutPromise]) as any;
          
          if (response.success) {
            captureResult = response.data;
          } else {
            throw new Error(response.error || 'Capture failed');
          }
        } catch (error) {
          throw error;
        }
        
        // Prepare images for upload
        const images = captureResult.images.map((img: any) => ({
          hash: img.hash,
          data: img.data, // base64
          type: img.type,
        }));

        // Create snapshot via V2 API
        await bookmarkAPI.createSnapshotV2(bookmarkId, {
          html_content: captureResult.html,
          title,
          url,
          images,
        });

        return {
          success: true,
          data: { 
            message: 'Snapshot created successfully (V2)',
            imageCount: images.length,
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create snapshot'
        };
      }
    }

    case 'GET_CONFIG': {
      const config = await StorageService.loadConfig();

      return {
        success: true,
        data: config
      };
    }

    default:
      throw new Error(
        `Unknown message type: ${type || '(empty)'} (runtimeId=${chrome.runtime.id}, rawType=${String((message as any)?.type ?? '')})`
      );
  }
}

// Handle extension icon click (optional)
chrome.action.onClicked.addListener(async () => {
  // The popup will open automatically due to manifest.json configuration
});
