import { Database, Download, Upload, FileJson, FileCode } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DataSettingsTab() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* 数据管理 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">数据导入导出</h3>
          <p className="text-sm text-muted-foreground mt-1">
            导入、导出和备份你的书签数据
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* 导出数据 */}
          <button
            onClick={() => navigate('/import-export')}
            className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left group hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div className="text-base font-semibold text-foreground">导出数据</div>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              将书签导出为文件，支持多种格式
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                <FileJson className="w-3 h-3" />
                JSON
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                <FileCode className="w-3 h-3" />
                HTML
              </span>
            </div>
          </button>

          {/* 导入数据 */}
          <button
            onClick={() => navigate('/import-export')}
            className="p-6 rounded-xl border-2 border-border hover:border-primary/50 transition-all text-left group hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                <Upload className="w-6 h-6 text-success" />
              </div>
              <div className="text-base font-semibold text-foreground">导入数据</div>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              从浏览器或其他来源导入书签
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                浏览器书签
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                JSON/HTML
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 导出功能说明 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">导出功能</h3>
          <p className="text-sm text-muted-foreground mt-1">
            支持多种格式，满足不同需求
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <FileJson className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">JSON 格式</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• 包含完整数据，适合备份和迁移</div>
                <div>• 可选择包含标签、元数据等信息</div>
                <div>• 支持重新导入到本系统</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <FileCode className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">HTML 格式</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• 兼容浏览器标准格式</div>
                <div>• 可直接导入 Chrome、Firefox、Edge 等浏览器</div>
                <div>• 保留文件夹结构和书签层级</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 导入功能说明 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">导入功能</h3>
          <p className="text-sm text-muted-foreground mt-1">
            从多种来源导入书签数据
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Upload className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">支持的格式</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• 浏览器导出的 HTML 书签文件</div>
                <div>• JSON 格式的书签数据</div>
                <div>• 自动检测和跳过重复书签</div>
                <div>• 可将文件夹结构转换为标签</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Database className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">智能处理</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• 支持批量处理大文件</div>
                <div>• 自动提取书签元数据</div>
                <div>• 保留创建时间和描述信息</div>
                <div>• 显示详细的导入结果报告</div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
