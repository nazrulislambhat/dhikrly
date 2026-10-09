'use client';

import type { CSSProperties, PointerEvent, ReactNode } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

type TiltStyle = CSSProperties & {
  '--tilt-x': string;
  '--tilt-y': string;
};

export default function TiltCard({
  children,
  className = '',
  intensity = 5,
}: TiltCardProps) {
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--tilt-x', `${-y * intensity}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${x * intensity}deg`);
  };

  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <div
      className={`tilt-card ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ '--tilt-x': '0deg', '--tilt-y': '0deg' } as TiltStyle}
    >
      {children}
    </div>
  );
}
