import { useCallback, useEffect, useState } from 'react';

/**
 * Tracks and toggles browser fullscreen for the whole page.
 * `isSupported` is false where the Fullscreen API is missing, such as iPhone Safari.
 */
export function useFullscreen() {
  const isSupported =
    typeof document !== 'undefined' &&
    document.fullscreenEnabled === true &&
    typeof document.documentElement.requestFullscreen === 'function';
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && document.fullscreenElement !== null,
  );

  useEffect(() => {
    if (!isSupported) return;
    const onChange = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [isSupported]);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // The browser refused the request, for example outside a user click. Nothing to do.
    }
  }, []);

  return { isSupported, isFullscreen, toggle };
}
