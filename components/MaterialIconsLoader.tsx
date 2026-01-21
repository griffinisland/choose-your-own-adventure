'use client';

import { useEffect } from 'react';

export function MaterialIconsLoader() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
    document.head.appendChild(link);

    return () => {
      // Cleanup on unmount
      document.head.removeChild(link);
    };
  }, []);

  return null;
}
