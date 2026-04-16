import type { CanvasElement } from '@/lib/api';
import { cssStyles } from '../../utils/cssStyles';

interface Props {
  element: CanvasElement;
}

export default function ShapeElement({ element }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        ...cssStyles(element.styles),
      }}
    />
  );
}
