'use client';

import { useEffect } from 'react';

export function CopyHeadingLinks() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a.anchor-heading');
      if (!anchor) return;
      e.preventDefault();
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard
          .writeText((anchor as HTMLAnchorElement).href)
          .catch((err) => console.error('Failed to copy heading link:', err));
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
