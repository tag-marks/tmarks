/**
 * 标签控制组件 - 排序、布局、清空 (单行图标版)
 */
interface TagControlsProps {
  sortBy: 'usage' | 'name' | 'clicks'
  onSortChange: (sortBy: 'usage' | 'name' | 'clicks') => void
  layout: 'grid' | 'masonry'
  onLayoutChange: (layout: 'grid' | 'masonry') => void
  selectedCount: number
  onClearSelection: () => void
}

export function TagControls({
  sortBy,
  onSortChange,
  layout,
  onLayoutChange,
  selectedCount,
  onClearSelection,
}: TagControlsProps) {
  return (
    <div className="flex items-center gap-1">
      {/* 排序方式下拉 */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as 'usage' | 'name' | 'clicks')}
        className="input input-sm text-xs cursor-pointer flex-1 min-w-0"
        title="排序方式"
      >
        <option value="usage">使用频率</option>
        <option value="clicks">点击次数</option>
        <option value="name">字母序</option>
      </select>

      {/* 布局切换按钮 */}
      <button
        onClick={() => onLayoutChange(layout === 'grid' ? 'masonry' : 'grid')}
        className="btn btn-sm btn-ghost p-2 flex-shrink-0"
        title={layout === 'grid' ? '切换到瀑布流' : '切换到网格'}
      >
        {layout === 'grid' ? (
          // 网格图标
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        ) : (
          // 瀑布流图标
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h6v4H4V5zM4 11h6v8H4v-8zM12 5h8v6h-8V5zM12 13h8v6h-8v-6z" />
          </svg>
        )}
      </button>

      {/* 清空选中按钮 */}
      <button
        onClick={onClearSelection}
        disabled={selectedCount === 0}
        className={`btn btn-sm p-2 flex-shrink-0 ${
          selectedCount === 0
            ? 'btn-disabled'
            : 'btn-ghost hover:bg-error/10 hover:text-error'
        }`}
        title={selectedCount > 0 ? `清空选中 (${selectedCount})` : '清空选中'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
