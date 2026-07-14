'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { motion } from 'framer-motion';

/**
 * Detects whether to render the full WebGL 3D scene or a lighter
 * animated fallback. Gated by:
 *  - screen width < 768px (mobile)
 *  - prefers-reduced-motion
 *  - WebGL context availability
 */
function useShouldRender3D() {
  const [shouldRender, setShouldRender] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let hasWebGL = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      hasWebGL = !!gl;
    } catch {
      hasWebGL = false;
    }

    setShouldRender(!isMobile && !reducedMotion && hasWebGL);
  }, []);

  return { shouldRender, mounted };
}

/** Lightweight animated fallback for mobile / no-WebGL */
function AnimatedFallback() {
  const colors = [
    '#E40303',
    '#FF8C00',
    '#FFED00',
    '#008026',
    '#004DFF',
    '#732982',
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="relative h-[280px] w-[280px]">
        {colors.map((color, i) => (
          <motion.div
            key={color}
            className="absolute inset-0 rounded-full"
            style={{
              border: `3px solid ${color}`,
              opacity: 0.7,
              scale: 1 - i * 0.12,
              boxShadow: `0 0 20px ${color}40`,
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
        <motion.div
          className="absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(74,58,138,0.6) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

function SceneLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="border-primary/20 h-[200px] w-[200px] animate-pulse rounded-full border-2" />
    </div>
  );
}

export function HeroScene() {
  const { shouldRender, mounted } = useShouldRender3D();
  const [CanvasComponent, setCanvasComponent] = useState<ComponentType | null>(
    null,
  );

  // Dynamically load the Three.js canvas component after mount
  useEffect(() => {
    if (shouldRender) {
      import('./webgl-canvas')
        .then((m) => setCanvasComponent(() => m.WebGLCanvas))
        .catch((err) => console.error('Failed to load 3D scene:', err));
    }
  }, [shouldRender]);

  if (!mounted) {
    return (
      <div className="h-full w-full">
        <SceneLoading />
      </div>
    );
  }

  if (!shouldRender) {
    return (
      <div className="h-full w-full">
        <AnimatedFallback />
      </div>
    );
  }

  if (!CanvasComponent) {
    return (
      <div className="h-full w-full">
        <SceneLoading />
      </div>
    );
  }

  return <CanvasComponent />;
}
