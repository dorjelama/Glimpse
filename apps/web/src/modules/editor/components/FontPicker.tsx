'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FONTS, FONT_CATEGORIES, type FontOption } from '../constants/fonts';
import { loadGoogleFont, loadGoogleFontBatch } from '../utils/loadFont';

interface Props {
  value: string;
  onChange: (fontFamily: string) => void;
}

export default function FontPicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedFont = FONTS.find((f) => f.family === value);

  // Load the currently-selected font so the trigger renders in the right face.
  useEffect(() => {
    if (selectedFont) loadGoogleFont(selectedFont.googleName);
  }, [selectedFont]);

  const openDropdown = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
    });
    // Batch-load all fonts so every option renders in its own face.
    loadGoogleFontBatch(FONTS.map((f) => f.googleName));
    setSearch('');
    setIsOpen(true);
  };

  const closeDropdown = () => setIsOpen(false);

  const handleSelect = (font: FontOption) => {
    loadGoogleFont(font.googleName);
    onChange(font.family);
    closeDropdown();
  };

  // Auto-focus search when dropdown opens.
  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  // Close on click outside.
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        !dropdownRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDropdown(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Build filtered + grouped font list.
  const query = search.toLowerCase();
  const filtered = query
    ? FONTS.filter((f) => f.label.toLowerCase().includes(query))
    : FONTS;

  const grouped = FONT_CATEGORIES.reduce<Record<string, { label: string; fonts: FontOption[] }>>(
    (acc, cat) => {
      const fonts = filtered.filter((f) => f.category === cat.id);
      if (fonts.length > 0) acc[cat.id] = { label: cat.label, fonts };
      return acc;
    },
    {},
  );

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        style={{ fontFamily: selectedFont?.family }}
        className="w-full bg-white/10 text-white text-sm rounded-md px-2 py-1.5 border border-white/10 hover:border-white/30 focus:outline-none focus:border-accent flex items-center justify-between gap-2 transition-colors"
      >
        <span className="truncate">{selectedFont?.label ?? value}</span>
        <svg
          className="w-3 h-3 text-gray-400 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown portal — avoids being clipped by the panel's overflow-y-auto */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="bg-[#1e1b2e] border border-white/20 rounded-md shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b border-white/10">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fonts…"
                className="w-full bg-white/10 text-white text-sm rounded px-2 py-1.5 border border-white/10 focus:outline-none focus:border-purple-400 placeholder-gray-500"
              />
            </div>

            {/* Font list */}
            <div className="overflow-y-auto max-h-64">
              {Object.entries(grouped).map(([catId, { label, fonts }]) => (
                <div key={catId}>
                  <div className="px-3 pt-2.5 pb-1 text-[9px] font-semibold uppercase tracking-widest text-purple-400 select-none">
                    {label}
                  </div>
                  {fonts.map((font) => (
                    <button
                      key={font.family}
                      type="button"
                      onClick={() => handleSelect(font)}
                      style={{ fontFamily: font.family }}
                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                        font.family === value
                          ? 'bg-purple-500/20 text-purple-200'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              ))}

              {Object.keys(grouped).length === 0 && (
                <div className="px-3 py-5 text-sm text-gray-500 text-center">
                  No fonts match &ldquo;{search}&rdquo;
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
