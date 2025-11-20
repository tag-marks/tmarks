import { Database, Download, Upload, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DataSettingsTab() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* 数据管理 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">数据管理</h3>
          <p className="text-sm text-muted-foreground mt-1">
            导入、导出和备份你的书签数据
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* 导出数据 */}
          <button
            onClick={() => navigate('/import-export')}
            className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left group"
          >
            <Download className="w-8 h-8 text-primary mb-3" />
            <div className="text-sm font-medium mb-1">导出数据</div>
            <div className="text-xs text-muted-foreground">
              将书签导出为 JSON、HTML 或 CSV 格式
            </div>
          </button>

          {/* 导入数据 */}
          <button
            onClick={() => navigate('/import-export')}
            className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left group"
          >
            <Upload className="w-8 h-8 text-primary mb-3" />
            <div className="text-sm font-medium mb-1">导入数据</div>
            <div className="text-xs text-muted-foreground">
              从浏览器或其他格式导入书签
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 存储信息 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">存储信息</h3>
          <p className="text-sm text-muted-foreground mt-1">
            查看当前数据使用情况
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-primary mb-1">-</div>
            <div className="text-xs text-muted-foreground">书签总数</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-primary mb-1">-</div>
            <div className="text-xs text-muted-foreground">标签总数</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold text-primary mb-1">-</div>
            <div className="text-xs text-muted-foreground">存储空间</div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 危险操作 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-error">危险操作</h3>
          <p className="text-sm text-muted-foreground mt-1">
            这些操作不可恢复，请谨慎使用
          </p>
        </div>

        <div className="p-4 rounded-lg border-2 border-error/20 bg-error/5">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">清空所有数据</div>
              <div className="text-xs text-muted-foreground mb-3">
                删除所有书签、标签和相关数据，此操作不可恢复
              </div>
              <button className="btn btn-sm bg-error text-white hover:bg-error/90">
                清空数据
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 提示信息 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              数据管理说明
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• 建议定期导出数据作为备份</li>
              <li>• 导入数据时会自动去重，不会产生重复书签</li>
              <li>• 所有数据都存储在云端，可以在多设备间同步</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
