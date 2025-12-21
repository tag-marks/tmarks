/**
 * iOS 风格确认弹窗组件
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Z_INDEX } from '../../constants/z-index';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  confirmVariant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
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

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(onConfirm, 150);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(onCancel, 150);
  };

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? 'bg-black/60 backdrop-blur-md opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex: Z_INDEX.MODAL_BACKDROP + 10 }}
      onClick={handleCancel}
    >
      <div
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className={`relative w-full max-w-[280px] rounded-[14px] overflow-hidden transition-all duration-200 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ zIndex: Z_INDEX.MODAL_CONTENT + 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS 风格毛玻璃背景 */}
        <div className="bg-[#2c2c2e]/90 backdrop-blur-xl">
          {/* 标题和消息 */}
          <div className="px-4 pt-5 pb-4 text-center">
            <h3 id="confirm-title" className="text-[17px] font-semibold text-white mb-1">
              {title}
            </h3>
            <p id="confirm-message" className="text-[13px] text-white/70 leading-relaxed">
              {message}
            </p>
          </div>

          {/* 分隔线 */}
          <div className="h-px bg-white/10" />

          {/* 按钮区域 - iOS 风格水平排列 */}
          <div className="flex">
            <button
              type="button"
              onClick={handleCancel}
              aria-label={cancelText}
              className="flex-1 py-[11px] text-[17px] font-normal text-[#0a84ff] hover:bg-white/5 active:bg-white/10 transition-colors focus:outline-none focus:bg-white/10"
            >
              {cancelText}
            </button>
            <div className="w-px bg-white/10" />
            <button
              type="button"
              onClick={handleConfirm}
              aria-label={confirmText}
              className={`flex-1 py-[11px] text-[17px] font-semibold hover:bg-white/5 active:bg-white/10 transition-colors focus:outline-none focus:bg-white/10 ${
                confirmVariant === 'danger' ? 'text-[#ff453a]' : 'text-[#0a84ff]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
