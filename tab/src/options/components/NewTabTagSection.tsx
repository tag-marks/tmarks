import { useState } from 'react';
import { NEWTAB_FOLDER_PROMPT_TEMPLATE, NEWTAB_FOLDER_PROMPT_TEMPLATE_V2 } from '@/lib/constants/newtabPrompts';

interface NewTabTagSectionProps {
  formData: {
    enableNewtabAI: boolean;
    newtabFolderRecommendCount: number;
    enableNewtabFolderPrompt: boolean;
    newtabFolderPrompt: string;
    aiBookmarkClassifyScope: 'newtab_root' | 'bookmarks_bar' | 'all';
  };
  setFormData: (data: any) => void;
  setSuccessMessage: (msg: string | null) => void;
}

export function NewTabTagSection({ formData, setFormData, setSuccessMessage }: NewTabTagSectionProps) {
  const [isLoadingFolderPaths, setIsLoadingFolderPaths] = useState(false);
  const [folderPathsError, setFolderPathsError] = useState<string | null>(null);
  const [folderPaths, setFolderPaths] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const importAllBookmarksToNewtab = async () => {
    try {
      setImportError(null);
      if (!chrome?.runtime?.sendMessage) {
        throw new Error('当前环境不支持 chrome.runtime');
      }

      const confirmed = window.confirm('将复制浏览器所有书签到“Tmakrs”文件夹下（不会修改原始书签）。确定继续？');
      if (!confirmed) return;

      setIsImporting(true);
      const resp = (await chrome.runtime.sendMessage({
        type: 'IMPORT_ALL_BOOKMARKS_TO_NEWTAB',
      })) as { success: boolean; data?: { importFolderId: string; counts: { folders: number; bookmarks: number } }; error?: string };

      if (!resp?.success) {
        throw new Error(resp?.error || '导入失败');
      }

      const folders = resp.data?.counts?.folders ?? 0;
      const bookmarks = resp.data?.counts?.bookmarks ?? 0;
      setSuccessMessage(`导入完成：文件夹 ${folders} 个，书签 ${bookmarks} 个`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : '导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  const loadFolderPaths = async () => {
    try {
      setIsLoadingFolderPaths(true);
      setFolderPathsError(null);

      if (!chrome?.runtime?.sendMessage) {
        throw new Error('当前环境不支持 chrome.runtime');
      }

      const resp = (await chrome.runtime.sendMessage({
        type: 'GET_NEWTAB_FOLDERS',
      })) as { success: boolean; data?: { rootId: string; folders: Array<{ id: string; title: string; parentId: string | null; path: string }> }; error?: string };

      if (!resp?.success) {
        throw new Error(resp?.error || '加载候选路径失败');
      }

      const paths = (resp.data?.folders || [])
        .filter((f) => f.id !== resp.data?.rootId)
        .map((f) => f.path)
        .filter(Boolean);

      setFolderPaths(paths);
    } catch (e) {
      setFolderPathsError(e instanceof Error ? e.message : '加载候选路径失败');
      setFolderPaths([]);
    } finally {
      setIsLoadingFolderPaths(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--tab-options-modal-topbar-from)] via-[var(--tab-options-modal-topbar-via)] to-[var(--tab-options-modal-topbar-to)]" />

      <div className="p-6 pt-10 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--tab-options-title)]">NewTab 文件夹推荐</h2>
          <p className="mt-2 text-sm text-[var(--tab-options-text)]">
            配置 Popup「保存到 NewTab」的文件夹 AI 推荐。
          </p>
          <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">
            NewTab 根目录固定为浏览器书签栏下的文件夹：Tmakrs。
          </p>
          <p className="mt-1 text-xs text-[var(--tab-options-text-muted)]">
            后续“AI 整理”会在该根目录范围内创建备份并复制生成整理后的书签结构（可通过下方“AI 分类范围”调整）。
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-[var(--tab-options-text)]">
                启用 NewTab 文件夹 AI 推荐
              </label>
              <p className="mt-1 text-xs text-[var(--tab-options-text-muted)]">
                启用后，保存到 NewTab 时可使用 AI 推荐文件夹。
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.enableNewtabAI}
              onClick={() => setFormData({ ...formData, enableNewtabAI: !formData.enableNewtabAI })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)] focus:ring-offset-2 ${
                formData.enableNewtabAI ? 'bg-[var(--tab-options-button-primary-bg)]' : 'bg-[var(--tab-options-button-hover-bg)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--tab-options-switch-thumb)] shadow ring-0 transition duration-200 ease-in-out ${
                  formData.enableNewtabAI ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-2">AI 分类范围</label>
            <div className="inline-flex rounded-xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] p-1 text-sm font-medium text-[var(--tab-options-text)]">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, aiBookmarkClassifyScope: 'newtab_root' })}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  formData.aiBookmarkClassifyScope === 'newtab_root'
                    ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                    : 'hover:text-[var(--tab-options-title)]'
                }`}
              >
                仅 NewTab 根目录
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, aiBookmarkClassifyScope: 'bookmarks_bar' })}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  formData.aiBookmarkClassifyScope === 'bookmarks_bar'
                    ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                    : 'hover:text-[var(--tab-options-title)]'
                }`}
              >
                书签栏
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, aiBookmarkClassifyScope: 'all' })}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  formData.aiBookmarkClassifyScope === 'all'
                    ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] shadow'
                    : 'hover:text-[var(--tab-options-title)]'
                }`}
              >
                全部书签
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">
              用于后续“AI 批量整理/分类既有书签”功能的作用范围。默认只处理 NewTab 根目录。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-2">导入浏览器书签到 NewTab</label>
            <p className="text-xs text-[var(--tab-options-text-muted)]">
              将浏览器所有书签复制到“Tmakrs”文件夹下的一个新子文件夹中，便于后续 AI 整理。不会修改原始书签。
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={importAllBookmarksToNewtab}
                disabled={isImporting}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--tab-options-button-primary-bg)] hover:bg-[var(--tab-options-button-primary-hover)] text-[var(--tab-options-button-primary-text)] disabled:opacity-60"
              >
                {isImporting ? '导入中...' : '一键导入全部书签'}
              </button>
              {importError && (
                <div className="text-xs text-red-500">{importError}</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-3">
              最大推荐文件夹数
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.newtabFolderRecommendCount ?? 10}
              onChange={(e) => setFormData({ ...formData, newtabFolderRecommendCount: parseInt(e.target.value) || 10 })}
              disabled={!formData.enableNewtabAI}
              className="w-full px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)] disabled:opacity-60"
            />
            <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">范围 1-20。</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--tab-options-text)]">
                NewTab 文件夹级 Prompt
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, enableNewtabFolderPrompt: !formData.enableNewtabFolderPrompt })}
                disabled={!formData.enableNewtabAI}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  formData.enableNewtabAI && formData.enableNewtabFolderPrompt
                    ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] hover:bg-[var(--tab-options-button-primary-hover)]'
                    : 'bg-[var(--tab-options-button-hover-bg)] text-[var(--tab-options-button-text)] hover:bg-[color:var(--tab-options-button-border)]'
                }`}
              >
                {formData.enableNewtabFolderPrompt ? '已启用' : '已禁用'}
              </button>
            </div>

            <p className="mt-1 text-xs text-[var(--tab-options-text-muted)]">
              用于“文件夹级别”的保存位置推荐：AI 只能从候选文件夹路径列表中选择，不会生成标签。
            </p>

            {formData.enableNewtabAI && formData.enableNewtabFolderPrompt && (
              <div className="space-y-3">
                <textarea
                  value={formData.newtabFolderPrompt}
                  onChange={(e) => setFormData({ ...formData, newtabFolderPrompt: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)] font-mono text-xs"
                  placeholder="可用变量：{{title}} {{url}} {{description}} {{recommendCount}} {{folderPaths}}"
                />

                <div className="rounded-lg border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-[var(--tab-options-title)]">候选路径预览</div>
                      <div className="mt-1 text-xs text-[var(--tab-options-text-muted)]">
                        路径格式示例：Tmakrs/邮箱/国外/临时邮箱
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={loadFolderPaths}
                        disabled={isLoadingFolderPaths}
                        className="text-xs px-2 py-1 bg-[var(--tab-options-button-hover-bg)] hover:bg-[color:var(--tab-options-button-border)] text-[var(--tab-options-button-text)] rounded-md transition-colors duration-200 disabled:opacity-60"
                      >
                        {isLoadingFolderPaths ? '加载中...' : folderPaths.length > 0 ? '刷新' : '加载'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(folderPaths.join('\n')).then(() => {
                            setSuccessMessage('候选路径已复制到剪贴板');
                            setTimeout(() => setSuccessMessage(null), 2000);
                          });
                        }}
                        disabled={folderPaths.length === 0}
                        className="text-xs px-2 py-1 bg-[var(--tab-options-button-primary-bg)] hover:bg-[var(--tab-options-button-primary-hover)] text-[var(--tab-options-button-primary-text)] rounded-md transition-colors duration-200 disabled:opacity-60"
                      >
                        复制路径
                      </button>
                    </div>
                  </div>

                  {folderPathsError && (
                    <div className="text-xs text-red-500">{folderPathsError}</div>
                  )}

                  {folderPaths.length > 0 ? (
                    <pre className="text-xs text-[var(--tab-options-text-muted)] whitespace-pre-wrap max-h-40 overflow-y-auto">
{folderPaths.join('\n')}
                    </pre>
                  ) : (
                    <div className="text-xs text-[var(--tab-options-text-muted)]">尚未加载候选路径。</div>
                  )}
                </div>

                <div className="p-3 bg-[color:var(--tab-options-tag-bg)] rounded-lg">
                  <p className="text-xs font-medium text-[var(--tab-options-pill-text)] mb-1">💡 专业示例 Prompt：</p>
                  <pre className="text-xs text-[var(--tab-options-text-muted)] whitespace-pre-wrap max-h-32 overflow-y-auto">
{NEWTAB_FOLDER_PROMPT_TEMPLATE}
                  </pre>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, newtabFolderPrompt: NEWTAB_FOLDER_PROMPT_TEMPLATE })}
                      className="text-xs px-2 py-1 bg-[var(--tab-options-button-primary-bg)] hover:bg-[var(--tab-options-button-primary-hover)] text-[var(--tab-options-button-primary-text)] rounded-md transition-colors duration-200"
                    >
                      使用此示例
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, newtabFolderPrompt: NEWTAB_FOLDER_PROMPT_TEMPLATE_V2 })}
                      className="text-xs px-2 py-1 bg-[var(--tab-options-button-primary-bg)] hover:bg-[var(--tab-options-button-primary-hover)] text-[var(--tab-options-button-primary-text)] rounded-md transition-colors duration-200"
                    >
                      使用示例 2
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(NEWTAB_FOLDER_PROMPT_TEMPLATE).then(() => {
                          setSuccessMessage('示例 Prompt 已复制到剪贴板');
                          setTimeout(() => setSuccessMessage(null), 2000);
                        });
                      }}
                      className="text-xs px-2 py-1 bg-[var(--tab-options-button-primary-bg)] hover:bg-[var(--tab-options-button-primary-hover)] text-[var(--tab-options-button-primary-text)] rounded-md transition-colors duration-200"
                    >
                      复制示例
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
