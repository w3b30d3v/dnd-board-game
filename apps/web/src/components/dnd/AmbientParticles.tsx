'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

export type ParticleVariant = 'dust' | 'magic' | 'embers';

interface AmbientParticlesProps {
  variant?: ParticleVariant;
  className?: string;
}

export function AmbientParticles({ variant = 'dust', className = '' }: AmbientParticlesProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo((): ISourceOptions => {
    const baseConfig: ISourceOptions = {
      fullScreen: false,
      background: { color: 'transparent' },
      fpsLimit: 30,
      detectRetina: true,
    };

    switch (variant) {
      case 'dust':
        return {
          ...baseConfig,
          particles: {
            number: {
              value: 30,
              density: { enable: true, width: 800, height: 800 },
            },
            color: { value: '#F59E0B' },
            opacity: {
              value: { min: 0.05, max: 0.2 },
            },
            size: {
              value: { min: 0.5, max: 2 },
            },
            move: {
              enable: true,
              speed: 0.3,
              direction: 'top',
              random: true,
              straight: false,
              outModes: { default: 'out' },
            },
          },
        };

      case 'magic':
        return {
          ...baseConfig,
          particles: {
            number: { value: 20 },
            color: { value: ['#8B5CF6', '#A78BFA', '#C4B5FD'] },
            opacity: {
              value: { min: 0.2, max: 0.5 },
            },
            size: {
              value: { min: 1, max: 3 },
            },
            move: {
              enable: true,
              speed: 1,
              direction: 'none',
              random: true,
              outModes: { default: 'bounce' },
            },
            twinkle: {
              particles: {
                enable: true,
                frequency: 0.05,
                opacity: 1,
              },
            },
          },
        };

      case 'embers':
        return {
          ...baseConfig,
          particles: {
            number: { value: 40 },
            color: { value: ['#F97316', '#FBBF24', '#EF4444'] },
            opacity: {
              value: { min: 0.3, max: 0.7 },
            },
            size: {
              value: { min: 1, max: 2 },
            },
            move: {
              enable: true,
              speed: 2,
              direction: 'top',
              random: true,
              outModes: { default: 'out' },
            },
            life: {
              duration: {
                value: 2,
              },
              count: 1,
            },
          },
        };

      default:
        return baseConfig;
    }
  }, [variant]);

  if (!init) {
    return null;
  }

  return (
    <Particles
      className={`particles-container ${className}`}
      options={options}
    />
  );
}
