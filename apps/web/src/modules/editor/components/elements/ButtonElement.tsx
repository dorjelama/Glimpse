import type { CanvasElement } from '@/lib/api';

interface Props {
  element: CanvasElement;
  isPreview: boolean;
}

export default function ButtonElement({ element, isPreview }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isPreview ? 'pointer' : 'move',
        userSelect: 'none',
        ...element.styles,
      }}
    >
      {element.content || 'Click Here'}
    </div>
  );
}
