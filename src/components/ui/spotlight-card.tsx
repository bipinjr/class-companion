import React, { useEffect, useRef, ReactNode, CSSProperties } from 'react';

interface GlowCardProps {
  children?: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'blue',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--x', x.toFixed(2));
      el.style.setProperty('--xp', (x / rect.width).toFixed(2));
      el.style.setProperty('--y', y.toFixed(2));
      el.style.setProperty('--yp', (y / rect.height).toFixed(2));
      el.style.setProperty('--active', '1');
    };
    const handleLeave = () => {
      el.style.setProperty('--active', '0');
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerenter', handleMove);
    el.addEventListener('pointerleave', handleLeave);
    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerenter', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
    };
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const inlineStyles: CSSProperties = {
    '--base': base,
    '--spread': spread,
    '--radius': '14',
    '--border': '2',
    '--backdrop': 'transparent',
    '--backup-border': 'transparent',
    '--size': '150',
    '--outer': '1',
    '--border-size': 'calc(var(--border, 2) * 1px)',
    '--spotlight-size': 'calc(var(--size, 150) * 1px)',
    '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
    '--active': '0',
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / calc(var(--bg-spot-opacity, 0.15) * var(--active, 0))), transparent
    )`,
    backgroundColor: 'var(--backdrop, transparent)',
    backgroundSize: '100% 100%',
    backgroundPosition: '0 0',
    border: 'var(--border-size) solid var(--backup-border)',
    position: 'relative',
    touchAction: 'none',
  } as CSSProperties;

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-position: 0 0;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
      opacity: var(--active, 0);
      transition: opacity 200ms ease;
    }
    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(2);
    }
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={inlineStyles}
        className={`rounded-[14px] ${className}`}
      >
        {children}
      </div>
    </>
  );
};

export { GlowCard };
