/**
 * 设置面板组件 - 多标签页版本
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Cloud, User, ExternalLink, Palette, Sparkles } from 'lucide-react';
import { ConfirmModal } from './ui/ConfirmModal';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { SEARCH_ENGINES } from '../constants';
import { StorageService } from '@/lib/utils/storage';
import { getTMarksUrls } from '@/lib/constants/urls';
import { Z_INDEX } from '../constants/z-index';
import { NEWTAB_WORKSPACE_ORGANIZE_PROMPT_TEMPLATE } from '@/lib/constants/newtabPrompts';
import type { ClockFormat, SearchEngine, WallpaperType } from '../types';

interface SettingsPanelProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'sync' | 'ai';

const TABS = [
  { id: 'general' as const, label: '常规', icon: User },
  { id: 'appearance' as const, label: '外观', icon: Palette },
  { id: 'sync' as const, label: '同步', icon: Cloud },
  { id: 'ai' as const, label: 'AI 整理', icon: Sparkles },
];

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings } = useNewtabStore();
  const [tmarksUrl, setTmarksUrl] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [importAllLoading, setImportAllLoading] = useState(false);
  const [importAllMessage, setImportAllMessage] = useState<string | null>(null);
  const [importAllError, setImportAllError] = useState<string | null>(null);
  const [aiOrganizeLoading, setAiOrganizeLoading] = useState(false);
  const [aiOrganizeMessage, setAiOrganizeMessage] = useState<string | null>(null);
  const [aiOrganizeError, setAiOrganizeError] = useState<string | null>(null);

  const [aiOrganizeConsoleOpen, setAiOrganizeConsoleOpen] = useState(false);
  const [aiOrganizeSessionId, setAiOrganizeSessionId] = useState<string | null>(null);
  const [aiOrganizeLogs, setAiOrganizeLogs] = useState<Array<{ ts: number; level: string; step: string; message: string; detail?: any }>>([]);
  const [aiOrganizeConsoleAutoScroll, setAiOrganizeConsoleAutoScroll] = useState(true);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showAiOrganizeConfirm, setShowAiOrganizeConfirm] = useState(false);

  // 加载 TMarks 网站 URL
  useEffect(() => {
    const loadTMarksUrl = async () => {
      const config = await StorageService.getTMarksConfig();
      if (config?.bookmarkApiUrl) {
        const baseUrl = config.bookmarkApiUrl.replace(/\/api\/?$/, '');
        setTmarksUrl(baseUrl);
      } else {
        setTmarksUrl(getTMarksUrls().BASE_URL);
      }
    };
    loadTMarksUrl();
  }, []);

  useEffect(() => {
    if (!aiOrganizeSessionId) return;

    const handler = (msg: any) => {
      const type = String(msg?.type ?? '').trim().toUpperCase();
      if (type !== 'AI_ORGANIZE_PROGRESS') return;
      const payload = msg?.payload;
      if (!payload || payload.sessionId !== aiOrganizeSessionId) return;

      setAiOrganizeLogs((prev) => {
        const next = [...prev, payload];
        return next.length > 500 ? next.slice(next.length - 500) : next;
      });
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => {
      try {
        chrome.runtime.onMessage.removeListener(handler);
      } catch {
        // ignore
      }
    };
  }, [aiOrganizeSessionId]);

  const handleClearAiOrganizeLogs = useCallback(() => {
    setAiOrganizeLogs([]);
  }, []);

  const handleCloseAiOrganizeConsole = useCallback(() => {
    setAiOrganizeConsoleOpen(false);
    handleClearAiOrganizeLogs();
  }, [handleClearAiOrganizeLogs]);

  // 导入书签确认后的处理
  const handleImportConfirm = async () => {
    setShowImportConfirm(false);
    try {
      setImportAllMessage(null);
      setImportAllError(null);
      setImportAllLoading(true);

      const resp = (await chrome.runtime.sendMessage({
        type: 'IMPORT_ALL_BOOKMARKS_TO_NEWTAB',
      })) as { success: boolean; data?: any; error?: string };

      if (!resp?.success) {
        throw new Error(resp?.error || '导入失败');
      }

      const folderTitle = resp.data?.folderTitle || 'Imported';
      const folders = resp.data?.counts?.folders ?? 0;
      const bookmarks = resp.data?.counts?.bookmarks ?? 0;
      setImportAllMessage(`导入完成：${folderTitle}（目录 ${folders} 个，书签 ${bookmarks} 个）`);
    } catch (e) {
      setImportAllError(e instanceof Error ? e.message : '导入失败');
    } finally {
      setImportAllLoading(false);
    }
  };

  // 使用 Portal 直接渲染到 body，确保在全局层级
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/60 animate-fadeIn"
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[600px] rounded-2xl glass-modal-dark flex flex-col overflow-hidden"
        style={{ zIndex: Z_INDEX.MODAL_CONTENT, animation: 'modalScale 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-medium text-white">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* 底部容器：左侧标签栏 + 右侧内容区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧标签栏 */}
          <div className="w-48 flex-shrink-0 border-r border-white/10 py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
                  )}
                </button>
              );
            })}

          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* 个性化 */}
                <SettingSection title="个性化">
                  <ToggleItem
                    label="显示问候语"
                    checked={settings.showGreeting}
                    onChange={(v) => updateSettings({ showGreeting: v })}
                  />
                  <TextItem
                    label="你的名字"
                    value={settings.userName}
                    placeholder="可选"
                    onChange={(v) => updateSettings({ userName: v })}
                  />
                </SettingSection>

                {/* 时钟 */}
                <SettingSection title="时钟">
                  <ToggleItem
                    label="显示时钟"
                    checked={settings.showClock}
                    onChange={(v) => updateSettings({ showClock: v })}
                  />
                  {settings.showClock && (
                    <>
                      <ToggleItem
                        label="显示日期"
                        checked={settings.showDate}
                        onChange={(v) => updateSettings({ showDate: v })}
                      />
                      <ToggleItem
                        label="显示秒数"
                        checked={settings.showSeconds}
                        onChange={(v) => updateSettings({ showSeconds: v })}
                      />
                      <ToggleItem
                        label="显示农历"
                        checked={settings.showLunar}
                        onChange={(v) => updateSettings({ showLunar: v })}
                      />
                      <SelectItem
                        label="时间格式"
                        value={settings.clockFormat}
                        options={[
                          { value: '24h', label: '24 小时制' },
                          { value: '12h', label: '12 小时制' },
                        ]}
                        onChange={(v) => updateSettings({ clockFormat: v as ClockFormat })}
                      />
                    </>
                  )}
                </SettingSection>

                <SettingSection title="诗词">
                  <ToggleItem
                    label="显示每日诗词"
                    checked={settings.showPoetry}
                    onChange={(v) => updateSettings({ showPoetry: v })}
                  />
                </SettingSection>

                <SettingSection title="搜索">
                  <ToggleItem
                    label="显示搜索框"
                    checked={settings.showSearch}
                    onChange={(v) => updateSettings({ showSearch: v })}
                  />
                  <SelectItem
                    label="搜索引擎"
                    value={settings.searchEngine}
                    options={SEARCH_ENGINES.map((e) => ({ value: e.id, label: e.name }))}
                    onChange={(v) => updateSettings({ searchEngine: v as SearchEngine })}
                  />
                </SettingSection>

                <SettingSection title="离线缓存">
                  <CacheFaviconsButton />
                </SettingSection>

                <SettingSection title="使用说明">
                  <div className="text-sm text-white/70 leading-relaxed space-y-2">
                    <div>1. 编辑模式下，双击文件夹可以进入文件夹。</div>
                    <div>2. 首页滚轮切分组：在图标区域内可滚动时优先滚动，滚到边界继续滚动才会切换分组。</div>
                    <div>3. 单个分组图标过多时，可在图标区域滚动进行左右翻页。</div>
                  </div>
                </SettingSection>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <SettingSection title="快捷方式">
                  <ToggleItem
                    label="显示快捷方式"
                    checked={settings.showShortcuts}
                    onChange={(v) => updateSettings({ showShortcuts: v })}
                  />
                  <SelectItem
                    label="每行数量"
                    value={String(settings.shortcutColumns)}
                    options={[
                      { value: '6', label: '6 个' },
                      { value: '8', label: '8 个' },
                      { value: '10', label: '10 个' },
                    ]}
                    onChange={(v) => updateSettings({ shortcutColumns: Number(v) as 6 | 8 | 10 })}
                  />
                  <SelectItem
                    label="样式"
                    value={settings.shortcutStyle}
                    options={[
                      { value: 'icon', label: '图标' },
                      { value: 'card', label: '卡片' },
                    ]}
                    onChange={(v) => updateSettings({ shortcutStyle: v as 'icon' | 'card' })}
                  />
                </SettingSection>

                <SettingSection title="壁纸">
                  <SelectItem
                    label="壁纸类型"
                    value={settings.wallpaper.type}
                    options={[
                      { value: 'color', label: '纯色' },
                      { value: 'bing', label: 'Bing 每日壁纸' },
                      { value: 'unsplash', label: '随机风景' },
                      { value: 'image', label: '自定义图片' },
                    ]}
                    onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, type: v as WallpaperType } })}
                  />
                  {settings.wallpaper.type === 'color' && (
                    <ColorItem
                      label="背景颜色"
                      value={settings.wallpaper.value}
                      onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, value: v } })}
                    />
                  )}
                  {settings.wallpaper.type === 'bing' && (
                    <>
                      <SelectItem
                        label="历史图片"
                        value={String(settings.wallpaper.bingHistoryIndex || 0)}
                        options={[
                          { value: '0', label: '今天' },
                          { value: '1', label: '昨天' },
                          { value: '2', label: '2 天前' },
                          { value: '3', label: '3 天前' },
                          { value: '4', label: '4 天前' },
                          { value: '5', label: '5 天前' },
                          { value: '6', label: '6 天前' },
                          { value: '7', label: '7 天前' },
                        ]}
                        onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, bingHistoryIndex: Number(v) } })}
                      />
                      <ToggleItem
                        label="显示图片信息"
                        checked={settings.wallpaper.showBingInfo || false}
                        onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, showBingInfo: v } })}
                      />
                    </>
                  )}
                  {settings.wallpaper.type === 'image' && (
                    <TextItem
                      label="图片 URL"
                      value={settings.wallpaper.value}
                      placeholder="https://..."
                      onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, value: v } })}
                    />
                  )}
                  <RangeItem
                    label="模糊"
                    value={settings.wallpaper.blur}
                    min={0}
                    max={20}
                    onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, blur: v } })}
                  />
                  <RangeItem
                    label="亮度"
                    value={settings.wallpaper.brightness}
                    min={20}
                    max={100}
                    onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, brightness: v } })}
                  />
                </SettingSection>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-6">
                <SettingSection title="导入浏览器书签到工作区">
                  <button
                    onClick={() => setShowImportConfirm(true)}
                    disabled={importAllLoading}
                    className="w-full px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-white/20 text-white text-sm transition-colors"
                  >
                    {importAllLoading ? '导入中...' : '导入浏览器书签到 Tmarks'}
                  </button>

                  {importAllMessage && (
                    <div className="text-xs text-green-400">{importAllMessage}</div>
                  )}
                  {importAllError && (
                    <div className="text-xs text-red-400">{importAllError}</div>
                  )}
                </SettingSection>

                <SettingSection title="TMarks 同步">
                  <ToggleItem
                    label="显示置顶书签"
                    checked={settings.showPinnedBookmarks}
                    onChange={(v) => updateSettings({ showPinnedBookmarks: v })}
                  />
                  <ToggleItem
                    label="搜索建议"
                    checked={settings.enableSearchSuggestions}
                    onChange={(v) => updateSettings({ enableSearchSuggestions: v })}
                  />
                  {tmarksUrl && (
                    <a
                      href={tmarksUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 mt-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-sm text-white/70">打开 TMarks 网站</span>
                      <ExternalLink className="w-4 h-4 text-white/50" />
                    </a>
                  )}
                  <div className="text-xs text-white/40 mt-2">
                    在扩展设置中配置 API Key 以启用同步功能
                  </div>
                </SettingSection>

                <SettingSection title="自动刷新">
                  <ToggleItem
                    label="定时刷新置顶书签"
                    checked={settings.autoRefreshPinnedBookmarks}
                    onChange={(v) => updateSettings({ autoRefreshPinnedBookmarks: v })}
                  />
                  {settings.autoRefreshPinnedBookmarks && (
                    <>
                      <SelectItem
                        label="刷新时间"
                        value={settings.pinnedBookmarksRefreshTime}
                        options={[
                          { value: 'morning', label: '早上 8:00' },
                          { value: 'evening', label: '晚上 22:00' },
                        ]}
                        onChange={(v) => updateSettings({ pinnedBookmarksRefreshTime: v as 'morning' | 'evening' })}
                      />
                      <div className="text-xs text-white/40 -mt-1 ml-1">
                        每天自动更新置顶书签缓存，保持数据最新
                      </div>
                    </>
                  )}
                </SettingSection>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <SettingSection title="AI 整理">
                  <ToggleItem
                    label="启用 AI 整理"
                    checked={settings.enableWorkspaceAiOrganize ?? true}
                    onChange={(v) => updateSettings({ enableWorkspaceAiOrganize: v })}
                  />

                  <div className="space-y-2">
                    <div className="text-sm text-white/80">自定义规则（可选）</div>
                    <textarea
                      value={settings.workspaceAiOrganizeRules ?? ''}
                      onChange={(e) => updateSettings({ workspaceAiOrganizeRules: e.target.value })}
                      rows={6}
                      placeholder={`示例：\n工作: github.com, jira., notion.so\n学习: coursera.org, edx.org\n娱乐: bilibili.com, youtube.com\n工具: translate.google.com, regex101.com`}
                      className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10 font-mono"
                    />
                    <div className="text-xs text-white/50">
                      规则会作为最高优先级提示给 AI。标签不可用时会参考原目录路径。
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-white/80">高级：自定义提示词模板</div>
                      <button
                        type="button"
                        onClick={() => updateSettings({ enableWorkspaceAiOrganizeCustomPrompt: !(settings.enableWorkspaceAiOrganizeCustomPrompt ?? false) })}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          (settings.enableWorkspaceAiOrganizeCustomPrompt ?? false)
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-white/10 text-white/70 hover:bg-white/15'
                        }`}
                      >
                        {(settings.enableWorkspaceAiOrganizeCustomPrompt ?? false) ? '已启用' : '已禁用'}
                      </button>
                    </div>

                    {(settings.enableWorkspaceAiOrganizeCustomPrompt ?? false) && (
                      <>
                        <textarea
                          value={settings.workspaceAiOrganizePrompt ?? ''}
                          onChange={(e) => updateSettings({ workspaceAiOrganizePrompt: e.target.value })}
                          rows={10}
                          placeholder="可用变量：{{rules}} {{domainSummariesJson}}"
                          className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none border border-white/10 font-mono"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateSettings({ workspaceAiOrganizePrompt: NEWTAB_WORKSPACE_ORGANIZE_PROMPT_TEMPLATE })}
                            className="text-xs px-2 py-1 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                          >
                            使用默认模板
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSettings({ workspaceAiOrganizePrompt: '' })}
                            className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white/80 transition-colors"
                          >
                            清空
                          </button>
                        </div>
                        <div className="text-xs text-white/50">
                          建议保持“只输出 JSON”的强约束，否则容易解析失败。
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm text-white/80">域名数上限</div>
                      <input
                        type="number"
                        min={50}
                        max={2000}
                        value={settings.workspaceAiOrganizeMaxBookmarks ?? 300}
                        onChange={(e) => updateSettings({ workspaceAiOrganizeMaxBookmarks: Number(e.target.value) })}
                        className="w-28 bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-white/10"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm text-white/80">期望的一级分类数量</div>
                      <input
                        type="number"
                        min={3}
                        max={7}
                        value={settings.workspaceAiOrganizeTopLevelCount ?? 5}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          if (Number.isNaN(raw)) return;
                          const clamped = Math.max(3, Math.min(7, Math.round(raw)));
                          updateSettings({ workspaceAiOrganizeTopLevelCount: clamped });
                        }}
                        className="w-28 bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-white/10"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-white/50 -mt-1 space-y-1">
                    <p>为避免 AI Prompt 过大，这里限制参与分类规划的“域名数量”（按书签数量排序取前 N 个域名）。整理仍会应用到工作区全部书签。</p>
                    <p>当域名超过该上限时，会按此上限拆分为多批发送；AI 会在日志中看到“已拆分多批，收到全部批次后才输出”。</p>
                    <p>一级分类数量推荐 3-7 个，AI 会尽量按照你设定的数量生成顶级目录。</p>
                  </div>

                  <ToggleItem
                    label="读取浏览器历史热度"
                    checked={settings.enableHistoryHeat ?? false}
                    onChange={(v) => updateSettings({ enableHistoryHeat: v })}
                  />

                  {(settings.enableHistoryHeat ?? false) && (
                    <>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm text-white/80">历史统计天数</div>
                          <input
                            type="number"
                            min={1}
                            max={90}
                            value={settings.historyDays ?? 30}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (Number.isNaN(value)) return;
                              updateSettings({ historyDays: value });
                            }}
                            className="w-28 bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-white/10"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-sm text-white/80">历史热度优先 Top N</div>
                          <input
                            type="number"
                            min={5}
                            max={100}
                            value={settings.historyHeatTopN ?? 20}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (Number.isNaN(value)) return;
                              updateSettings({ historyHeatTopN: value });
                            }}
                            className="w-28 bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-white/10"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-white/50 -mt-1 space-y-1">
                        <p>启用后会统计最近 N 天的浏览记录来评估域名热度，用于决定目录层级。</p>
                        <p>Top N 域名会在 Prompt 中单独高亮，AI 会优先把它们放在一级目录或首页推荐区域（默认 20，可根据需要调节，范围 5-100）。</p>
                      </div>
                    </>
                  )}

                  <div className="space-y-3 pt-2">
                    <div className="text-sm text-white/80">层级策略</div>
                    <div className="space-y-1">
                      <ToggleItem
                        label="严格沿用现有目录结构（仅合并/拆分/重命名）"
                        checked={settings.workspaceAiOrganizeStrictHierarchy ?? false}
                        onChange={(v) => {
                          updateSettings({
                            workspaceAiOrganizeStrictHierarchy: v,
                            ...(v ? { workspaceAiOrganizeAllowNewFolders: false } : {}),
                          });
                        }}
                      />
                      <div className="text-xs text-white/50 ml-6 -mt-1">
                        开启后，AI 只能在原有目录层级基础上微调，不得新增新的一级目录。
                      </div>
                    </div>
                    <div className="space-y-1">
                      <ToggleItem
                        label="允许新增目录（严格模式下自动失效）"
                        checked={settings.workspaceAiOrganizeAllowNewFolders ?? true}
                        onChange={(v) => updateSettings({ workspaceAiOrganizeAllowNewFolders: v })}
                        disabled={settings.workspaceAiOrganizeStrictHierarchy ?? false}
                      />
                      <div className="text-xs text-white/50 ml-6 -mt-1">
                        关闭后，AI 只能把域名放入现有目录，不会创建新目录名称。
                      </div>
                    </div>
                    <div className="space-y-1">
                      <ToggleItem
                        label="优先保留域名原有的目录路径"
                        checked={settings.workspaceAiOrganizePreferOriginalPaths ?? true}
                        onChange={(v) => updateSettings({ workspaceAiOrganizePreferOriginalPaths: v })}
                      />
                      <div className="text-xs text-white/50 ml-6 -mt-1">
                        开启后，AI 会尽量把域名放回其历史常用目录，仅在冲突或规则要求时才调整。
                      </div>
                    </div>
                    <div className="space-y-1">
                      <ToggleItem
                        label="输出详细日志"
                        checked={settings.workspaceAiOrganizeVerboseLogs ?? true}
                        onChange={(v) => updateSettings({ workspaceAiOrganizeVerboseLogs: v })}
                      />
                      <div className="text-xs text-white/50 ml-6 -mt-1">
                        关闭后，仅保留关键步骤日志；开启则展示全部进度，便于排查问题。
                      </div>
                    </div>
                  </div>

                  <button
                    data-ai-organize-btn
                    onClick={async () => {
                      try {
                        setAiOrganizeMessage(null);
                        setAiOrganizeError(null);

                        const sessionId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                        setAiOrganizeSessionId(sessionId);
                        setAiOrganizeLogs([
                          {
                            ts: Date.now(),
                            level: 'info',
                            step: 'ui',
                            message: '已发起整理任务，等待后台进度...',
                          },
                        ]);
                        setAiOrganizeConsoleOpen(true);

                        setAiOrganizeLoading(true);
                        const resp = (await chrome.runtime.sendMessage({
                          type: 'AI_ORGANIZE_NEWTAB_WORKSPACE',
                          payload: {
                            sessionId,
                            rules: settings.workspaceAiOrganizeRules ?? '',
                            maxBookmarks: settings.workspaceAiOrganizeMaxBookmarks ?? 300,
                            enableHistoryHeat: settings.enableHistoryHeat ?? false,
                            historyDays: settings.historyDays ?? 30,
                            historyHeatTopN: settings.historyHeatTopN ?? 20,
                            strictHierarchy: settings.workspaceAiOrganizeStrictHierarchy ?? false,
                            allowNewFolders:
                              (settings.workspaceAiOrganizeStrictHierarchy ?? false)
                                ? false
                                : (settings.workspaceAiOrganizeAllowNewFolders ?? true),
                            preferOriginalPaths: settings.workspaceAiOrganizePreferOriginalPaths ?? true,
                            verboseLogs: settings.workspaceAiOrganizeVerboseLogs ?? true,
                            topLevelCount: settings.workspaceAiOrganizeTopLevelCount ?? 5,
                            promptTemplate:
                              (settings.enableWorkspaceAiOrganizeCustomPrompt ?? false)
                                ? (settings.workspaceAiOrganizePrompt ?? '')
                                : undefined,
                          },
                        })) as { success: boolean; data?: any; error?: string };

                        if (!resp?.success) {
                          throw new Error(resp?.error || 'AI 整理失败');
                        }

                        const createdFolders = resp.data?.createdFolders ?? 0;
                        const createdBookmarks = resp.data?.createdBookmarks ?? 0;
                        const processed = resp.data?.processed ?? resp.data?.total ?? 0;
                        const truncated = resp.data?.truncated ? '（已截断）' : '';
                        setAiOrganizeMessage(`整理完成：已处理 ${processed} 个书签${truncated}，创建目录 ${createdFolders} 个，复制书签 ${createdBookmarks} 个`);
                      } catch (e) {
                        setAiOrganizeError(e instanceof Error ? e.message : 'AI 整理失败');
                      } finally {
                        setAiOrganizeLoading(false);
                        setAiOrganizeSessionId(null);
                      }
                    }}
                    disabled={aiOrganizeLoading}
                    className="w-full px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-white/20 text-white text-sm transition-colors"
                  >
                    {aiOrganizeLoading ? '整理中...' : '开始 AI 整理工作区'}
                  </button>

                  <button
                    onClick={() => setAiOrganizeConsoleOpen(true)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-sm transition-colors"
                  >
                    查看进度终端
                  </button>

                  {aiOrganizeMessage && (
                    <div className="text-xs text-green-400">{aiOrganizeMessage}</div>
                  )}
                  {aiOrganizeError && (
                    <div className="text-xs text-red-400">{aiOrganizeError}</div>
                  )}

                  <div className="text-xs text-white/40 leading-relaxed">
                    整理仅会在「TMarks」工作区内复制/重建目录结构，不会改动浏览器其它文件夹；如需备份，请在运行前自行手动备份。
                  </div>
                </SettingSection>
              </div>
            )}
          </div>
        </div>

        {aiOrganizeConsoleOpen && (
          <div
            className="absolute inset-0 bg-black/70 flex items-center justify:center"
            style={{ zIndex: Z_INDEX.MODAL_CONTENT + 1 }}
            onClick={handleCloseAiOrganizeConsole}
          >
            <div
              className="w-[900px] max-w-[95%] h-[460px] rounded-2xl bg-black/80 border border-white/10 overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="text-sm font-medium text-white/90">AI 整理终端</div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-white/70 select-none">
                    <input
                      type="checkbox"
                      checked={aiOrganizeConsoleAutoScroll}
                      onChange={(e) => setAiOrganizeConsoleAutoScroll(e.target.checked)}
                      className="accent-blue-500"
                    />
                    自动滚动
                  </label>
                  <button
                    onClick={handleClearAiOrganizeLogs}
                    className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white/80"
                  >
                    清空
                  </button>
                  <button
                    onClick={handleCloseAiOrganizeConsole}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed"
                ref={(el) => {
                  if (!el) return;
                  if (!aiOrganizeConsoleAutoScroll) return;
                  setTimeout(() => {
                    try {
                      el.scrollTop = el.scrollHeight;
                    } catch {
                      // ignore
                    }
                  }, 0);
                }}
              >
                {aiOrganizeLogs.length === 0 ? (
                  <div className="text-white/50">暂无日志</div>
                ) : (
                  <div className="space-y-2">
                    {aiOrganizeLogs.map((l, idx) => {
                      const ts = typeof l.ts === 'number' ? new Date(l.ts).toLocaleTimeString() : '';
                      const level = String(l.level || 'info');
                      const color =
                        level === 'error'
                          ? 'text-red-300'
                          : level === 'warn'
                            ? 'text-yellow-300'
                            : level === 'success'
                              ? 'text-green-300'
                              : 'text-white/80';

                      return (
                        <div key={idx} className="whitespace-pre-wrap break-words">
                          <div className={color}>
                            [{ts}] [{level}] [{String(l.step || '')}] {String(l.message || '')}
                          </div>
                          {typeof l.detail !== 'undefined' && l.detail !== null && (
                            <div className="text-white/50 mt-1">
                              {(() => {
                                try {
                                  return JSON.stringify(l.detail, null, 2);
                                } catch {
                                  return String(l.detail);
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="text-xs text-white/50 truncate">
                  Session: {aiOrganizeSessionId || '-'}
                </div>
                <button
                  onClick={() => {
                    try {
                      const text = aiOrganizeLogs
                        .map((l) => {
                          const ts = typeof l.ts === 'number' ? new Date(l.ts).toISOString() : '';
                          const base = `[${ts}] [${String(l.level || '')}] [${String(l.step || '')}] ${String(l.message || '')}`;
                          if (typeof l.detail === 'undefined' || l.detail === null) return base;
                          try {
                            return `${base}\n${JSON.stringify(l.detail, null, 2)}`;
                          } catch {
                            return `${base}\n${String(l.detail)}`;
                          }
                        })
                        .join('\n');
                      navigator.clipboard.writeText(text);
                    } catch {
                      // ignore
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
                >
                  复制日志
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 导入书签确认弹窗 */}
        <ConfirmModal
          isOpen={showImportConfirm}
          title="导入书签"
          message="将复制浏览器全部书签到「Tmarks」工作区下的一个新文件夹中。确定继续？"
          confirmText="导入"
          cancelText="取消"
          onConfirm={handleImportConfirm}
          onCancel={() => setShowImportConfirm(false)}
        />

        {/* AI 整理确认弹窗 */}
        <ConfirmModal
          isOpen={showAiOrganizeConfirm}
          title="AI 整理"
          message="将对「Tmarks」工作区内所有书签进行 AI 归类整理（仅在 TMarks 文件夹内操作，不会触碰其它目录）。确定继续？"
          confirmText="开始整理"
          cancelText="取消"
          onConfirm={() => {
            setShowAiOrganizeConfirm(false);
            // 触发 AI 整理按钮的点击
            const aiBtn = document.querySelector('[data-ai-organize-btn]') as HTMLButtonElement;
            if (aiBtn) aiBtn.click();
          }}
          onCancel={() => setShowAiOrganizeConfirm(false)}
        />
      </div>
    </div>,
    document.body
  );
}

// 设置分组
function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <h3 className="text-sm font-medium text-white/80 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// 开关项
function ToggleItem({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      <button
        onClick={() => {
          if (disabled) return;
          onChange(!checked);
        }}
        disabled={disabled}
        className={`w-10 h-6 rounded-full transition-colors ${
          disabled ? 'bg-white/10 cursor-not-allowed' : checked ? 'bg-blue-500' : 'bg-white/20'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// 选择项
function SelectItem({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-white/10"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-800">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// 颜色选择
function ColorItem({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer"
      />
    </div>
  );
}

// 文本输入
function TextItem({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/80 flex-shrink-0">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-white/10"
      />
    </div>
  );
}

// 滑块
function RangeItem({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/80">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-xs text-white/60 w-8">{value}</span>
      </div>
    </div>
  );
}

// 缓存图标按钮
function CacheFaviconsButton() {
  const { shortcuts, updateShortcut, gridItems, updateGridItem } = useNewtabStore();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [storageInfo, setStorageInfo] = useState<{ used: number; total: number } | null>(null);

  // 加载存储信息
  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const bytes = await chrome.storage.local.getBytesInUse();
        const quota = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB 默认配额
        setStorageInfo({ used: bytes, total: quota });
      } catch (error) {
        console.error('Failed to get storage info:', error);
      }
    };
    loadStorageInfo();
  }, [isLoading]);

  const handleCacheFavicons = async () => {
    setIsLoading(true);
    setProgress({ current: 0, total: 0 });

    try {
      const { batchDownloadFavicons } = await import('../utils/favicon');
      let totalCached = 0;
      
      // 缓存旧版快捷方式图标
      if (shortcuts.length > 0) {
        const results = await batchDownloadFavicons(shortcuts, (current, total) => {
          setProgress({ current, total });
        });
        
        // 更新快捷方式
        results.forEach((base64, id) => {
          updateShortcut(id, { faviconBase64: base64 });
        });
        totalCached += results.size;
      }

      // 缓存网格项中的快捷方式图标
      const gridShortcuts = gridItems.filter(item => item.type === 'shortcut' && item.shortcut);
      if (gridShortcuts.length > 0) {
        const gridResults = await batchDownloadFavicons(
          gridShortcuts.map(item => ({
            id: item.id,
            url: item.shortcut!.url,
            favicon: item.shortcut!.favicon,
            faviconBase64: item.shortcut!.faviconBase64,
          })),
          (current, total) => {
            setProgress({ current: current + shortcuts.length, total: total + shortcuts.length });
          }
        );

        // 更新网格项
        gridResults.forEach((base64, id) => {
          const item = gridItems.find(i => i.id === id);
          if (item?.shortcut) {
            updateGridItem(id, {
              shortcut: {
                ...item.shortcut,
                faviconBase64: base64,
              },
            });
          }
        });
        totalCached += gridResults.size;
      }

      alert(`成功缓存 ${totalCached} 个图标`);
    } catch (error) {
      console.error('Failed to cache favicons:', error);
      alert('缓存图标失败，请重试');
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const totalShortcuts = shortcuts.length + gridItems.filter(item => item.type === 'shortcut').length;
  const cachedCount = shortcuts.filter(s => s.faviconBase64).length + 
    gridItems.filter(item => item.type === 'shortcut' && item.shortcut?.faviconBase64).length;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm text-white/80">下载并缓存所有图标</div>
          <div className="text-xs text-white/50 mt-1">
            已缓存 {cachedCount} / {totalShortcuts} 个图标
          </div>
          {storageInfo && (
            <div className="text-xs text-white/40 mt-0.5">
              存储占用: {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)} 
              ({((storageInfo.used / storageInfo.total) * 100).toFixed(1)}%)
            </div>
          )}
        </div>
        <button
          onClick={handleCacheFavicons}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-white/20 text-white text-sm transition-colors"
        >
          {isLoading ? '缓存中...' : '立即缓存'}
        </button>
      </div>
      {isLoading && progress.total > 0 && (
        <div className="space-y-1">
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <div className="text-xs text-white/50 text-center">
            {progress.current} / {progress.total}
          </div>
        </div>
      )}
      <div className="text-xs text-white/40 leading-relaxed">
        图标会自动压缩到 10KB 以内，离线时可正常显示
      </div>
    </div>
  );
}


