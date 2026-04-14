import type { CanvasElement } from '@/lib/api';

interface Props {
  element: CanvasElement;
  /** Resolved guest name — only present in the public viewer */
  guestName?: string;
  isPreview?: boolean;
}

export default function GuestNameElement({ element, guestName, isPreview }: Props) {
  const styles = element.styles ?? {};

  const displayText = isPreview && guestName ? guestName : (guestName ?? '{{Guest Name}}');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: styles.textAlign === 'left' ? 'flex-start' : styles.textAlign === 'right' ? 'flex-end' : 'center',
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        fontWeight: styles.fontWeight,
        color: styles.color,
        lineHeight: styles.lineHeight,
        textAlign: styles.textAlign as any,
        opacity: styles.opacity ?? 1,
        // In editor show a subtle dashed border so the element is visible even without a real name
        outline: !isPreview ? '1.5px dashed rgba(124,58,237,0.4)' : 'none',
        borderRadius: '4px',
        userSelect: 'none',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      }}
    >
      {!isPreview && !guestName && (
        // Editor placeholder badge
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'rgba(124,58,237,0.6)',
            position: 'absolute',
            top: '-16px',
            left: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Guest Name
        </span>
      )}
      <span>{displayText}</span>
    </div>
  );
}
