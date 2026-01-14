/**
 * Hook para detectar la orientación del dispositivo
 * Útil para tablets con giroscopio
 */

import { useState, useEffect } from 'react';

export type Orientation = 'portrait' | 'landscape';

export interface OrientationInfo {
  orientation: Orientation;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

export function useOrientation(): OrientationInfo {
  const [orientation, setOrientation] = useState<OrientationInfo>(() => {
    // Detectar orientación inicial
    const isPortrait = window.innerHeight > window.innerWidth;
    return {
      orientation: isPortrait ? 'portrait' : 'landscape',
      angle: 0,
      isPortrait,
      isLandscape: !isPortrait
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation({
        orientation: isPortrait ? 'portrait' : 'landscape',
        angle: 0,
        isPortrait,
        isLandscape: !isPortrait
      });
    };

    // Escuchar cambios de orientación usando la API de orientación
    const handleOrientationChange = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const angle = (window.orientation !== undefined) 
        ? Math.abs(window.orientation) 
        : 0;
      
      setOrientation({
        orientation: isPortrait ? 'portrait' : 'landscape',
        angle,
        isPortrait,
        isLandscape: !isPortrait
      });
    };

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // API de orientación del dispositivo (si está disponible)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientationChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientationChange);
      }
    };
  }, []);

  return orientation;
}

