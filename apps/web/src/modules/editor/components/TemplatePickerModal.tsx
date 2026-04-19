'use client';

import { useEffect } from 'react';
import { TEMPLATES, type CardTemplate } from '../templates';

interface Props {
  onSelect: (template: CardTemplate) => void;
  onSkip: () => void;
}

export default function TemplatePickerModal({ onSelect, onSkip }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-panel/95 backdrop-blur-sm overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-start px-6 py-12 gap-10">
        {/* Header */}
        <div className="text-center max-w-md">
          <p className="text-xs font-bold tracking-widest uppercase text-accent mb-3">New Card</p>
          <h2 className="text-2xl font-bold text-white">Start with a template</h2>
          <p className="text-gray-400 text-sm mt-2">Pick a starting point — you can change everything.</p>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className="flex flex-col gap-2 group text-left focus:outline-none"
            >
              {/* Mini preview — 9:16 aspect ratio */}
              <div
                className="w-full rounded-xl border-2 border-white/10 group-hover:border-accent/60 group-focus:border-accent transition-colors overflow-hidden"
                style={{ aspectRatio: '9/16', backgroundColor: tpl.previewBg }}
              >
                {/* Fake title bar */}
                <div className="flex flex-col items-center justify-center h-full gap-2 px-3">
                  <div
                    className="w-3/4 rounded"
                    style={{ height: 8, backgroundColor: tpl.previewAccent, opacity: 0.9 }}
                  />
                  <div
                    className="w-1/2 rounded"
                    style={{ height: 4, backgroundColor: tpl.previewAccent, opacity: 0.5 }}
                  />
                  <div
                    className="w-1/3 rounded mt-1"
                    style={{ height: 3, backgroundColor: tpl.previewAccent, opacity: 0.3 }}
                  />
                  <div
                    className="w-2/5 rounded mt-1"
                    style={{ height: 4, backgroundColor: tpl.previewAccent, opacity: 0.4 }}
                  />
                </div>
              </div>
              <p className="text-white text-xs font-medium text-center group-hover:text-purple-300 transition-colors">
                {tpl.name}
              </p>
            </button>
          ))}
        </div>

        {/* Skip */}
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Start with a blank canvas →
        </button>
      </div>
    </div>
  );
}
