import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { TagList } from '@/components/TagList';
import { PageInfoCard } from '@/components/PageInfoCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { SuccessMessage } from '@/components/SuccessMessage';
import { LoadingMessage } from '@/components/LoadingMessage';
import { BookmarkExistsDialog } from '@/components/BookmarkExistsDialog';
import { ModeSelector } from './ModeSelector';
import { TabCollectionView } from './TabCollectionView';
import { getExistingTagClass, getSelectedTagClass, type TagTheme } from '@/lib/utils/tagStyles';
import { applyTheme, applyThemeStyle } from '@/lib/utils/themeManager';

type ViewMode = 'selector' | 'bookmark' | 'newtab' | 'tabCollection';

async function sendMessage<T = any>(message: { type: string; payload?: any }): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: any) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.success) {
        reject(new Error(response?.error || 'Unknown error'));
        return;
      }

      resolve(response.data as T);
    });
  });
}

export function Popup() {
  const {
    currentPage,
    recommendedTags,
    existingTags,
    selectedTags,
    isLoading,
    isSaving,
    isRecommending,
    error,
    successMessage,
    loadingMessage,
    existingBookmark,
    config,
    loadConfig,
    loadExistingTags,
    extractPageInfo,
    recommendTags,
    saveBookmark,
    setError,
    setSuccessMessage,
    setLoadingMessage,
    toggleTag,
    addCustomTag,
    setCurrentPage,
    includeThumbnail,
    setIncludeThumbnail,
    isPublic,
    setIsPublic,
    createSnapshot,
    setCreateSnapshot,
    setExistingBookmark,
    updateExistingBookmarkTags,
    updateExistingBookmarkDescription,
    createSnapshotForBookmark,
    lastRecommendationSource,
    lastSaveDurationMs
  } = useAppStore();

  const [newtabRootId, setNewtabRootId] = useState<string | null>(null);
  const [newtabFolders, setNewtabFolders] = useState<Array<{ id: string; title: string; parentId: string | null; path: string }>>([]);
  const [currentNewtabFolderId, setCurrentNewtabFolderId] = useState<string | null>(null);
  const [newtabBreadcrumb, setNewtabBreadcrumb] = useState<Array<{ id: string; title: string }>>([]);
  const [newtabSuggestions, setNewtabSuggestions] = useState<Array<{ id: string; path: string; confidence: number }>>([]);
  const [isNewtabRecommending, setIsNewtabRecommending] = useState(false);
  const [newtabFoldersLoaded, setNewtabFoldersLoaded] = useState(false);
  const [newtabFoldersLoadError, setNewtabFoldersLoadError] = useState<string | null>(null);

  const [customTagInput, setCustomTagInput] = useState('');
  const [titleOverride, setTitleOverride] = useState('');
  const [descriptionOverride, setDescriptionOverride] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('selector');
  const [showTitleEdit, setShowTitleEdit] = useState(false);
  const [showDescEdit, setShowDescEdit] = useState(false);

  const tagTheme: TagTheme = (config?.preferences?.tagTheme ?? 'classic') as TagTheme;

  useEffect(() => {
    setTitleOverride(currentPage?.title ?? '');
  }, [currentPage?.title]);

  useEffect(() => {
    setDescriptionOverride(currentPage?.description ?? '');
  }, [currentPage?.description]);

  // Load config and existing tags first
  useEffect(() => {
    loadConfig();
    loadExistingTags();
  }, []);

  // Apply theme based on user preference
  useEffect(() => {
    applyTheme(config?.preferences?.theme ?? 'auto');
  }, [config?.preferences?.theme]);

  useEffect(() => {
    applyThemeStyle(config?.preferences?.themeStyle ?? 'default');
  }, [config?.preferences?.themeStyle]);

  // Check if configured (only need bookmark site API key, AI is optional)
  const isConfigured = Boolean(config && config.bookmarkSite.apiKey);

  // Check if AI is enabled and configured
  const isAIEnabled = Boolean(
    config &&
    config.preferences.enableAI &&
    config.aiConfig.apiKeys[config.aiConfig.provider]
  );

  // Initialize after config is loaded (only for bookmark mode)
  useEffect(() => {
    if (!config || initialized || viewMode !== 'bookmark') return;

    const init = async () => {
      if (!isConfigured) {
        setInitialized(true);
        return;
      }

      try {
        // Extract page info
        await extractPageInfo();

        // Check AI status at init time (not from closure)
        const shouldUseAI =
          config.preferences.enableAI &&
          Boolean(config.aiConfig.apiKeys[config.aiConfig.provider]);

        if (shouldUseAI) {
          await recommendTags();
        }

        setInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setInitialized(true);
      }
    };

    init();
  }, [config, viewMode]);

  // Initialize after config is loaded (only for newtab mode)
  useEffect(() => {
    if (initialized || viewMode !== 'newtab') return;

    const init = async () => {
      try {
        await extractPageInfo();
        await loadNewtabFolders();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setInitialized(true);
      }
    };

    init();
  }, [initialized, viewMode]);

  const handleSave = async () => {
    // AI 书签助手需要标签来组织和分类书签
    if (selectedTags.length === 0) {
      setError('请至少选择一个标签');
      return;
    }

    await saveBookmark();
  };

  const handleAddCustomTag = () => {
    const tagName = customTagInput.trim();
    if (tagName) {
      addCustomTag(tagName);
      setCustomTagInput('');
    }
  };

  const loadNewtabFolders = async () => {
    try {
      setNewtabFoldersLoadError(null);
      const resp = await sendMessage<{ rootId: string; folders: Array<{ id: string; title: string; parentId: string | null; path: string }> }>({
        type: 'GET_NEWTAB_FOLDERS',
      });
      setNewtabRootId(resp.rootId);
      setNewtabFolders(resp.folders);
      setCurrentNewtabFolderId(resp.rootId);
      const root = resp.folders.find((f) => f.id === resp.rootId);
      setNewtabBreadcrumb(root ? [{ id: root.id, title: root.title }] : []);
      setNewtabFoldersLoaded(true);
    } catch (e) {
      setNewtabFoldersLoaded(false);
      setNewtabFoldersLoadError(e instanceof Error ? e.message : '加载文件夹失败');
      setNewtabRootId(null);
      setNewtabFolders([]);
      setCurrentNewtabFolderId(null);
      setNewtabBreadcrumb([]);
    }
  };

  const enterNewtabFolder = (folderId: string) => {
    const folder = newtabFolders.find((f) => f.id === folderId);
    if (!folder) return;
    setCurrentNewtabFolderId(folderId);

    const chain: Array<{ id: string; title: string }> = [];
    let cursor: typeof folder | undefined = folder;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      chain.push({ id: cursor.id, title: cursor.title });
      cursor = cursor.parentId ? newtabFolders.find((f) => f.id === cursor!.parentId) : undefined;
    }
    setNewtabBreadcrumb(chain.reverse());
  };

  const handleRecommendNewtabFolder = async () => {
    if (!currentPage?.url) {
      setError('未获取到页面信息');
      return;
    }

    if (!newtabFoldersLoaded) {
      setNewtabFoldersLoadError('目录列表未加载，暂时无法进行 AI 文件夹推荐。你仍可直接保存到根目录。');
      return;
    }

    try {
      setIsNewtabRecommending(true);
      const resp = await sendMessage<{ suggestedFolders: Array<{ id: string; path: string; confidence: number }> }>({
        type: 'RECOMMEND_NEWTAB_FOLDER',
        payload: {
          title: currentPage.title,
          url: currentPage.url,
          description: currentPage.description,
        },
      });
      setNewtabSuggestions(resp.suggestedFolders || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 推荐失败');
    } finally {
      setIsNewtabRecommending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCustomTag();
    }
  };

  const handleApplyTitleOverride = () => {
    const trimmed = titleOverride.trim();
    if (!trimmed || !currentPage) {
      return;
    }
    setCurrentPage({ ...currentPage, title: trimmed });
    setTitleOverride(trimmed);
  };

  const handleApplyDescriptionOverride = () => {
    if (!currentPage) {
      return;
    }
    const trimmed = descriptionOverride.trim();
    setCurrentPage({ ...currentPage, description: trimmed || undefined });
    setDescriptionOverride(trimmed);
  };

  const handleToggleThumbnail = () => {
    if (!currentPage?.thumbnail) {
      setIncludeThumbnail(false);
      return;
    }

    setIncludeThumbnail(!includeThumbnail);
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleSelectBookmark = () => {
    setViewMode('bookmark');
    setInitialized(false); // Reset to trigger initialization
  };

  const handleSelectTabCollection = () => {
    setViewMode('tabCollection');
  };

  const handleSelectNewTab = () => {
    setViewMode('newtab');
    setInitialized(false);
  };

  const handleBackToSelector = () => {
    setViewMode('selector');
  };

  const handleSaveToNewTab = async () => {
    if (!currentPage?.url) {
      setError('未获取到页面信息');
      return;
    }

    try {
      setLoadingMessage('正在准备保存到 NewTab...');

      let targetFolderId = currentNewtabFolderId || undefined;
      if (!newtabFoldersLoaded) {
        targetFolderId = undefined;
      }

      const shouldUseNewtabAI = Boolean(
        config &&
          config.preferences.enableNewtabAI &&
          config.aiConfig.apiKeys[config.aiConfig.provider]
      );

      if (shouldUseNewtabAI && newtabFoldersLoaded) {
        try {
          setLoadingMessage('AI 正在推荐 NewTab 文件夹...');
          const resp = await sendMessage<{ suggestedFolders: Array<{ id: string; path: string; confidence: number }> }>({
            type: 'RECOMMEND_NEWTAB_FOLDER',
            payload: {
              title: currentPage.title,
              url: currentPage.url,
              description: currentPage.description,
            },
          });

          const suggestions = resp?.suggestedFolders || [];
          setNewtabSuggestions(suggestions);
          if (suggestions.length > 0) {
            targetFolderId = suggestions[0].id;
          }
        } catch {
          // ignore AI errors and fallback to current folder selection
        }
      }

      setLoadingMessage('正在保存到 NewTab...');
      await sendMessage<{ id: string }>({
        type: 'SAVE_TO_NEWTAB',
        payload: {
          url: currentPage.url,
          title: currentPage.title,
          parentBookmarkId: targetFolderId,
        },
      });

      setLoadingMessage(null);
      setSuccessMessage('✅ 已保存到 NewTab');

      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon-128.png',
        title: 'AI 书签助手',
        message: `《${currentPage.title}》已保存到 NewTab`,
      });

      const toastSnapshot = '✅ 已保存到 NewTab';
      setTimeout(() => {
        if (useAppStore.getState().successMessage === toastSnapshot) {
          useAppStore.getState().setSuccessMessage(null);
        }
      }, 2000);
    } catch (e) {
      setLoadingMessage(null);
      setError(e instanceof Error ? e.message : '保存失败');
    }
  };

  // Show mode selector first
  if (viewMode === 'selector') {
    return (
      <ModeSelector
        onSelectBookmark={handleSelectBookmark}
        onSelectNewTab={handleSelectNewTab}
        onSelectTabCollection={handleSelectTabCollection}
        onOpenOptions={openOptions}
      />
    );
  }

  // Show tab collection view
  if (viewMode === 'tabCollection') {
    if (!config) {
      return <div>Loading...</div>;
    }
    return (
      <TabCollectionView
        config={config.bookmarkSite}
        onBack={handleBackToSelector}
      />
    );
  }

  // Show configuration prompt if not configured (bookmark mode)
  if (initialized && !isConfigured) {
    return (
      <div className="relative h-[80vh] min-h-[580px] w-[380px] overflow-hidden rounded-2xl bg-[var(--tab-popup-onboarding-bg)] text-[var(--tab-popup-primary-text)] shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tab-popup-onboarding-radial-top),transparent_70%)] opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tab-popup-onboarding-radial-bottom),transparent_65%)] opacity-80" />
        <div className="absolute inset-0 bg-[color:var(--tab-popup-onboarding-overlay)] backdrop-blur-2xl" />
        <div className="relative flex h-full flex-col">
          <header className="px-6 pt-8 pb-6">
            <div className="rounded-3xl border border-[color:var(--tab-popup-onboarding-card-border)] bg-[color:var(--tab-popup-onboarding-card-bg)] p-5 shadow-xl shadow-[color:var(--tab-popup-onboarding-shadow)] backdrop-blur-xl">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] shadow-lg shadow-[color:var(--tab-popup-primary-shadow-strong)]">
                  <svg className="h-6 w-6 text-[var(--tab-popup-primary-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--tab-popup-onboarding-label)]">Onboarding</p>
                  <h1 className="text-2xl font-semibold text-[var(--tab-popup-primary-text)]">欢迎使用 AI 书签助手</h1>
                  <p className="text-sm text-[color:var(--tab-popup-onboarding-desc)]">完成基础配置，即可为任意网页生成智能标签与分类建议。</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-5 overflow-y-auto px-6 pb-6">
            <section className="rounded-3xl border border-[color:var(--tab-popup-onboarding-card-border)] bg-[color:var(--tab-popup-onboarding-subtle-bg)] p-5 shadow-inner shadow-[color:var(--tab-popup-onboarding-shadow)] backdrop-blur-xl">
              <h2 className="text-sm font-semibold text-[var(--tab-popup-primary-text)]">必备信息</h2>
              <p className="mt-1 text-xs text-[color:var(--tab-popup-onboarding-label)]">准备以下三项配置，助手即可立即开始工作：</p>
              <ol className="mt-4 space-y-3 text-xs text-[color:var(--tab-popup-onboarding-desc)]">
                <li className="flex gap-3 rounded-2xl border border-[color:var(--tab-popup-onboarding-subtle-border)] bg-[color:var(--tab-popup-onboarding-subtle-bg)] p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[color:var(--tab-popup-onboarding-tip-bg)] text-[11px] font-semibold text-[var(--tab-popup-onboarding-tip-text)]">1</span>
                  <div>
                    <p className="font-semibold text-[var(--tab-popup-primary-text)]">AI 服务 API Key</p>
                    <p className="mt-1 text-[11px] text-[color:var(--tab-popup-onboarding-label)]">用于生成智能标签的模型凭证，支持多个主流服务商。</p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-2xl border border-[color:var(--tab-popup-onboarding-subtle-border)] bg-[color:var(--tab-popup-onboarding-subtle-bg)] p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[color:var(--tab-popup-onboarding-tip-bg)] text-[11px] font-semibold text-[var(--tab-popup-onboarding-tip-text)]">2</span>
                  <div>
                    <p className="font-semibold text-[var(--tab-popup-primary-text)]">书签站点 API 地址</p>
                    <p className="mt-1 text-[11px] text-[color:var(--tab-popup-onboarding-label)]">指向你的书签服务端点，默认为 TMarks 官方地址。</p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-2xl border border-[color:var(--tab-popup-onboarding-subtle-border)] bg-[color:var(--tab-popup-onboarding-subtle-bg)] p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[color:var(--tab-popup-onboarding-tip-bg)] text-[11px] font-semibold text-[var(--tab-popup-onboarding-tip-text)]">3</span>
                  <div>
                    <p className="font-semibold text-[var(--tab-popup-primary-text)]">书签站点 API Key</p>
                    <p className="mt-1 text-[11px] text-[color:var(--tab-popup-onboarding-label)]">用于同步与保存书签数据，请在服务端控制台生成密钥。</p>
                  </div>
                </li>
              </ol>
            </section>

            <section className="rounded-3xl border border-[color:var(--tab-popup-onboarding-card-border)] bg-gradient-to-br from-[color:var(--tab-popup-onboarding-tip-bg)] via-[color:var(--tab-popup-onboarding-tip-bg)] to-[color:var(--tab-popup-onboarding-tip-bg)] p-5 shadow-lg shadow-[color:var(--tab-popup-onboarding-shadow)] backdrop-blur-xl">
              <h2 className="text-sm font-semibold text-[var(--tab-popup-primary-text)]">小贴士</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[11px] text-[color:var(--tab-popup-onboarding-desc)]">
                <li>可在设置页保存多个 API 与模型组合，一键切换场景。</li>
                <li>支持自定义 Prompt，满足不同标签风格或语言需求。</li>
                <li>配置完成后，助手会自动抓取当前标签页并生成推荐。</li>
              </ul>
            </section>
          </main>

          <footer className="px-6 pb-6">
            <button
              onClick={openOptions}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--tab-popup-primary-from)] via-[var(--tab-popup-primary-via)] to-[var(--tab-popup-primary-to)] px-6 py-3 text-sm font-semibold text-[var(--tab-popup-primary-text)] shadow-lg shadow-[color:var(--tab-popup-primary-shadow)] transition-all duration-200 hover:shadow-xl hover:shadow-[color:var(--tab-popup-primary-shadow-strong)] active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              前往设置
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[80vh] min-h-[620px] w-[380px] overflow-hidden rounded-2xl bg-[var(--tab-popup-surface)] text-[var(--tab-popup-text)] shadow-2xl">
      {/* 通知消息 - 固定在最顶部 */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-50 px-4 pt-2 space-y-2">
        {error && (
          <div className="pointer-events-auto">
            <ErrorMessage
              message={error}
              onDismiss={() => setError(null)}
              onRetry={!isLoading && lastRecommendationSource === 'fallback' ? recommendTags : undefined}
            />
          </div>
        )}
        {loadingMessage && (
          <div className="pointer-events-auto">
            <LoadingMessage message={loadingMessage} />
          </div>
        )}
        {successMessage && (
          <div className="pointer-events-auto">
            <SuccessMessage message={successMessage} />
          </div>
        )}
      </div>

      <div className="relative flex h-full flex-col">
        <header className="fixed top-0 left-0 right-0 z-20 px-3 pt-2 pb-2.5 bg-[var(--tab-popup-surface)] border-b border-[var(--tab-popup-border)] shadow-sm rounded-b-2xl">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToSelector}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[var(--tab-popup-text-muted)] transition-all duration-200 hover:bg-[var(--tab-popup-action-neutral-bg)] active:scale-95"
              title="返回"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {viewMode === 'bookmark' && isAIEnabled ? (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[var(--tab-popup-badge-blue-bg)] px-2 py-1 text-[10px] text-[var(--tab-popup-badge-blue-text)] font-medium">
                推荐 {recommendedTags.length}
              </span>
            ) : viewMode === 'bookmark' ? (
              <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[var(--tab-popup-badge-amber-bg)] px-2 py-1 text-[10px] text-[var(--tab-popup-badge-amber-text)] font-medium">
                AI 关闭
              </span>
            ) : null}
            {viewMode === 'bookmark' && (
              <>
                <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[var(--tab-popup-badge-indigo-bg)] px-2 py-1 text-[10px] text-[var(--tab-popup-badge-indigo-text)] font-medium">
                  已选 {selectedTags.length}
                </span>
                <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[var(--tab-popup-badge-purple-bg)] px-2 py-1 text-[10px] text-[var(--tab-popup-badge-purple-text)] font-medium">
                  库 {existingTags.length}
                </span>
              </>
            )}
            <div className="ml-auto flex gap-1.5">
              <button
                onClick={() => window.close()}
                className="rounded-lg border border-[var(--tab-popup-border-strong)] bg-[var(--tab-popup-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--tab-popup-text)] transition-all duration-200 hover:bg-[var(--tab-popup-action-neutral-bg)] active:scale-95"
              >
                取消
              </button>
              {viewMode === 'bookmark' ? (
                <button
                  onClick={handleSave}
                  disabled={isSaving || selectedTags.length === 0}
                  className="rounded-lg bg-gradient-to-r from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] px-4 py-1.5 text-[11px] font-semibold text-[var(--tab-popup-primary-text)] shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-1">
                      <svg className="h-3.5 w-3.5 animate-spin text-[var(--tab-popup-primary-text)]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      保存中
                    </span>
                  ) : (
                    '保存书签'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSaveToNewTab}
                  disabled={isSaving || !currentPage?.url}
                  className="rounded-lg bg-gradient-to-r from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] px-4 py-1.5 text-[11px] font-semibold text-[var(--tab-popup-primary-text)] shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                >
                  保存到 NewTab
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="relative flex-1 space-y-2.5 overflow-y-auto px-4 pb-[70px] pt-[60px] bg-[var(--tab-popup-bg)]">
          {viewMode === 'newtab' && (
            <>
              <section className="rounded-xl border border-[var(--tab-popup-section-gray-border)] bg-[var(--tab-popup-section-gray-bg)] p-3.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--tab-popup-text)]">保存到 NewTab</p>
                    <p className="mt-1 text-xs text-[var(--tab-popup-text-muted)]">选择文件夹后保存，或使用 AI 推荐。</p>
                  </div>
                  <span className="rounded-full bg-[var(--tab-popup-section-blue-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--tab-popup-section-blue-badge-text)]">NewTab</span>
                </div>
                {newtabFoldersLoadError && (
                  <div className="mt-2 rounded-lg border border-[var(--tab-popup-border-strong)] bg-[var(--tab-popup-surface)] px-3 py-2 text-xs text-[var(--tab-popup-text-muted)]">
                    {newtabFoldersLoadError}
                  </div>
                )}
                {newtabBreadcrumb.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1 text-xs text-[var(--tab-popup-text-muted)]">
                    {newtabBreadcrumb.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => enterNewtabFolder(c.id)}
                        className="rounded-md bg-[var(--tab-popup-action-neutral-bg)] px-2 py-1 hover:bg-[var(--tab-popup-action-neutral-bg-hover)] transition-colors"
                      >
                        {idx === 0 ? '根目录' : c.title}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleRecommendNewtabFolder}
                    disabled={isNewtabRecommending || !currentPage?.url || !newtabFoldersLoaded}
                    className="rounded-lg border border-[var(--tab-popup-border-strong)] bg-[var(--tab-popup-surface)] px-3 py-2 text-xs font-medium text-[var(--tab-popup-text)] transition-all duration-200 hover:bg-[var(--tab-popup-action-neutral-bg)] disabled:opacity-40"
                  >
                    {isNewtabRecommending ? 'AI 推荐中...' : 'AI 推荐文件夹'}
                  </button>
                  <button
                    onClick={loadNewtabFolders}
                    className="rounded-lg border border-[var(--tab-popup-border-strong)] bg-[var(--tab-popup-surface)] px-3 py-2 text-xs font-medium text-[var(--tab-popup-text)] transition-all duration-200 hover:bg-[var(--tab-popup-action-neutral-bg)]"
                  >
                    刷新文件夹
                  </button>
                </div>
              </section>

              {newtabSuggestions.length > 0 && (
                <section className="rounded-xl border border-[var(--tab-popup-section-purple-border)] bg-gradient-to-br from-[var(--tab-popup-section-purple-from)] to-[var(--tab-popup-section-purple-to)] p-3.5 shadow-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--tab-popup-text)]">AI 推荐文件夹</p>
                    <span className="rounded-full bg-[var(--tab-popup-section-purple-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--tab-popup-section-purple-badge-text)]">
                      {newtabSuggestions.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {newtabSuggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => enterNewtabFolder(s.id)}
                        className="inline-flex items-center rounded-lg bg-[var(--tab-popup-action-neutral-bg)] px-2.5 py-1 text-xs font-medium text-[var(--tab-popup-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)] transition-colors"
                        title={s.path}
                      >
                        <span className="truncate max-w-[240px]">{s.path.replace(/^Tmakrs\//, '')}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-xl border border-[var(--tab-popup-section-emerald-border)] bg-gradient-to-br from-[var(--tab-popup-section-emerald-from)] to-[var(--tab-popup-section-emerald-to)] p-3.5 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--tab-popup-text)]">选择文件夹</p>
                  <span className="text-xs text-[var(--tab-popup-text-muted)]">点击进入</span>
                </div>
                <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[var(--tab-popup-border-strong)] scrollbar-track-transparent">
                  <div className="space-y-1">
                    {newtabFolders
                      .filter((f) => f.parentId === (currentNewtabFolderId || newtabRootId))
                      .filter((f) => f.id !== (currentNewtabFolderId || newtabRootId))
                      .map((f) => (
                        <button
                          key={f.id}
                          onClick={() => enterNewtabFolder(f.id)}
                          className="w-full flex items-center justify-between rounded-lg bg-[var(--tab-popup-action-neutral-bg)] px-3 py-2 text-left text-sm text-[var(--tab-popup-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)] transition-colors"
                        >
                          <span className="truncate">{f.title}</span>
                          <span className="text-xs text-[var(--tab-popup-text-muted)]">进入</span>
                        </button>
                      ))}
                    {newtabFolders.filter((f) => f.parentId === (currentNewtabFolderId || newtabRootId)).length === 0 && (
                      <div className="py-4 text-center text-xs text-[var(--tab-popup-text-muted)]">当前层级没有子文件夹</div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
          {isRecommending && (
            <section className="flex items-center gap-3 rounded-xl border border-[var(--tab-popup-border)] bg-[var(--tab-popup-section-gray-bg)] p-3.5 text-sm text-[var(--tab-popup-text)] shadow-lg">
              <LoadingSpinner />
              <p>AI 正在分析当前页面，请稍候...</p>
            </section>
          )}

          {!isAIEnabled && !isRecommending && recommendedTags.length === 0 && (
            <section className="rounded-xl border border-[var(--tab-popup-section-amber-border)] bg-gradient-to-br from-[var(--tab-popup-section-amber-from)] to-[var(--tab-popup-section-amber-to)] p-3.5 shadow-lg">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-[var(--tab-popup-section-amber-icon)] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[var(--tab-popup-section-amber-title)]">AI 推荐已关闭</p>
                  <p className="mt-1 text-xs text-[var(--tab-popup-section-amber-text)]">请从下方标签库中选择标签，或在设置中启用 AI 推荐。</p>
                </div>
              </div>
            </section>
          )}

          {selectedTags.length > 0 && (
            <section className="rounded-xl border border-[var(--tab-popup-section-blue-border)] bg-gradient-to-br from-[var(--tab-popup-section-blue-from)] to-[var(--tab-popup-section-blue-to)] p-3.5 shadow-lg">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--tab-popup-text)]">已选择标签</p>
                  <span className="text-[10px] text-[var(--tab-popup-text-muted)]">点击标签可取消选择。</span>
                </div>
                <span className="rounded-full bg-[var(--tab-popup-section-blue-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--tab-popup-section-blue-badge-text)]">
                  {selectedTags.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    title="点击移除标签"
                    className={getSelectedTagClass(tagTheme)}
                  >
                    <span className="truncate max-w-[120px]">{tag}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {currentPage && (
            <section className="rounded-xl border border-[var(--tab-popup-section-gray-border)] bg-[var(--tab-popup-section-gray-bg)] p-3.5 shadow-lg">
              <div className="mb-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
                      isPublic
                        ? 'bg-[var(--tab-popup-action-emerald-bg)] text-[var(--tab-popup-action-emerald-text)] hover:bg-[var(--tab-popup-action-emerald-bg-hover)]'
                        : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
                    }`}
                    title={isPublic ? '公开（点击切换为隐私）' : '隐私（点击切换为公开）'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {isPublic ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      )}
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleThumbnail}
                    disabled={!currentPage.thumbnail}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
                      includeThumbnail
                        ? 'bg-[var(--tab-popup-action-amber-bg)] text-[var(--tab-popup-action-amber-text)] hover:bg-[var(--tab-popup-action-amber-bg-hover)]'
                        : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
                    } ${!currentPage.thumbnail ? 'cursor-not-allowed opacity-40' : ''}`}
                    title={includeThumbnail ? '包含封面图（点击取消）' : '不包含封面图（点击添加）'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateSnapshot(!createSnapshot)}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
                      createSnapshot
                        ? 'bg-[var(--tab-popup-action-purple-bg)] text-[var(--tab-popup-action-purple-text)] hover:bg-[var(--tab-popup-action-purple-bg-hover)]'
                        : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
                    }`}
                    title={createSnapshot ? '创建快照（点击取消）' : '不创建快照（点击创建）'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTitleEdit(!showTitleEdit)}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
                      showTitleEdit
                        ? 'bg-[var(--tab-popup-action-blue-bg)] text-[var(--tab-popup-action-blue-text)] hover:bg-[var(--tab-popup-action-blue-bg-hover)]'
                        : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
                    }`}
                    title={showTitleEdit ? '修改标题（点击收起）' : '修改标题（点击展开）'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowDescEdit(!showDescEdit)}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
                      showDescEdit
                        ? 'bg-[var(--tab-popup-action-blue-bg)] text-[var(--tab-popup-action-blue-text)] hover:bg-[var(--tab-popup-action-blue-bg-hover)]'
                        : 'bg-[var(--tab-popup-action-neutral-bg)] text-[var(--tab-popup-action-neutral-text)] hover:bg-[var(--tab-popup-action-neutral-bg-hover)]'
                    }`}
                    title={showDescEdit ? '修改描述（点击收起）' : '修改描述（点击展开）'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </button>
              </div>
              <div className="mb-2.5 space-y-2">

                {/* 标题编辑区域 */}
                {showTitleEdit && (
                  <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    <input
                      type="text"
                      value={titleOverride}
                      onChange={(e) => setTitleOverride(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyTitleOverride();
                        }
                      }}
                      placeholder="输入自定义标题后回车或点击应用"
                      className="flex-1 rounded-xl border border-[var(--tab-popup-input-border)] bg-[var(--tab-popup-input-bg)] px-3 py-2 text-sm text-[var(--tab-popup-input-text)] placeholder:text-[var(--tab-popup-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-popup-input-focus-ring)] focus:border-[var(--tab-popup-input-focus-border)]"
                      autoFocus
                    />
                    <button
                      onClick={handleApplyTitleOverride}
                      disabled={!titleOverride.trim() || !currentPage}
                      className="rounded-xl bg-gradient-to-r from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] px-4 py-2 text-sm font-medium text-[var(--tab-popup-primary-text)] shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                    >
                      应用
                    </button>
                  </div>
                )}

                {/* 描述编辑区域 */}
                {showDescEdit && (
                  <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    <textarea
                      value={descriptionOverride}
                      onChange={(e) => setDescriptionOverride(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleApplyDescriptionOverride();
                        }
                      }}
                      placeholder="输入自定义描述后 Ctrl+Enter 或点击应用"
                      rows={2}
                      className="flex-1 rounded-xl border border-[var(--tab-popup-input-border)] bg-[var(--tab-popup-input-bg)] px-3 py-2 text-sm text-[var(--tab-popup-input-text)] placeholder:text-[var(--tab-popup-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-popup-input-focus-ring)] focus:border-[var(--tab-popup-input-focus-border)] resize-none"
                      autoFocus
                    />
                    <button
                      onClick={handleApplyDescriptionOverride}
                      disabled={!currentPage}
                      className="rounded-xl bg-gradient-to-r from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] px-4 py-2 text-sm font-medium text-[var(--tab-popup-primary-text)] shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                    >
                      应用
                    </button>
                  </div>
                )}
              </div>
              <PageInfoCard
                title={currentPage.title}
                url={currentPage.url}
                description={currentPage.description}
                thumbnail={includeThumbnail ? currentPage.thumbnail : undefined}
                thumbnails={includeThumbnail ? currentPage.thumbnails : undefined}
                favicon={currentPage.favicon}
                onThumbnailChange={(newThumbnail) => {
                  setCurrentPage({ ...currentPage, thumbnail: newThumbnail });
                }}
              />
            </section>
          )}

          {viewMode === 'bookmark' && recommendedTags.length > 0 && (
            <section className="rounded-xl border border-[var(--tab-popup-section-purple-border)] bg-gradient-to-br from-[var(--tab-popup-section-purple-from)] to-[var(--tab-popup-section-purple-to)] p-3.5 shadow-lg">
              <div className="mb-2.5 flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--tab-popup-text)]">
                    AI 推荐
                  </h2>
                  <p className="mt-1 text-xs text-[var(--tab-popup-text-muted)]">根据页面内容实时生成，点击可快速选择。</p>
                </div>
                <span className="rounded-full bg-[var(--tab-popup-section-purple-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--tab-popup-section-purple-badge-text)]">
                  {recommendedTags.length}
                </span>
              </div>
              <TagList tags={recommendedTags} selectedTags={selectedTags} onToggle={toggleTag} theme={tagTheme} />
            </section>
          )}

          {viewMode === 'bookmark' && (
            <section className="rounded-xl border border-[var(--tab-popup-section-emerald-border)] bg-gradient-to-br from-[var(--tab-popup-section-emerald-from)] to-[var(--tab-popup-section-emerald-to)] p-3.5 shadow-lg">
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--tab-popup-text)]">
                  <svg className="h-4 w-4 text-[var(--tab-popup-section-emerald-icon)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  标签库
                </h2>
                <p className="mt-1 text-xs text-[var(--tab-popup-text-muted)]">与你的历史标签数据同步，点选即可加入。</p>
              </div>
              <span className="rounded-full bg-[var(--tab-popup-section-emerald-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--tab-popup-section-emerald-badge-text)]">
                {existingTags.length}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[var(--tab-popup-border-strong)] scrollbar-track-transparent">
              {existingTags.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <p className="text-xs text-[var(--tab-popup-text-muted)]">
                    {isLoading ? '加载中...' : '暂无标签'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {existingTags
                    .sort((a, b) => b.count - a.count)
                    .map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.name)}
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ${
                            getExistingTagClass(tagTheme, isSelected)
                          }`}
                        >
                          {tagTheme !== 'bw' && (
                            <span
                              className="mr-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: tag.color || 'var(--tab-message-success-icon)' }}
                            />
                          )}
                          <span className="truncate max-w-[110px]">{tag.name}</span>
                          {tag.count > 0 && (
                            <span className="ml-1 text-[10px] opacity-60">({tag.count})</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
            </section>
          )}

          {lastSaveDurationMs !== null && (
            <section className="rounded-xl border border-[var(--tab-popup-section-gray-border)] bg-[var(--tab-popup-section-gray-bg)] p-2.5 text-xs text-[var(--tab-popup-text-muted)] shadow-sm">
              最近一次保存耗时 {(lastSaveDurationMs / 1000).toFixed(2)}s
            </section>
          )}
        </main>

        {/* Fixed Footer - Custom Tag Input */}
        <footer className="fixed bottom-0 left-0 right-0 z-20 px-3 pt-2 pb-2.5 bg-[var(--tab-popup-footer-bg)] border-t border-[var(--tab-popup-footer-border)] shadow-sm rounded-t-2xl">
          {viewMode !== 'bookmark' ? null : (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0 text-[var(--tab-popup-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入标签名并回车添加"
              className="flex-1 rounded-xl border border-[var(--tab-popup-input-border)] bg-[var(--tab-popup-input-bg)] px-3 py-1.5 text-sm text-[var(--tab-popup-input-text)] placeholder:text-[var(--tab-popup-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-popup-input-focus-ring)] focus:border-[var(--tab-popup-input-focus-border)]"
            />
            <button
              onClick={handleAddCustomTag}
              disabled={!customTagInput.trim()}
              className="rounded-xl bg-gradient-to-r from-[var(--tab-popup-primary-from)] to-[var(--tab-popup-primary-via)] px-4 py-1.5 text-sm font-medium text-[var(--tab-popup-primary-text)] shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              添加
            </button>
          </div>
          )}
        </footer>

      </div>

      {/* Bookmark Exists Dialog */}
      {existingBookmark && existingBookmark.needsDialog && (
        <BookmarkExistsDialog
          bookmark={existingBookmark}
          newTags={selectedTags}
          onUpdateTags={async (tags) => {
            if (existingBookmark.id) {
              await updateExistingBookmarkTags(existingBookmark.id, tags);
            }
          }}
          onUpdateDescription={async (description) => {
            if (existingBookmark.id) {
              await updateExistingBookmarkDescription(existingBookmark.id, description);
            }
          }}
          onCreateSnapshot={async () => {
            if (existingBookmark.id) {
              await createSnapshotForBookmark(existingBookmark.id);
            }
          }}
          onCancel={() => setExistingBookmark(null)}
        />
      )}
    </div>
  );
}
