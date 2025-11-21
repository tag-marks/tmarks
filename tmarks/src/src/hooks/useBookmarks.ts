import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookmarksService } from '@/services/bookmarks'
import type {
  BookmarkQueryParams,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
  BatchActionRequest,
} from '@/lib/types'

export const BOOKMARKS_QUERY_KEY = 'bookmarks'

/**
 * 获取书签列表
 * 
 * 优化说明:
 * - staleTime: 30分钟 (书签变化不频繁)
 * - gcTime: 24小时 (持久化缓存)
 * - refetchOnWindowFocus: true (窗口聚焦时刷新)
 */
export function useBookmarks(params?: BookmarkQueryParams, options?: { staleTime?: number; gcTime?: number }) {
  return useQuery({
    queryKey: [BOOKMARKS_QUERY_KEY, params],
    queryFn: () => bookmarksService.getBookmarks(params),
    staleTime: options?.staleTime || 30 * 60 * 1000, // 30分钟 (从5分钟增加)
    gcTime: options?.gcTime || 24 * 60 * 60 * 1000, // 24小时 (从10分钟增加)
    refetchOnWindowFocus: true, // 启用窗口聚焦刷新
  })
}

/**
 * 无限滚动获取书签列表
 * 
 * 优化说明:
 * - staleTime: 30分钟
 * - gcTime: 24小时
 */
export function useInfiniteBookmarks(
  params?: BookmarkQueryParams,
  options?: { staleTime?: number; cacheTime?: number }
) {
  return useInfiniteQuery({
    queryKey: [BOOKMARKS_QUERY_KEY, params],
    queryFn: ({ pageParam }) =>
      bookmarksService.getBookmarks({
        ...params,
        page_cursor: typeof pageParam === 'string' ? pageParam : undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta?.has_more ? lastPage.meta.next_cursor : undefined),
    staleTime: options?.staleTime ?? 30 * 60 * 1000, // 30分钟
    gcTime: options?.cacheTime ?? 24 * 60 * 60 * 1000, // 24小时
    refetchOnWindowFocus: true,
  })
}

/**
 * 创建书签
 * 
 * 优化说明:
 * - 使用乐观更新，立即更新缓存
 * - 失败时自动回滚
 */
export function useCreateBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBookmarkRequest) => bookmarksService.createBookmark(data),
    onMutate: async (newBookmark) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: [BOOKMARKS_QUERY_KEY] })

      // 保存之前的数据（用于回滚）
      const previousBookmarks = queryClient.getQueryData([BOOKMARKS_QUERY_KEY])

      // 乐观更新：立即添加新书签到缓存
      queryClient.setQueryData([BOOKMARKS_QUERY_KEY, undefined], (old: any) => {
        if (!old) return old
        
        // 创建临时书签对象
        const tempBookmark = {
          id: `temp-${Date.now()}`,
          ...newBookmark,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_pinned: newBookmark.is_pinned || false,
          is_archived: newBookmark.is_archived || false,
          is_public: newBookmark.is_public || false,
          click_count: 0,
          last_clicked_at: null,
          deleted_at: null,
          tags: [],
        }

        return {
          ...old,
          bookmarks: [tempBookmark, ...(old.bookmarks || [])],
        }
      })

      return { previousBookmarks }
    },
    onError: (_err, _newBookmark, context) => {
      // 失败时回滚
      if (context?.previousBookmarks) {
        queryClient.setQueryData([BOOKMARKS_QUERY_KEY], context.previousBookmarks)
      }
    },
    onSuccess: async () => {
      // 成功后刷新数据
      try {
        await queryClient.invalidateQueries({ queryKey: [BOOKMARKS_QUERY_KEY] })
      } catch (error) {
        console.error('Failed to invalidate queries:', error)
      }
    },
  })
}

/**
 * 更新书签
 */
export function useUpdateBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookmarkRequest }) =>
      bookmarksService.updateBookmark(id, data),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: [BOOKMARKS_QUERY_KEY] })
      } catch (error) {
        console.error('Failed to invalidate queries:', error)
      }
    },
  })
}

/**
 * 删除书签
 */
export function useDeleteBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => bookmarksService.deleteBookmark(id),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: [BOOKMARKS_QUERY_KEY] })
      } catch (error) {
        console.error('Failed to invalidate queries:', error)
      }
    },
  })
}

/**
 * 恢复书签
 */
export function useRestoreBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => bookmarksService.restoreBookmark(id),
    onSuccess: async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: [BOOKMARKS_QUERY_KEY] })
      } catch (error) {
        console.error('Failed to invalidate queries:', error)
      }
    },
  })
}

/**
 * 记录书签点击
 */
export function useRecordClick() {
  return useMutation({
    mutationFn: (id: string) => bookmarksService.recordClick(id),
  })
}

/**
 * 批量操作书签
 */
export function useBatchAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BatchActionRequest) => bookmarksService.batchAction(data),
    onSuccess: async () => {
      // 使用 catch 来防止 invalidateQueries 的错误影响 mutation 结果
      try {
        await queryClient.invalidateQueries({ queryKey: [BOOKMARKS_QUERY_KEY] })
      } catch (error) {
        console.error('Failed to invalidate queries:', error)
        // 即使缓存失效失败也不应该让操作显示为失败
      }
    },
  })
}
