'use client';

import { useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: string;
};

export default function BottomSheet({ open, onClose, title, children, height = '60vh' }: Props) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#16161f] rounded-t-2xl flex flex-col transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height, maxHeight: '90dvh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0" onClick={onClose}>
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {title && (
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}
