/**
 * TMarks 书签同步 Hook
 */

import { useState, useCallback } from 'react';
import { StorageService } from '@/lib/utils/storage';
import { createTMarksClient } from '@/lib/api/tmarks';
import { getTMarksUrls } from '@/lib/constants/urls';
import type { TMarksBookmark, SyncState } from '../types';

// 创建 TMarks 客户端
async function getTMarksClient() {
  const configuredUrl = await StorageService.getBookmarkSiteApiUrl();
  const apiKey = await StorageService.getBookmarkSiteApiKey();

  if (!apiKey) {
    throw new Error('API Key 未配置');
  }

  let apiBaseUrl: string;
  if (configuredUrl) {
    apiBaseUrl = configuredUrl.endsWith('/api')
      ? configuredUrl
      : getTMarksUrls(configuredUrl).API_BASE;
  } else {
    apiBaseUrl = getTMarksUrls().API_BASE;
  }

  return createTMarksClient({ apiKey, baseUrl: apiBaseUrl });
}

export function useTMarksSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: null,
    error: null,
  });
  const [pinnedBookmarks, setPinnedBookmarks] = useState<TMarksBookmark[]>([]);

  // 获取置顶书签
  const fetchPinnedBookmarks = useCallback(async () => {
    setSyncState((s) => ({ ...s, isSyncing: true, error: null }));

    try {
      const client = await getTMarksClient();
      const response = await client.bookmarks.getPinnedBookmarks({
        page_size: 20,
      });

      console.log('[TMarks] 获取置顶书签响应:', {
        total: response.data?.bookmarks?.length,
        bookmarks: response.data?.bookmarks?.map((b) => ({
          id: b.id,
          title: b.title,
          is_pinned: b.is_pinned,
        })),
      });

      if (response.data?.bookmarks) {
        // 双重过滤：确保只显示 is_pinned 为 true 的书签
        const pinnedOnly = response.data.bookmarks.filter((b) => b.is_pinned === true);
        
        console.log('[TMarks] 过滤后置顶书签:', pinnedOnly.length);

        const bookmarks: TMarksBookmark[] = pinnedOnly.map((b) => ({
          id: b.id,
          url: b.url,
          title: b.title,
          favicon: b.favicon || undefined,
          is_pinned: true,
        }));
        setPinnedBookmarks(bookmarks);
      }

      setSyncState({
        isSyncing: false,
        lastSyncAt: Date.now(),
        error: null,
      });

      return response.data?.bookmarks || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败';
      console.error('[TMarks] 获取置顶书签失败:', error);
      setSyncState((s) => ({
        ...s,
        isSyncing: false,
        error: message,
      }));
      return [];
    }
  }, []);

  // 搜索书签
  const searchBookmarks = useCallback(async (query: string) => {
    if (!query.trim()) return [];

    try {
      const client = await getTMarksClient();
      const response = await client.bookmarks.searchBookmarks(query, {
        page_size: 10,
      });

      return (response.data?.bookmarks || []).map((b) => ({
        id: b.id,
        url: b.url,
        title: b.title,
        favicon: b.favicon || undefined,
      }));
    } catch {
      return [];
    }
  }, []);

  // 检查是否已配置 API
  const checkApiConfigured = useCallback(async () => {
    try {
      const client = await getTMarksClient();
      await client.bookmarks.getBookmarks({ page_size: 1 });
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    syncState,
    pinnedBookmarks,
    fetchPinnedBookmarks,
    searchBookmarks,
    checkApiConfigured,
  };
}
