import type { CanvasElement } from '@/lib/api';

interface Props {
  element: CanvasElement;
}

export default function ShapeElement({ element }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        ...element.styles,
      }}
    />
  );
}
