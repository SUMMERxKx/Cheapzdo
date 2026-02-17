import { useMemo } from 'react';
import { useTheme, ThemeDefinition } from '@/context/ThemeContext';

/**
 * Returns a seeded-random number so the particles are stable across re-renders.
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface ParticleConfig {
  count: number;
  className: string;
  childClass: string;
  buildStyle: (i: number) => React.CSSProperties;
  buildContent?: (i: number) => string;
}

const LEAF_CHARS = ['🍂', '🍁', '🍃'];
const PETAL_CHARS = ['🌸', '💮'];
const LANTERN_CHARS = ['🏮', '🏮', '🏮', '🧧', '✨'];

function getConfig(particles: ThemeDefinition['particles']): ParticleConfig | null {
  switch (particles) {
    case 'rain':
      return {
        count: 60,
        className: 'weather-particles-rain',
        childClass: 'drop',
        buildStyle: (i) => ({
          left: `${seededRandom(i * 7) * 100}%`,
          animationDuration: `${0.6 + seededRandom(i * 3) * 0.6}s`,
          animationDelay: `${seededRandom(i * 11) * 2}s`,
          height: `${14 + seededRandom(i * 5) * 10}px`,
          opacity: 0.3 + seededRandom(i * 13) * 0.4,
        }),
      };
    case 'snow':
      return {
        count: 40,
        className: 'weather-particles-snow',
        childClass: 'flake',
        buildStyle: (i) => ({
          left: `${seededRandom(i * 7) * 100}%`,
          animationDuration: `${5 + seededRandom(i * 3) * 8}s`,
          animationDelay: `${seededRandom(i * 11) * 6}s`,
          width: `${3 + seededRandom(i * 5) * 6}px`,
          height: `${3 + seededRandom(i * 5) * 6}px`,
        }),
      };
    case 'leaves':
      return {
        count: 18,
        className: 'weather-particles-leaves',
        childClass: 'leaf',
        buildStyle: (i) => ({
          left: `${seededRandom(i * 7) * 100}%`,
          animationDuration: `${7 + seededRandom(i * 3) * 8}s`,
          animationDelay: `${seededRandom(i * 11) * 8}s`,
          fontSize: `${12 + seededRandom(i * 5) * 8}px`,
        }),
        buildContent: (i) => LEAF_CHARS[Math.floor(seededRandom(i * 17) * LEAF_CHARS.length)],
      };
    case 'petals':
      return {
        count: 22,
        className: 'weather-particles-petals',
        childClass: 'petal',
        buildStyle: (i) => ({
          left: `${seededRandom(i * 7) * 100}%`,
          animationDuration: `${8 + seededRandom(i * 3) * 7}s`,
          animationDelay: `${seededRandom(i * 11) * 8}s`,
          fontSize: `${10 + seededRandom(i * 5) * 6}px`,
        }),
        buildContent: (i) => PETAL_CHARS[Math.floor(seededRandom(i * 17) * PETAL_CHARS.length)],
      };
    case 'sun-rays':
      return {
        count: 30,
        className: 'weather-particles-sun-rays',
        childClass: 'ray',
        buildStyle: (i) => ({
          left: `${seededRandom(i * 7) * 100}%`,
          animationDuration: `${3 + seededRandom(i * 3) * 4}s`,
          animationDelay: `${seededRandom(i * 11) * 4}s`,
          height: `${20 + seededRandom(i * 5) * 25}px`,
          opacity: 0.15 + seededRandom(i * 13) * 0.25,
        }),
      };
    case 'lanterns':
      return {
        count: 20,
        className: 'weather-particles-lanterns',
        childClass: 'lantern',
        buildStyle: (i) => ({
          left: `${seededRandom(i * 7) * 100}%`,
          animationDuration: `${14 + seededRandom(i * 3) * 12}s`,
          animationDelay: `${seededRandom(i * 11) * 10}s`,
          fontSize: `${16 + seededRandom(i * 5) * 14}px`,
          opacity: 0.55 + seededRandom(i * 13) * 0.4,
        }),
        buildContent: (i) => LANTERN_CHARS[Math.floor(seededRandom(i * 17) * LANTERN_CHARS.length)],
      };
    default:
      return null;
  }
}

/**
 * WeatherParticles
 *
 * Renders animated weather particles (rain drops, snowflakes, leaves, petals,
 * sun rays) based on the current theme. The particles are purely decorative,
 * positioned fixed over the viewport with pointer-events disabled.
 */
export function WeatherParticles() {
  const { currentTheme } = useTheme();

  const config = useMemo(
    () => getConfig(currentTheme.particles),
    [currentTheme.particles],
  );

  const elements = useMemo(() => {
    if (!config) return null;
    return Array.from({ length: config.count }, (_, i) => (
      <span
        key={i}
        className={config.childClass}
        style={config.buildStyle(i)}
      >
        {config.buildContent?.(i) ?? ''}
      </span>
    ));
  }, [config]);

  if (!config || !elements) return null;

  return <div className={config.className}>{elements}</div>;
}
