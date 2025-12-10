-- ============================================================================
-- NewTab 快捷方式表
-- 用于存储浏览器新标签页的快捷方式数据
-- ============================================================================

-- NewTab 快捷方式分组表
CREATE TABLE IF NOT EXISTS newtab_groups (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Folder',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_newtab_groups_user ON newtab_groups(user_id, position);

-- NewTab 快捷方式表
CREATE TABLE IF NOT EXISTS newtab_shortcuts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    group_id TEXT,
    -- 基本信息
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    favicon TEXT,
    -- 排序和统计
    position INTEGER NOT NULL DEFAULT 0,
    click_count INTEGER NOT NULL DEFAULT 0,
    last_clicked_at TEXT,
    -- 关联 TMarks 书签（可选）
    bookmark_id TEXT,
    -- 时间戳
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES newtab_groups(id) ON DELETE SET NULL,
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_newtab_shortcuts_user ON newtab_shortcuts(user_id, position);
CREATE INDEX IF NOT EXISTS idx_newtab_shortcuts_group ON newtab_shortcuts(group_id, position);
CREATE INDEX IF NOT EXISTS idx_newtab_shortcuts_bookmark ON newtab_shortcuts(bookmark_id);

-- NewTab 用户设置表
CREATE TABLE IF NOT EXISTS newtab_settings (
    user_id TEXT PRIMARY KEY,
    -- 显示设置
    columns INTEGER NOT NULL DEFAULT 6,
    style TEXT NOT NULL DEFAULT 'card',
    show_title INTEGER NOT NULL DEFAULT 1,
    -- 背景设置
    background_type TEXT NOT NULL DEFAULT 'gradient',
    background_value TEXT,
    background_blur INTEGER NOT NULL DEFAULT 0,
    background_dim INTEGER NOT NULL DEFAULT 20,
    -- 功能开关
    show_search INTEGER NOT NULL DEFAULT 1,
    show_clock INTEGER NOT NULL DEFAULT 1,
    show_weather INTEGER NOT NULL DEFAULT 0,
    show_todo INTEGER NOT NULL DEFAULT 0,
    show_hot_search INTEGER NOT NULL DEFAULT 0,
    show_pinned_bookmarks INTEGER NOT NULL DEFAULT 1,
    -- 搜索引擎
    search_engine TEXT NOT NULL DEFAULT 'google',
    -- 时间戳
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 记录迁移版本
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0100');
