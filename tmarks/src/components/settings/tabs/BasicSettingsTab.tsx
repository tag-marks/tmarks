import type { UserPreferences } from '@/lib/types'

interface BasicSettingsTabProps {
    preferences: UserPreferences
    onUpdate: (updates: Partial<UserPreferences>) => void
}

export function BasicSettingsTab({ preferences, onUpdate }: BasicSettingsTabProps) {
    return (
        <div className="space-y-6">
            {/* 主题设置 */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">主题</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        选择应用的外观主题
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { value: 'light', label: '浅色', icon: '☀️' },
                        { value: 'dark', label: '深色', icon: '🌙' },
                        { value: 'system', label: '跟随系统', icon: '💻' },
                    ].map((theme) => (
                        <button
                            key={theme.value}
                            onClick={() => onUpdate({ theme: theme.value as any })}
                            className={`p-4 rounded-xl border-2 transition-all ${preferences.theme === theme.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="text-2xl mb-2">{theme.icon}</div>
                            <div className="text-sm font-medium">{theme.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-border"></div>

            {/* 视图模式 */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">默认视图模式</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        选择书签列表的默认显示方式
                    </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { value: 'card', label: '卡片视图', icon: '🎴' },
                        { value: 'list', label: '列表视图', icon: '📋' },
                        { value: 'minimal', label: '极简列表', icon: '📝' },
                        { value: 'title', label: '标题瀑布', icon: '🌊' },
                    ].map((mode) => (
                        <button
                            key={mode.value}
                            onClick={() => onUpdate({ view_mode: mode.value as any })}
                            className={`p-3 rounded-lg border-2 transition-all ${preferences.view_mode === mode.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="text-xl mb-1">{mode.icon}</div>
                            <div className="text-xs font-medium">{mode.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-border"></div>

            {/* 密度设置 */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">显示密度</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        调整界面元素的紧凑程度
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { value: 'compact', label: '紧凑', desc: '更多内容' },
                        { value: 'normal', label: '标准', desc: '平衡舒适' },
                        { value: 'comfortable', label: '舒适', desc: '宽松布局' },
                    ].map((density) => (
                        <button
                            key={density.value}
                            onClick={() => onUpdate({ density: density.value as any })}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${preferences.density === density.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="text-sm font-medium mb-1">{density.label}</div>
                            <div className="text-xs text-muted-foreground">{density.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-border"></div>

            {/* 每页显示数量 */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">每页显示数量</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        设置每页加载的书签数量
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        step="10"
                        value={preferences.page_size}
                        onChange={(e) => onUpdate({ page_size: Number(e.target.value) })}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                        type="number"
                        min="10"
                        max="100"
                        value={preferences.page_size}
                        onChange={(e) => onUpdate({ page_size: Number(e.target.value) })}
                        className="w-20 px-3 py-2 border border-border rounded-lg text-sm text-foreground bg-background"
                    />
                    <span className="text-sm text-muted-foreground">条</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    当前设置：每页显示 {preferences.page_size} 条书签
                </p>
            </div>
        </div>
    )
}
