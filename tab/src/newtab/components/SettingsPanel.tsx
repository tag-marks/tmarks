/**
 * 设置面板组件
 */

import { useState, useEffect } from 'react';
import { X, Clock, Search, Grid3X3, Image, Cloud, User, CloudSun, ExternalLink } from 'lucide-react';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { SEARCH_ENGINES } from '../constants';
import { StorageService } from '@/lib/utils/storage';
import { getTMarksUrls } from '@/lib/constants/urls';
import type { ClockFormat, SearchEngine, WallpaperType } from '../types';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings } = useNewtabStore();
  const [tmarksUrl, setTmarksUrl] = useState('');

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[80vh] rounded-2xl glass-dark animate-scaleIn flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 固定头部 */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-inherit rounded-t-2xl">
          <h2 className="text-xl font-medium text-white">设置</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* 可滚动内容 */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {/* 问候与个性化 */}
          <SettingSection icon={<User className="w-4 h-4" />} title="个性化">
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
            <ToggleItem
              label="显示农历"
              checked={settings.showLunar}
              onChange={(v) => updateSettings({ showLunar: v })}
            />
          </SettingSection>

          {/* 时钟设置 */}
          <SettingSection icon={<Clock className="w-4 h-4" />} title="时钟">
            <ToggleItem
              label="显示时钟"
              checked={settings.showClock}
              onChange={(v) => updateSettings({ showClock: v })}
            />
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
            <SelectItem
              label="时间格式"
              value={settings.clockFormat}
              options={[
                { value: '24h', label: '24 小时制' },
                { value: '12h', label: '12 小时制' },
              ]}
              onChange={(v) => updateSettings({ clockFormat: v as ClockFormat })}
            />
          </SettingSection>

          {/* 搜索设置 */}
          <SettingSection icon={<Search className="w-4 h-4" />} title="搜索">
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

          {/* 快捷方式设置 */}
          <SettingSection icon={<Grid3X3 className="w-4 h-4" />} title="快捷方式">
            <ToggleItem
              label="显示快捷方式"
              checked={settings.showShortcuts}
              onChange={(v) => updateSettings({ showShortcuts: v })}
            />
            <SelectItem
              label="每行数量"
              value={String(settings.shortcutColumns)}
              options={[
                { value: '4', label: '4 个' },
                { value: '6', label: '6 个' },
                { value: '8', label: '8 个' },
              ]}
              onChange={(v) => updateSettings({ shortcutColumns: Number(v) as 4 | 6 | 8 })}
            />
          </SettingSection>

          {/* TMarks 同步设置 */}
          <SettingSection icon={<Cloud className="w-4 h-4" />} title="TMarks 同步">
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
                className="flex items-center justify-between p-2 mt-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-sm text-white/70">打开 TMarks 网站</span>
                <ExternalLink className="w-4 h-4 text-white/50" />
              </a>
            )}
            <div className="text-xs text-white/40 mt-1">
              在扩展设置中配置 API Key
            </div>
          </SettingSection>

          {/* 天气与待办 */}
          <SettingSection icon={<CloudSun className="w-4 h-4" />} title="小组件">
            <ToggleItem
              label="显示天气"
              checked={settings.showWeather}
              onChange={(v) => updateSettings({ showWeather: v })}
            />
            <ToggleItem
              label="显示待办事项"
              checked={settings.showTodo}
              onChange={(v) => updateSettings({ showTodo: v })}
            />
            <ToggleItem
              label="显示备忘录"
              checked={settings.showNotes}
              onChange={(v) => updateSettings({ showNotes: v })}
            />
            <ToggleItem
              label="显示热搜榜"
              checked={settings.showHotSearch}
              onChange={(v) => updateSettings({ showHotSearch: v })}
            />
            <ToggleItem
              label="显示每日诗词"
              checked={settings.showPoetry}
              onChange={(v) => updateSettings({ showPoetry: v })}
            />
          </SettingSection>

          {/* 壁纸设置 */}
          <SettingSection icon={<Image className="w-4 h-4" />} title="壁纸">
            <SelectItem
              label="壁纸类型"
              value={settings.wallpaper.type}
              options={[
                { value: 'color', label: '纯色' },
                { value: 'bing', label: 'Bing 每日壁纸' },
                { value: 'unsplash', label: '随机风景' },
                { value: 'image', label: '自定义图片' },
              ]}
              onChange={(v) =>
                updateSettings({
                  wallpaper: { ...settings.wallpaper, type: v as WallpaperType },
                })
              }
            />
            {settings.wallpaper.type === 'color' && (
              <ColorItem
                label="背景颜色"
                value={settings.wallpaper.value}
                onChange={(v) =>
                  updateSettings({ wallpaper: { ...settings.wallpaper, value: v } })
                }
              />
            )}
            {settings.wallpaper.type === 'image' && (
              <TextItem
                label="图片 URL"
                value={settings.wallpaper.value}
                placeholder="https://..."
                onChange={(v) =>
                  updateSettings({ wallpaper: { ...settings.wallpaper, value: v } })
                }
              />
            )}
            <RangeItem
              label="模糊"
              value={settings.wallpaper.blur}
              min={0}
              max={20}
              onChange={(v) =>
                updateSettings({ wallpaper: { ...settings.wallpaper, blur: v } })
              }
            />
            <RangeItem
              label="亮度"
              value={settings.wallpaper.brightness}
              min={20}
              max={100}
              onChange={(v) =>
                updateSettings({ wallpaper: { ...settings.wallpaper, brightness: v } })
              }
            />
          </SettingSection>
        </div>
      </div>
    </div>
  );
}

// 设置分组
function SettingSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 text-white/60">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// 开关项
function ToggleItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-white/20'
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
