/**
 * 快捷方式网格组件 - 支持拖拽排序
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useNewtabStore } from '../hooks/useNewtabStore';
import { SortableShortcutItem } from './SortableShortcutItem';
import { AddShortcutModal } from './AddShortcutModal';
import { FAVICON_API } from '../constants';

interface ShortcutGridProps {
  columns: 4 | 6 | 8;
  style: 'icon' | 'card';
}

export function ShortcutGrid({ columns, style }: ShortcutGridProps) {
  const { shortcuts, shortcutGroups, activeGroupId, addShortcut, reorderShortcuts, getFilteredShortcuts } =
    useNewtabStore();
  const [showAddModal, setShowAddModal] = useState(false);

  // 获取当前分组的快捷方式
  const filteredShortcuts = getFilteredShortcuts();

  // 获取当前分组名称
  const currentGroupName = activeGroupId
    ? shortcutGroups.find((g) => g.id === activeGroupId)?.name
    : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 响应式网格：小屏幕自动减少列数
  const gridCols = {
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
    8: 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8',
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = shortcuts.findIndex((s) => s.id === active.id);
    const newIndex = shortcuts.findIndex((s) => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderShortcuts(oldIndex, newIndex);
    }
  };

  const handleAddShortcut = (url: string, title: string) => {
    const domain = new URL(url).hostname;
    addShortcut({
      url,
      title,
      favicon: `${FAVICON_API}${domain}&sz=64`,
      groupId: activeGroupId || undefined,
    });
  };

  // 当前分组为空时显示简洁的添加按钮
  if (filteredShortcuts.length === 0) {
    return (
      <>
        <div className="flex justify-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-16 h-16 rounded-2xl glass hover:bg-white/20 flex items-center justify-center transition-all group"
            title="添加快捷方式"
          >
            <Plus className="w-8 h-8 text-white/50 group-hover:text-white/80 transition-colors" />
          </button>
        </div>
        <AddShortcutModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddShortcut}
          groupName={currentGroupName}
        />
      </>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={filteredShortcuts.map((s) => s.id)}
        strategy={rectSortingStrategy}
      >
        <div className={`grid ${gridCols[columns]} gap-4`}>
          {filteredShortcuts.map((shortcut) => (
            <SortableShortcutItem
              key={shortcut.id}
              shortcut={shortcut}
              style={style}
            />
          ))}

          {/* 添加按钮 */}
          <button
            onClick={() => setShowAddModal(true)}
            className={`
              flex flex-col items-center justify-center gap-2 p-4 rounded-xl
              glass hover:bg-white/20 transition-all duration-200
              cursor-pointer group
              ${style === 'card' ? 'aspect-square' : ''}
            `}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Plus className="w-6 h-6 text-white/60" />
            </div>
            <span className="text-xs text-white/60">添加</span>
          </button>
        </div>
      </SortableContext>

      {/* 添加快捷方式弹窗 */}
      <AddShortcutModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddShortcut}
        groupName={currentGroupName}
      />
    </DndContext>
  );
}
