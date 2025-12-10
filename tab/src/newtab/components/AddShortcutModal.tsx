/**
 * 添加快捷方式弹窗组件
 */

import { useState } from 'react';
import { X, Link, Type } from 'lucide-react';

interface AddShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string, title: string) => void;
  groupName?: string;
}

export function AddShortcutModal({ isOpen, onClose, onAdd, groupName }: AddShortcutModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    setError('');

    if (!url.trim()) {
      setError('请输入网址');
      return;
    }

    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(fullUrl); // 验证 URL 格式

      const domain = new URL(fullUrl).hostname;
      const finalTitle = title.trim() || domain;

      onAdd(fullUrl, finalTitle);
      setUrl('');
      setTitle('');
      onClose();
    } catch {
      setError('无效的网址格式');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[400px] max-w-[90vw] animate-scaleIn">
        <div className="glass rounded-2xl p-6 border border-white/10">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white">
              添加快捷方式
              {groupName && (
                <span className="ml-2 text-sm text-white/50">到 {groupName}</span>
              )}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* 表单 */}
          <div className="space-y-4">
            {/* 网址输入 */}
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                <Link className="w-4 h-4" />
                网址
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
                className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-blue-500/50 placeholder:text-white/30 transition-colors"
                autoFocus
              />
            </div>

            {/* 名称输入 */}
            <div>
              <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                <Type className="w-4 h-4" />
                名称 <span className="text-white/30">(可选)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="自动获取域名"
                className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none border border-white/20 focus:border-blue-500/50 placeholder:text-white/30 transition-colors"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-blue-500/80 hover:bg-blue-500 text-white text-sm transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
