import { useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function CardSpotlight({ children, className, spotlightColor, ...props }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        'group relative rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-lg',
        className,
      )}
      style={{ boxShadow: `0 10px 15px -3px var(--th-shadow-card), 0 4px 6px -4px var(--th-shadow-card)` }}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div
          className="absolute -inset-px z-0 transition-opacity duration-500"
          style={{
            opacity,
            background: `radial-gradient(680px circle at ${pos.x}px ${pos.y}px, ${spotlightColor || 'var(--th-spotlight)'}, transparent 40%)`,
          }}
        />
        <div
          className="absolute -inset-px z-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, var(--th-spotlight-border), transparent 40%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '1px',
            borderRadius: 'inherit',
          }}
        />
      </div>
      <div className="relative">{children}</div>
    </motion.div>
  );
}
