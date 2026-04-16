'use client';

import { useEditorStore } from '../store/editorStore';
import FontPicker from './FontPicker';

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] text-gray-400 uppercase tracking-wider">{children}</label>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={Math.round(value)}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full bg-white/10 text-white text-sm rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-accent"
    />
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-md cursor-pointer border-0 bg-transparent"
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 bg-white/10 text-white text-sm rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-accent"
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/10 text-white text-sm rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-accent"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-panel">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  return locked ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 019.9-1" />
    </svg>
  );
}

export default function PropertiesPanel() {
  const selectedId      = useEditorStore((s) => s.selectedId);
  const selectedIds     = useEditorStore((s) => s.selectedIds);
  const project         = useEditorStore((s) => s.project);
  const currentPageId   = useEditorStore((s) => s.currentPageId);
  const updateElement   = useEditorStore((s) => s.updateElement);
  const updateCanvas    = useEditorStore((s) => s.updateCanvas);
  const updateTransition = useEditorStore((s) => s.updateTransition);
  const deleteElement   = useEditorStore((s) => s.deleteElement);
  const duplicateElement = useEditorStore((s) => s.duplicateElement);
  const bringForward    = useEditorStore((s) => s.bringForward);
  const sendBackward    = useEditorStore((s) => s.sendBackward);
  const bringToFront    = useEditorStore((s) => s.bringToFront);
  const sendToBack      = useEditorStore((s) => s.sendToBack);
  const toggleLock      = useEditorStore((s) => s.toggleLock);
  const groupSelected   = useEditorStore((s) => s.groupSelected);
  const ungroupElement  = useEditorStore((s) => s.ungroupElement);
  const isPreviewMode   = useEditorStore((s) => s.isPreviewMode);

  if (isPreviewMode) return null;
  if (!project) return null;

  const currentPage = project.pages.find((p) => p.id === currentPageId) ?? project.pages[0];
  const element = selectedId ? currentPage?.elements.find((e) => e.id === selectedId) : null;

  const set = (changes: Record<string, any>) =>
    element && updateElement(element.id, changes);

  const setStyle = (changes: Record<string, any>) =>
    element && updateElement(element.id, { styles: changes });

  const isLocked  = !!element?.styles?._locked;
  const groupId   = element?.styles?._groupId as string | undefined;
  const canGroup  = selectedIds.length > 1;
  const canUngroup = !!groupId;

  // === Canvas settings panel ===
  if (!element) {
    return (
      <aside className="w-60 bg-panel border-l border-white/10 flex flex-col overflow-y-auto">
        <div className="px-3 py-3 border-b border-white/10">
          <h2 className="text-xs font-semibold text-purple-300 uppercase tracking-widest">Canvas</h2>
        </div>
        <div className="p-3 flex flex-col gap-4">
          <Row>
            <Label>Width (px)</Label>
            <NumberInput
              value={project.canvas.width}
              onChange={(v) => updateCanvas({ width: v })}
              min={100}
              max={4000}
            />
          </Row>
          <Row>
            <Label>Height (px)</Label>
            <NumberInput
              value={project.canvas.height}
              onChange={(v) => updateCanvas({ height: v })}
              min={100}
              max={8000}
            />
          </Row>
          {currentPage && (
            <>
              <Row>
                <Label>Page Background Color</Label>
                <ColorInput
                  value={currentPage.backgroundColor}
                  onChange={(v) => updateCanvas({ backgroundColor: v })}
                />
              </Row>
              <Row>
                <Label>Page Background Image URL</Label>
                <input
                  type="text"
                  value={currentPage.backgroundImage || ''}
                  onChange={(e) => updateCanvas({ backgroundImage: e.target.value || undefined })}
                  placeholder="https://..."
                  className="w-full bg-white/10 text-white text-sm rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-accent"
                />
              </Row>
            </>
          )}
          {project.pages.length > 1 && (
            <Row>
              <Label>Page Transition</Label>
              <SelectInput
                value={project.pageTransition ?? 'none'}
                onChange={(v) => updateTransition(v)}
                options={[
                  { value: 'none',  label: 'None (instant)' },
                  { value: 'fade',  label: 'Fade' },
                  { value: 'slide', label: 'Slide' },
                  { value: 'flip',  label: 'Flip' },
                ]}
              />
            </Row>
          )}
        </div>
        <div className="mt-auto p-3 border-t border-white/10">
          <p className="text-[10px] text-gray-500">Select an element to edit its properties.</p>
        </div>
      </aside>
    );
  }

  // === Element properties panel ===
  return (
    <aside className="w-60 bg-panel border-l border-white/10 flex flex-col overflow-y-auto">

      {/* Header: type label + z-index + lock toggle */}
      <div className="px-3 py-3 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-purple-300 uppercase tracking-widest">
          {element.type}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">z:{element.zIndex}</span>
          <button
            onClick={() => toggleLock(element.id)}
            title={isLocked ? 'Unlock element' : 'Lock element (prevents canvas interaction)'}
            className={`p-1 rounded transition-colors ${
              isLocked
                ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/10'
            }`}
          >
            <LockIcon locked={isLocked} />
          </button>
        </div>
      </div>

      {/* Multi-select banner */}
      {selectedIds.length > 1 && (
        <div className="mx-3 mt-3 px-2 py-1.5 rounded-md bg-accent/10 border border-accent/20 text-[10px] text-purple-300">
          {selectedIds.length} elements selected
        </div>
      )}

      <div className="p-3 flex flex-col gap-4 overflow-y-auto">

        {/* Position & Size */}
        <div>
          <Label>Position</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-[10px] text-gray-500">X</span>
              <NumberInput value={element.x} onChange={(v) => set({ x: v })} min={0} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500">Y</span>
              <NumberInput value={element.y} onChange={(v) => set({ y: v })} min={0} />
            </div>
          </div>
        </div>

        <div>
          <Label>Size</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <span className="text-[10px] text-gray-500">W</span>
              <NumberInput value={element.width} onChange={(v) => set({ width: v })} min={20} />
            </div>
            <div>
              <span className="text-[10px] text-gray-500">H</span>
              <NumberInput value={element.height} onChange={(v) => set({ height: v })} min={10} />
            </div>
          </div>
        </div>

        {/* Layer order */}
        <div>
          <Label>Layer Order</Label>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {[
              { label: '⬆⬆', action: () => bringToFront(element.id), title: 'Bring to Front' },
              { label: '⬆',  action: () => bringForward(element.id), title: 'Bring Forward' },
              { label: '⬇',  action: () => sendBackward(element.id), title: 'Send Backward' },
              { label: '⬇⬇', action: () => sendToBack(element.id),  title: 'Send to Back' },
            ].map(({ label, action, title }) => (
              <button
                key={title}
                onClick={action}
                title={title}
                className="py-1 text-sm bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Text-specific */}
        {(element.type === 'text' || element.type === 'guestname') && (
          <>
            <Row>
              <Label>Font Size</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={parseInt(element.styles.fontSize || '16', 10)}
                  onChange={(v) => setStyle({ fontSize: `${v}px` })}
                  min={8}
                  max={200}
                />
                <span className="text-xs text-gray-400">px</span>
              </div>
            </Row>

            <Row>
              <Label>Font Family</Label>
              <FontPicker
                value={element.styles.fontFamily || 'sans-serif'}
                onChange={(v) => setStyle({ fontFamily: v })}
              />
            </Row>

            <Row>
              <Label>Font Weight</Label>
              <SelectInput
                value={element.styles.fontWeight || '400'}
                onChange={(v) => setStyle({ fontWeight: v })}
                options={[
                  { value: '300', label: 'Light' },
                  { value: '400', label: 'Regular' },
                  { value: '600', label: 'Semi-bold' },
                  { value: '700', label: 'Bold' },
                  { value: '900', label: 'Black' },
                ]}
              />
            </Row>

            <Row>
              <Label>Text Align</Label>
              <SelectInput
                value={element.styles.textAlign || 'left'}
                onChange={(v) => setStyle({ textAlign: v })}
                options={[
                  { value: 'left',   label: 'Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'right',  label: 'Right' },
                ]}
              />
            </Row>

            <Row>
              <Label>Text Color</Label>
              <ColorInput
                value={element.styles.color || '#000000'}
                onChange={(v) => setStyle({ color: v })}
              />
            </Row>

            <Row>
              <Label>Line Height</Label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="3"
                value={parseFloat(element.styles.lineHeight || '1.4')}
                onChange={(e) => setStyle({ lineHeight: e.target.value })}
                className="w-full bg-white/10 text-white text-sm rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-accent"
              />
            </Row>
          </>
        )}

        {/* Shape background */}
        {element.type === 'shape' && (
          <Row>
            <Label>Background Color</Label>
            <ColorInput
              value={element.styles.backgroundColor || '#7c3aed'}
              onChange={(v) => setStyle({ backgroundColor: v })}
            />
          </Row>
        )}

        {/* Countdown-specific controls */}
        {element.type === 'countdown' && (
          <>
            <Row>
              <Label>Target Date &amp; Time</Label>
              <input
                type="datetime-local"
                value={element.content?.slice(0, 16) ?? ''}
                onChange={(e) => set({ content: e.target.value })}
                className="w-full bg-white/10 text-white text-sm rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-accent [color-scheme:dark]"
              />
            </Row>

            <Row>
              <Label>Number Font Size</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={parseInt(element.styles.numberFontSize || '48', 10)}
                  onChange={(v) => setStyle({ numberFontSize: `${v}px` })}
                  min={12}
                  max={200}
                />
                <span className="text-xs text-gray-400">px</span>
              </div>
            </Row>

            <Row>
              <Label>Label Font Size</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={parseInt(element.styles.labelFontSize || '12', 10)}
                  onChange={(v) => setStyle({ labelFontSize: `${v}px` })}
                  min={8}
                  max={48}
                />
                <span className="text-xs text-gray-400">px</span>
              </div>
            </Row>

            <Row>
              <Label>Font Family</Label>
              <FontPicker
                value={element.styles.fontFamily || 'sans-serif'}
                onChange={(v) => setStyle({ fontFamily: v })}
              />
            </Row>

            <Row>
              <Label>Font Weight</Label>
              <SelectInput
                value={element.styles.fontWeight || '700'}
                onChange={(v) => setStyle({ fontWeight: v })}
                options={[
                  { value: '300', label: 'Light' },
                  { value: '400', label: 'Regular' },
                  { value: '600', label: 'Semi-bold' },
                  { value: '700', label: 'Bold' },
                  { value: '900', label: 'Black' },
                ]}
              />
            </Row>

            <Row>
              <Label>Number Color</Label>
              <ColorInput
                value={element.styles.numberColor || '#1a1a1a'}
                onChange={(v) => setStyle({ numberColor: v })}
              />
            </Row>

            <Row>
              <Label>Label Color</Label>
              <ColorInput
                value={element.styles.labelColor || '#6b7280'}
                onChange={(v) => setStyle({ labelColor: v })}
              />
            </Row>

            <Row>
              <Label>Box Background</Label>
              <ColorInput
                value={element.styles.boxBackgroundColor || '#f3f0ff'}
                onChange={(v) => setStyle({ boxBackgroundColor: v })}
              />
            </Row>

            <Row>
              <Label>Box Border Radius</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={parseInt(element.styles.boxBorderRadius || '8', 10)}
                  onChange={(v) => setStyle({ boxBorderRadius: `${v}px` })}
                  min={0}
                  max={100}
                />
                <span className="text-xs text-gray-400">px</span>
              </div>
            </Row>

            <Row>
              <Label>Box Gap</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={parseInt(element.styles.gap || '12', 10)}
                  onChange={(v) => setStyle({ gap: `${v}px` })}
                  min={0}
                  max={80}
                />
                <span className="text-xs text-gray-400">px</span>
              </div>
            </Row>

            <Row>
              <Label>Show Labels</Label>
              <button
                onClick={() => setStyle({ showLabels: !(element.styles.showLabels !== false) })}
                className={`w-full py-1.5 text-xs rounded-md transition-colors ${
                  element.styles.showLabels !== false
                    ? 'bg-accent/30 text-purple-200 border border-accent/40'
                    : 'bg-white/10 text-gray-400 border border-white/10'
                }`}
              >
                {element.styles.showLabels !== false ? 'Visible' : 'Hidden'}
              </button>
            </Row>
          </>
        )}

        {/* Border Radius — all except text, guestname, countdown */}
        {element.type !== 'text' && element.type !== 'guestname' && element.type !== 'countdown' && (
          <Row>
            <Label>Border Radius</Label>
            <div className="flex items-center gap-2">
              <NumberInput
                value={parseInt(element.styles.borderRadius || '0', 10)}
                onChange={(v) => setStyle({ borderRadius: `${v}px` })}
                min={0}
                max={500}
              />
              <span className="text-xs text-gray-400">px</span>
            </div>
          </Row>
        )}

        {/* Opacity — all elements */}
        <Row>
          <Label>Opacity</Label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={element.styles.opacity ?? 1}
            onChange={(e) => setStyle({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-accent"
          />
          <span className="text-xs text-gray-400 text-right">
            {Math.round((element.styles.opacity ?? 1) * 100)}%
          </span>
        </Row>

        {/* Image URL */}
        {element.type === 'image' && (
          <Row>
            <Label>Image URL</Label>
            <input
              type="text"
              value={element.src || ''}
              onChange={(e) => set({ src: e.target.value })}
              placeholder="https://... or double-click element to upload"
              className="w-full bg-white/10 text-white text-xs rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-accent"
            />
          </Row>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-white/10 flex flex-col gap-2">

        {/* Group / Ungroup row */}
        {(canGroup || canUngroup) && (
          <div className="flex gap-2">
            {canGroup && (
              <button
                onClick={groupSelected}
                title="Group selected elements — they will move together"
                className="flex-1 py-1.5 text-xs bg-accent/20 hover:bg-accent/30 text-purple-200 rounded-md transition-colors border border-accent/30"
              >
                Group ({selectedIds.length})
              </button>
            )}
            {canUngroup && (
              <button
                onClick={() => ungroupElement(element.id)}
                title="Ungroup — elements will move independently again"
                className="flex-1 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-md transition-colors"
              >
                Ungroup
              </button>
            )}
          </div>
        )}

        {/* Duplicate / Delete row */}
        <div className="flex gap-2">
          <button
            onClick={() => duplicateElement(element.id)}
            className="flex-1 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={() => deleteElement(element.id)}
            className="flex-1 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
}
