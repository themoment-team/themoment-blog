'use client';

import { useEffect } from 'react';

export function CopyHeadingLinks() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a.anchor-heading');
      if (!anchor) return;
      e.preventDefault();
      navigator.clipboard.writeText((anchor as HTMLAnchorElement).href);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
