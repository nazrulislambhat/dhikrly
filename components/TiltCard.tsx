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
      className={`transform-gpu [transform:perspective(900px)_rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))_translateZ(0)] [transform-style:preserve-3d] transition-[transform,filter] duration-200 will-change-transform hover:drop-shadow-[0_14px_20px_rgb(20_48_39/9%)] motion-reduce:transform-none ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ '--tilt-x': '0deg', '--tilt-y': '0deg' } as TiltStyle}
    >
      {children}
    </div>
  );
}
