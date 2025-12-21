import { useEffect, useRef, useState } from 'react';
import type { AIProvider, AIConnectionInfo } from '@/types';
import { AI_SERVICE_URLS, AI_SERVICE_DOCS } from '@/lib/constants/urls';

interface AIConfigSectionProps {
  formData: {
    aiProvider: AIProvider;
    apiKey: string;
    apiUrl: string;
    aiModel: string;
  };
  setFormData: (data: any) => void;
  handleProviderChange: (provider: AIProvider) => void;
  handleTestConnection: () => Promise<void>;
  isTesting: boolean;
  availableModels: string[];
  isFetchingModels: boolean;
  modelFetchError: string | null;
  onRefreshModels: () => void;
  modelFetchSupported: boolean;
  allSavedConnections: Array<AIConnectionInfo & { provider: AIProvider }>;
  onApplySavedConnection: (connection: AIConnectionInfo, providerOverride?: AIProvider) => void;
  onDeleteSavedConnection: (connection: AIConnectionInfo, providerOverride?: AIProvider) => void;
  onSaveConnectionPreset: () => void;
}

export function AIConfigSection({
  formData,
  setFormData,
  handleProviderChange,
  handleTestConnection,
  isTesting,
  availableModels,
  isFetchingModels,
  modelFetchError,
  onRefreshModels,
  modelFetchSupported,
  allSavedConnections,
  onApplySavedConnection,
  onDeleteSavedConnection,
  onSaveConnectionPreset
}: AIConfigSectionProps) {
  const hasModelOptions = availableModels.length > 0;
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement | null>(null);
  const providerNameMap: Record<AIProvider, string> = {
    openai: 'OpenAI',
    claude: 'Claude',
    deepseek: 'DeepSeek',
    zhipu: '智谱AI',
    modelscope: 'ModelScope',
    siliconflow: 'SiliconFlow',
    iflow: '讯飞星火',
    custom: '自定义'
  };

  useEffect(() => {
    if (!modelDropdownOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [modelDropdownOpen]);

  useEffect(() => {
    if (!hasModelOptions) {
      setModelDropdownOpen(false);
    }
  }, [hasModelOptions]);

  useEffect(() => {
    if (allSavedConnections.length <= 3 && showAllConnections) {
      setShowAllConnections(false);
    }
  }, [allSavedConnections.length, showAllConnections]);

  const handleSelectModel = (model: string) => {
    setFormData((prev: any) => ({
      ...prev,
      aiModel: model
    }));
    setModelDropdownOpen(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] shadow-sm backdrop-blur transition-shadow hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--tab-options-modal-topbar-from)] via-[var(--tab-options-modal-topbar-via)] to-[var(--tab-options-modal-topbar-to)]" />

      <div className="p-8 pt-12 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--tab-options-title)]">AI 配置</h2>
            <p className="mt-2 text-sm text-[var(--tab-options-text)]">
              连接你的智能标签服务，管理模型与调用策略。
            </p>
          </div>
          <button
            type="button"
            onClick={onSaveConnectionPreset}
            disabled={!formData.apiKey.trim()}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              formData.apiKey.trim()
                ? 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] hover:bg-[var(--tab-options-button-primary-hover)] shadow-sm'
                : 'bg-[var(--tab-options-button-hover-bg)] text-[var(--tab-options-text-muted)] cursor-not-allowed'
            }`}
          >
            保存当前配置
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--tab-options-title)]">已保存的全部配置</h3>
              <div className="flex items-center gap-2 text-xs text-[var(--tab-options-text-muted)]">
                <span>共 {allSavedConnections.length} 个</span>
                {allSavedConnections.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllConnections(prev => !prev)}
                    className="rounded-full border border-[color:var(--tab-options-button-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--tab-options-button-text)] transition-colors hover:bg-[var(--tab-options-button-hover-bg)]"
                  >
                    {showAllConnections ? '收起' : `展开更多 (${allSavedConnections.length - 3})`}
                  </button>
                )}
              </div>
            </div>
            {allSavedConnections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[color:var(--tab-options-button-border)] bg-[color:var(--tab-options-card-bg)] p-6 text-sm text-[var(--tab-options-text-muted)]">
                目前还没有保存过任何配置，填写好 API 信息后点击「保存当前配置」即可创建预设。
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(showAllConnections ? allSavedConnections : allSavedConnections.slice(0, 3)).map((connection, index) => (
                  <div
                    key={connection.id || `${connection.provider || 'unknown'}-${connection.label || connection.apiUrl || 'default'}-${index}`}
                    className="group flex flex-col justify-between gap-3 rounded-2xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-[color:var(--tab-options-modal-border)] hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="text-sm font-semibold text-[var(--tab-options-title)] truncate"
                        title={connection.label || connection.apiUrl || '未命名配置'}
                      >
                        {connection.label || '未命名配置'}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--tab-options-pill-bg)] text-[var(--tab-options-pill-text)] px-2 py-0.5 text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--tab-options-button-primary-bg)]" />
                        {providerNameMap[connection.provider || formData.aiProvider]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onApplySavedConnection(connection, connection.provider)}
                        className="flex-1 rounded-lg bg-[var(--tab-options-button-primary-bg)] px-3 py-2 text-xs font-medium text-[var(--tab-options-button-primary-text)] transition-colors hover:bg-[var(--tab-options-button-primary-hover)]"
                      >
                        使用
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSavedConnection(connection, connection.provider)}
                        className="rounded-lg border border-[color:var(--tab-options-button-border)] px-3 py-2 text-xs font-medium text-[var(--tab-options-button-text)] transition-colors hover:bg-[var(--tab-options-button-hover-bg)]"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-3">
              AI 引擎
            </label>
            <select
              value={formData.aiProvider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              className="w-full px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)]"
            >
              <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="zhipu">智谱AI (GLM-4)</option>
              <option value="modelscope">ModelScope (通义千问)</option>
              <option value="siliconflow">SiliconFlow</option>
              <option value="iflow">iFlytek Spark (讯飞星火)</option>
              <option value="custom">自定义 API</option>
            </select>
          </div>

          {(formData.aiProvider === 'custom' || formData.aiProvider === 'siliconflow' || formData.aiProvider === 'deepseek' || formData.aiProvider === 'openai') && (
            <div>
              <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-3">
                API 地址
              </label>
              <input
                type="url"
                value={formData.apiUrl}
                onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                placeholder={
                  formData.aiProvider === 'openai'
                    ? AI_SERVICE_URLS.OPENAI
                    : formData.aiProvider === 'deepseek'
                      ? AI_SERVICE_URLS.DEEPSEEK
                      : formData.aiProvider === 'siliconflow'
                        ? AI_SERVICE_URLS.SILICONFLOW
                        : '请输入自定义 API 地址'
                }
                className="w-full px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--tab-options-text)] mb-3">
              API Key
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder={
                formData.aiProvider === 'openai'
                  ? '请输入 OpenAI API Key'
                  : formData.aiProvider === 'claude'
                    ? '请输入 Claude API Key'
                    : formData.aiProvider === 'deepseek'
                      ? '请输入 DeepSeek API Key'
                      : formData.aiProvider === 'zhipu'
                        ? '请输入智谱 API Key'
                        : formData.aiProvider === 'modelscope'
                          ? '请输入 ModelScope API Key'
                          : formData.aiProvider === 'siliconflow'
                            ? '请输入 SiliconFlow API Key'
                            : formData.aiProvider === 'iflow'
                              ? '请输入讯飞星火 API Key'
                              : '请输入 API Key'
              }
              className="w-full px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)]"
            />
            <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">
              {formData.aiProvider === 'openai' && (
                <>
                  获取 API Key：
                  <a
                    href={AI_SERVICE_DOCS.OPENAI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--tab-options-pill-text)] hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </>
              )}
              {formData.aiProvider === 'claude' && (
                <>
                  获取 API Key：
                  <a
                    href={AI_SERVICE_DOCS.CLAUDE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--tab-options-pill-text)] hover:underline"
                  >
                    Anthropic Console
                  </a>
                </>
              )}
              {formData.aiProvider === 'deepseek' && (
                <>
                  获取 API Key：
                  <a
                    href={AI_SERVICE_DOCS.DEEPSEEK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--tab-options-pill-text)] hover:underline"
                  >
                    DeepSeek Platform
                  </a>
                </>
              )}
              {formData.aiProvider === 'zhipu' && (
                <>
                  获取 API Key：
                  <a
                    href={AI_SERVICE_DOCS.ZHIPU}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--tab-options-pill-text)] hover:underline"
                  >
                    智谱AI开放平台
                  </a>
                </>
              )}
              {formData.aiProvider === 'modelscope' && (
                <>
                  获取 API Key：
                  <a
                    href={AI_SERVICE_DOCS.MODELSCOPE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--tab-options-pill-text)] hover:underline"
                  >
                    ModelScope
                  </a>
                </>
              )}
              {formData.aiProvider === 'siliconflow' && (
                <>
                  获取 API Key：
                  <a
                    href={AI_SERVICE_DOCS.SILICONFLOW}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--tab-options-pill-text)] hover:underline"
                  >
                    SiliconFlow
                  </a>
                </>
              )}
              {formData.aiProvider === 'iflow' && (
                <>
                  获取 API Key：
                  <a
                    href={AI_SERVICE_DOCS.IFLOW}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--tab-options-pill-text)] hover:underline"
                  >
                    讯飞开放平台
                  </a>
                </>
              )}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[var(--tab-options-text)]">
                模型
              </label>
              <button
                type="button"
                onClick={onRefreshModels}
                disabled={!modelFetchSupported || isFetchingModels || !formData.apiKey.trim()}
                className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  !modelFetchSupported || isFetchingModels || !formData.apiKey.trim()
                    ? 'bg-[var(--tab-options-button-hover-bg)] text-[var(--tab-options-text-muted)] cursor-not-allowed'
                    : 'bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] hover:bg-[var(--tab-options-button-primary-hover)]'
                }`}
              >
                {isFetchingModels ? '获取中...' : '刷新模型'}
              </button>
            </div>
            <div className="relative w-full" ref={modelDropdownRef}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.aiModel}
                  onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                  placeholder={
                    formData.aiProvider === 'openai'
                      ? 'gpt-4o-mini (推荐) 或 gpt-4o'
                      : formData.aiProvider === 'claude'
                        ? 'claude-3-5-sonnet-20241022 (推荐)'
                        : formData.aiProvider === 'deepseek'
                          ? 'deepseek-chat'
                          : formData.aiProvider === 'zhipu'
                            ? 'glm-4-flash (推荐) 或 glm-4-plus'
                            : formData.aiProvider === 'modelscope'
                              ? 'qwen-plus 或 qwen-turbo'
                              : formData.aiProvider === 'siliconflow'
                                ? 'Qwen/Qwen2.5-7B-Instruct'
                                : formData.aiProvider === 'iflow'
                                  ? 'spark-lite 或 spark-pro'
                                  : '请输入模型名称'
                  }
                  className="flex-1 px-3 py-2 border border-[color:var(--tab-options-button-border)] rounded-lg bg-[color:var(--tab-options-card-bg)] text-[var(--tab-options-title)] focus:outline-none focus:ring-2 focus:ring-[var(--tab-options-button-primary-bg)]"
                />
                {hasModelOptions && (
                  <button
                    type="button"
                    onClick={() => setModelDropdownOpen((open) => !open)}
                    className="px-3 py-2 rounded-lg bg-[var(--tab-options-button-hover-bg)] text-[var(--tab-options-button-text)] hover:bg-[color:var(--tab-options-button-border)] transition-colors flex items-center gap-1"
                  >
                    <span className="text-sm font-medium">选择模型</span>
                    <span className={`transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                )}
              </div>
              {hasModelOptions && modelDropdownOpen && (
                <div className="absolute z-10 mt-2 right-0 w-full max-h-[33vh] overflow-y-auto rounded-lg border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-modal-bg)] shadow-2xl">
                  {availableModels.map((model) => {
                    const isActive = formData.aiModel === model;
                    return (
                      <button
                        key={model}
                        type="button"
                        onClick={() => handleSelectModel(model)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-[color:var(--tab-options-pill-bg)] text-[var(--tab-options-pill-text)]'
                            : 'text-[var(--tab-options-button-text)] hover:bg-[var(--tab-options-button-hover-bg)]'
                        }`}
                      >
                        {model}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {hasModelOptions && (
              <p className="mt-2 text-xs text-[var(--tab-options-pill-text)]">
                已获取 {availableModels.length} 个模型，可直接选择或手动输入。
              </p>
            )}
            {modelFetchError && (
              <p className="mt-2 text-xs text-[var(--tab-options-danger-text)]">
                模型列表加载失败：{modelFetchError}
              </p>
            )}
            {!hasModelOptions && modelFetchSupported && !modelFetchError && !isFetchingModels && (
              <p className="mt-2 text-xs text-[var(--tab-options-text-muted)]">
                输入 API 地址与 Key 后可刷新获取可用模型列表。
              </p>
            )}
          </div>

          <div>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !formData.apiKey}
              className="px-4 py-2 bg-[var(--tab-options-button-primary-bg)] hover:bg-[var(--tab-options-button-primary-hover)] disabled:opacity-50 text-[var(--tab-options-button-primary-text)] rounded-lg transition-colors duration-200"
            >
              {isTesting ? '测试中...' : '测试连接'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
