/**
 * NewTab 主组件
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNewtabStore } from './hooks/useNewtabStore';
import { Clock } from './components/Clock';
import { SearchBar } from './components/SearchBar';
import { ShortcutGrid } from './components/ShortcutGrid';
import { Wallpaper } from './components/Wallpaper';
import { DockBar } from './components/DockBar';
import { Greeting } from './components/Greeting';
import { LunarDate } from './components/LunarDate';
import { Weather } from './components/Weather';
import { TodoList } from './components/TodoList';
import { Notes } from './components/Notes';
import { Poetry } from './components/Poetry';
import { HotSearch } from './components/HotSearch';
import { GroupSidebar } from './components/GroupSidebar';

export function NewTab() {
  const { settings, isLoading, loadData, updateSettings, shortcutGroups, activeGroupId, setActiveGroup } = useNewtabStore();
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isWheelLocked = useRef(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 滚轮切换分组
  const handleWheel = useCallback((e: WheelEvent) => {
    // 如果正在锁定中，忽略滚轮事件
    if (isWheelLocked.current) return;
    
    // 检查是否在可滚动元素内
    const target = e.target as HTMLElement;
    const scrollableParent = target.closest('.overflow-y-auto, .overflow-auto');
    if (scrollableParent) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableParent;
      // 如果内容可滚动且不在边界，不切换分组
      if (scrollHeight > clientHeight) {
        if (e.deltaY < 0 && scrollTop > 0) return;
        if (e.deltaY > 0 && scrollTop + clientHeight < scrollHeight) return;
      }
    }

    // 构建分组列表：null（全部）+ 所有分组
    const groupIds: (string | null)[] = [null, ...shortcutGroups.map(g => g.id)];
    const currentIndex = groupIds.indexOf(activeGroupId);
    
    let newIndex = currentIndex;
    if (e.deltaY > 0) {
      // 向下滚动，切换到下一个分组
      newIndex = Math.min(currentIndex + 1, groupIds.length - 1);
    } else if (e.deltaY < 0) {
      // 向上滚动，切换到上一个分组
      newIndex = Math.max(currentIndex - 1, 0);
    }

    if (newIndex !== currentIndex) {
      setActiveGroup(groupIds[newIndex]);
      // 锁定一段时间，防止连续切换
      isWheelLocked.current = true;
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => {
        isWheelLocked.current = false;
      }, 300);
    }
  }, [shortcutGroups, activeGroupId, setActiveGroup]);

  // 监听滚轮事件
  useEffect(() => {
    if (!settings.showShortcuts || shortcutGroups.length === 0) return;
    
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    };
  }, [handleWheel, settings.showShortcuts, shortcutGroups.length]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e]">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 壁纸背景 */}
      <Wallpaper config={settings.wallpaper} />

      {/* 顶部栏 - 天气 */}
      {settings.showWeather && (
        <div className="absolute top-4 right-4 z-20 animate-fadeIn">
          <Weather />
        </div>
      )}

      {/* 主内容 - 参考 mtab 布局，内容偏上 */}
      <div className="relative z-10 w-full h-full flex flex-col items-center px-4 pt-[12vh] pb-8 overflow-y-auto">
        {/* 问候语 */}
        {settings.showGreeting && (
          <div className="mb-1 animate-fadeIn">
            <Greeting userName={settings.userName} />
          </div>
        )}

        {/* 时钟（包含日期和农历） */}
        {settings.showClock && (
          <div className="mb-3 animate-fadeIn">
            <Clock
              format={settings.clockFormat}
              showDate={settings.showDate}
              showSeconds={settings.showSeconds}
              showLunar={settings.showLunar}
            />
          </div>
        )}

        {/* 独立农历显示（仅当时钟关闭但农历开启时） */}
        {!settings.showClock && settings.showLunar && (
          <div className="mb-3 animate-fadeIn">
            <LunarDate />
          </div>
        )}

        {/* 每日诗词 */}
        {settings.showPoetry && (
          <div className="mb-6 animate-fadeIn">
            <Poetry />
          </div>
        )}

        {/* 搜索框 - 提高层级确保下拉框不被遮挡 */}
        {settings.showSearch && (
          <div className="w-full max-w-2xl mb-6 animate-fadeIn px-4 relative z-50">
            <SearchBar
              engine={settings.searchEngine}
              enableSuggestions={settings.enableSearchSuggestions}
              onEngineChange={(engine) => updateSettings({ searchEngine: engine })}
            />
          </div>
        )}

        {/* 小组件横向排列 - 参考 mtab 布局 */}
        {(settings.showHotSearch || settings.showTodo || settings.showNotes) && (
          <div className="w-full max-w-5xl mb-8 animate-fadeIn px-4">
            <div className="flex flex-wrap justify-center gap-4">
              {settings.showHotSearch && (
                <div className="flex-shrink-0">
                  <HotSearch
                    type={settings.hotSearchType}
                    onTypeChange={(type) => updateSettings({ hotSearchType: type })}
                  />
                </div>
              )}
              {settings.showTodo && (
                <div className="flex-shrink-0">
                  <TodoList />
                </div>
              )}
              {settings.showNotes && (
                <div className="flex-shrink-0">
                  <Notes />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 快捷方式 */}
        {settings.showShortcuts && (
          <div className="w-full max-w-5xl animate-fadeIn px-4">
            <ShortcutGrid
              columns={settings.shortcutColumns}
              style={settings.shortcutStyle}
            />
          </div>
        )}

      </div>

      {/* 左侧分组侧边栏（包含设置按钮） */}
      <GroupSidebar />

      {/* 底部 Dock 栏 - 置顶书签 */}
      {settings.showPinnedBookmarks && <DockBar />}
    </div>
  );
}
