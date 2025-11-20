import { useState, useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { usePreferences, useUpdatePreferences } from '@/hooks/usePreferences'
import { useToastStore } from '@/stores/toastStore'
import type { DefaultBookmarkIcon } from '@/lib/types'
import { SearchAutoClearSettings } from '@/components/settings/SearchAutoClearSettings'
import { TagSelectionAutoClearSettings } from '@/components/settings/TagSelectionAutoClearSettings'
import { DefaultBookmarkIconSettings } from '@/components/settings/DefaultBookmarkIconSettings'
import { SettingsTips } from '@/components/settings/SettingsTips'

export function GeneralSettingsPage() {
  const { data: preferences, isLoading } = usePreferences()
  const updatePreferences = useUpdatePreferences()
  const { addToast } = useToastStore()

  // 1. 搜索和筛选相关
  const [searchAutoClearSeconds, setSearchAutoClearSeconds] = useState(15)
  const [tagSelectionAutoClearSeconds, setTagSelectionAutoClearSeconds] = useState(30)
  const [enableSearchAutoClear, setEnableSearchAutoClear] = useState(true)
  const [enableTagSelectionAutoClear, setEnableTagSelectionAutoClear] = useState(false)
  
  // 2. 默认书签图标
  const [defaultBookmarkIcon, setDefaultBookmarkIcon] = useState<DefaultBookmarkIcon>('bookmark')

  // 从服务器加载设置
  useEffect(() => {
    if (preferences) {
      setSearchAutoClearSeconds(preferences.search_auto_clear_seconds || 15)
      setTagSelectionAutoClearSeconds(preferences.tag_selection_auto_clear_seconds || 30)
      setEnableSearchAutoClear(preferences.enable_search_auto_clear ?? true)
      setEnableTagSelectionAutoClear(preferences.enable_tag_selection_auto_clear ?? false)
      setDefaultBookmarkIcon(preferences.default_bookmark_icon || 'bookmark')
    }
  }, [preferences])

  const handleSave = async () => {
    try {
      await updatePreferences.mutateAsync({
        search_auto_clear_seconds: searchAutoClearSeconds,
        tag_selection_auto_clear_seconds: tagSelectionAutoClearSeconds,
        enable_search_auto_clear: enableSearchAutoClear,
        enable_tag_selection_auto_clear: enableTagSelectionAutoClear,
        default_bookmark_icon: defaultBookmarkIcon,
      })
      addToast('success', '设置已保存')
    } catch {
      addToast('error', '保存失败')
    }
  }

  const handleReset = () => {
    setSearchAutoClearSeconds(15)
    setTagSelectionAutoClearSeconds(30)
    setEnableSearchAutoClear(true)
    setEnableTagSelectionAutoClear(false)
    setDefaultBookmarkIcon('bookmark')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">通用设置</h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置应用的通用行为和用户体验
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={updatePreferences.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updatePreferences.isPending ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-6">
        <SearchAutoClearSettings
          enabled={enableSearchAutoClear}
          seconds={searchAutoClearSeconds}
          onEnabledChange={setEnableSearchAutoClear}
          onSecondsChange={setSearchAutoClearSeconds}
        />

        <div className="border-t border-border"></div>

        <TagSelectionAutoClearSettings
          enabled={enableTagSelectionAutoClear}
          seconds={tagSelectionAutoClearSeconds}
          onEnabledChange={setEnableTagSelectionAutoClear}
          onSecondsChange={setTagSelectionAutoClearSeconds}
        />

        <div className="border-t border-border"></div>

        <DefaultBookmarkIconSettings
          selectedIcon={defaultBookmarkIcon}
          onIconChange={setDefaultBookmarkIcon}
        />

        <div className="border-t border-border"></div>

        <SettingsTips
          tips={[
            '搜索框自动清空可以帮助你快速回到全部内容视图',
            '标签选中自动清空可以避免长时间保持筛选状态',
            '你可以根据使用习惯调整自动清空的时间',
            '默认书签图标会在书签没有图片时显示',
          ]}
        />
      </div>
    </div>
  )
}
