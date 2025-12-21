/**
 * iOS 风格 Action Sheet 组件
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Z_INDEX } from '../../constants/z-index';

interface ActionSheetAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ActionSheetProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  cancelText?: string;
  onCancel: () => void;
}

export function ActionSheet({
  isOpen,
  title,
  message,
  actions,
  cancelText = '取消',
  onCancel,
}: ActionSheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleAction = (action: ActionSheetAction) => {
    setIsVisible(false);
    setTimeout(() => action.onClick(), 150);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(onCancel, 150);
  };

  return createPortal(
    <div
      className={`fixed inset-0 flex items-end justify-center px-2 pb-24 transition-all duration-200 ${
        isVisible ? 'bg-black/60 backdrop-blur-sm opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP + 10 }}
      onClick={handleCancel}
    >
      <div
        role="dialog"
        aria-label={title || '操作'}
        className={`w-full max-w-[400px] transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        style={{ zIndex: Z_INDEX.MODAL_CONTENT + 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 主操作区域 */}
        <div className="bg-[#2c2c2e]/95 backdrop-blur-xl rounded-[14px] overflow-hidden mb-2">
          {/* 标题和消息 */}
          {(title || message) && (
            <>
              <div className="px-4 py-4 text-center">
                {title && (
                  <h3 className="text-[13px] font-semibold text-white/60 mb-0.5">
                    {title}
                  </h3>
                )}
                {message && (
                  <p className="text-[13px] text-white/50 leading-relaxed">
                    {message}
                  </p>
                )}
              </div>
              <div className="h-px bg-white/10" />
            </>
          )}

          {/* 操作按钮 */}
          {actions.map((action, index) => (
            <div key={index}>
              <button
                type="button"
                onClick={() => handleAction(action)}
                className={`w-full py-[18px] text-[20px] font-normal hover:bg-white/5 active:bg-white/10 transition-colors ${
                  action.variant === 'danger' ? 'text-[#ff453a]' : 'text-[#0a84ff]'
                }`}
              >
                {action.label}
              </button>
              {index < actions.length - 1 && <div className="h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* 取消按钮 - 独立卡片 */}
        <div className="bg-[#2c2c2e]/95 backdrop-blur-xl rounded-[14px] overflow-hidden">
          <button
            type="button"
            onClick={handleCancel}
            aria-label={cancelText}
            className="w-full py-[18px] text-[20px] font-semibold text-[#0a84ff] hover:bg-white/5 active:bg-white/10 transition-colors focus:outline-none focus:bg-white/10"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
