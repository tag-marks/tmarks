import { useRef, memo, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Bookmark } from '@/lib/types'
import { useRecordClick } from '@/hooks/useBookmarks'

interface BookmarkListViewProps {
  bookmarks: Bookmark[]
  onEdit?: (bookmark: Bookmark) => void
  readOnly?: boolean
  batchMode?: boolean
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
}

export function BookmarkListView({
  bookmarks,
  onEdit,
  readOnly = false,
  batchMode = false,
  selectedIds = [],
  onToggleSelect,
}: BookmarkListViewProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [showEditHint, setShowEditHint] = useState(true)

  // 移动端10秒后隐藏编辑按钮提示
  useEffect(() => {
    // 检测是否为移动端（宽度小于640px）
    const isMobile = window.innerWidth < 640
    
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowEditHint(false)
      }, 10000)

      return () => clearTimeout(timer)
    } else {
      // PC端立即隐藏
      setShowEditHint(false)
    }
  }, [])

  // 只有超过 200 个书签时才启用虚拟滚动
  const enableVirtualization = bookmarks.length > 200

  const virtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // 估计每行高度
    overscan: 5, // 预渲染额外的行
    enabled: enableVirtualization,
  })

  return (
    <div
      ref={parentRef}
      className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3 scrollbar-hide"
      style={enableVirtualization ? { height: '600px', overflow: 'auto' } : undefined}
    >
      {enableVirtualization && (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const bookmark = bookmarks[virtualRow.index]
            if (!bookmark) return null
            return (
              <div
                key={bookmark.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <BookmarkListItem
                  bookmark={bookmark}
                  onEdit={onEdit ? () => onEdit(bookmark) : undefined}
                  readOnly={readOnly}
                  batchMode={batchMode}
                  isSelected={selectedIds.includes(bookmark.id)}
                  onToggleSelect={onToggleSelect}
                  showEditHint={showEditHint}
                />
              </div>
            )
          })}
        </div>
      )}

      {!enableVirtualization &&
        bookmarks.map((bookmark) => (
          <BookmarkListItem
            key={bookmark.id}
            bookmark={bookmark}
            onEdit={onEdit ? () => onEdit(bookmark) : undefined}
            readOnly={readOnly}
            batchMode={batchMode}
            isSelected={selectedIds.includes(bookmark.id)}
            onToggleSelect={onToggleSelect}
            showEditHint={showEditHint}
          />
        ))}
    </div>
  )
}

interface BookmarkListItemProps {
  bookmark: Bookmark
  onEdit?: () => void
  readOnly?: boolean
  batchMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  showEditHint?: boolean
}

const BookmarkListItem = memo(function BookmarkListItem({
  bookmark,
  onEdit,
  readOnly = false,
  batchMode = false,
  isSelected = false,
  onToggleSelect,
  showEditHint = false,
}: BookmarkListItemProps) {
  const [coverImageError, setCoverImageError] = useState(false)
  const [faviconError, setFaviconError] = useState(false)
  const recordClick = useRecordClick()

  // 生成Google Favicon URL作为fallback
  const getFaviconUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    } catch {
      return ''
    }
  }

  const fallbackFaviconUrl = getFaviconUrl(bookmark.url)
  
  // 决定显示什么图片
  const hasCoverImage = bookmark.cover_image && !coverImageError
  const shouldShowFallback = !hasCoverImage && fallbackFaviconUrl && !faviconError
  const shouldShowImage = hasCoverImage || shouldShowFallback

  const handleVisit = () => {
    // 记录点击统计
    if (!readOnly) {
      recordClick.mutate(bookmark.id)
    }
    // 打开书签
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`card hover:shadow-lg transition-all relative group touch-manipulation ${
      batchMode && isSelected ? 'ring-2 ring-primary' : ''
    }`}>
      {/* 批量选择复选框 */}
      {batchMode && onToggleSelect && (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleSelect(bookmark.id)
            }}
            className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border-2 border-border hover:border-primary'
            }`}
            title={isSelected ? '取消选择' : '选择'}
          >
            {isSelected && (
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* 编辑按钮 - 初始显示10秒后隐藏 */}
      {!!onEdit && !readOnly && !batchMode && (
        <button
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onEdit()
          }}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 z-10 touch-manipulation ${
            showEditHint ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 active:opacity-100'
          }`}
          title="编辑"
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-base-content drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}

      {/* 移动端：横向紧凑布局，桌面端：传统列表布局 */}
      <div className="flex flex-row gap-2 sm:gap-4">

        {/* 封面图 - 移动端小图标，桌面端大图 */}
        {shouldShowImage && (
          <div className="flex-shrink-0 w-12 h-12 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md sm:rounded-lg overflow-hidden bg-base-200 flex items-center justify-center">
            {hasCoverImage ? (
              <img
                src={bookmark.cover_image!}
                alt={bookmark.title}
                className="w-full h-full object-cover"
                onError={() => setCoverImageError(true)}
              />
            ) : shouldShowFallback ? (
              <img
                src={fallbackFaviconUrl}
                alt={bookmark.title}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
                onError={() => setFaviconError(true)}
              />
            ) : null}
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* 标题 - 移动端2行，桌面端1行 */}
          <button
            onClick={handleVisit}
            className="font-semibold text-xs sm:text-base hover:text-primary transition-colors text-left mb-0.5 sm:mb-1"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
              lineHeight: '1.3'
            }}
            title={bookmark.title}
          >
            {bookmark.title}
          </button>

          {/* 状态标签 - 移动端和桌面端都显示 */}
          {(!!bookmark.is_pinned || !!bookmark.is_archived) && (
            <div className="flex gap-1 mb-1 sm:mb-2">
              {!!bookmark.is_pinned && (
                <span className="bg-warning text-warning-content text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium" title="已置顶">
                  置顶
                </span>
              )}
              {!!bookmark.is_archived && (
                <span className="bg-base-content/40 text-card text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium" title="已归档">
                  归档
                </span>
              )}
            </div>
          )}

          {/* URL - 移动端隐藏，桌面端显示 */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block text-xs text-primary hover:underline mb-2"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-all'
            }}
          >
            {bookmark.url}
          </a>

          {/* 描述 - 移动端隐藏，桌面端显示 */}
          {bookmark.description && (
            <p className="hidden sm:block text-sm text-base-content/70 line-clamp-2 mb-2">
              {bookmark.description}
            </p>
          )}

          {/* 标签 - 移动端隐藏，桌面端显示 */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-1.5">
              {bookmark.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
