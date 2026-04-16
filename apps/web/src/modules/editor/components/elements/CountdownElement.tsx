'use client';

import { useEffect, useState } from 'react';
import type { CanvasElement } from '@/lib/api';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface Props {
  element: CanvasElement;
}

export default function CountdownElement({ element }: Props) {
  const styles = element.styles ?? {};

  const targetDate = element.content ? new Date(element.content) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const isValidDate = !isNaN(targetDate.getTime());

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    isValidDate ? calcTimeLeft(targetDate) : { days: 0, hours: 0, minutes: 0, seconds: 0 },
  );

  useEffect(() => {
    if (!isValidDate) return;
    const id = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [element.content]);

  const numberFontSize = styles.numberFontSize ?? '48px';
  const labelFontSize = styles.labelFontSize ?? '12px';
  const fontFamily = styles.fontFamily ?? 'Georgia, serif';
  const fontWeight = styles.fontWeight ?? '700';
  const numberColor = styles.numberColor ?? '#1a1a1a';
  const labelColor = styles.labelColor ?? '#6b7280';
  const boxBg = styles.boxBackgroundColor ?? '#f3f0ff';
  const boxRadius = styles.boxBorderRadius ?? '8px';
  const gap = styles.gap ?? '12px';
  const showLabels = styles.showLabels !== false;
  const opacity = styles.opacity ?? 1;

  const units: { value: number; label: string }[] = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.seconds, label: 'Seconds' },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
        fontFamily,
        opacity,
        overflow: 'hidden',
      }}
    >
      {units.map(({ value, label }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            flex: '1 1 0',
            minWidth: 0,
          }}
        >
          <div
            style={{
              background: boxBg,
              borderRadius: boxRadius,
              width: '100%',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: numberFontSize,
              fontWeight,
              color: numberColor,
              lineHeight: 1,
              minHeight: 0,
            }}
          >
            {pad(value)}
          </div>
          {showLabels && (
            <span
              style={{
                fontSize: labelFontSize,
                color: labelColor,
                fontWeight: '400',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              {label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
