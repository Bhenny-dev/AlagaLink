/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'Device' | 'Medical' | 'Livelihood' | 'Generic';
  fallbackUrl?: string;
}

const FALLBACKS: Record<string, string> = {
  Device: 'https://images.unsplash.com/photo-1596496051601-1f3b1f6b7b6b?auto=format&fit=crop&q=100&w=1200',
  Medical: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=100&w=1200',
  Livelihood: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&q=100&w=1200',
  Generic: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=100&w=1200'
};

const FallbackImage: React.FC<Props> = ({ src, alt, fallbackType = 'Generic', fallbackUrl, className, ...rest }) => {
  const [errored, setErrored] = useState(false);
  const primary = typeof src === 'string' && src ? src : '';
  const fallback = fallbackUrl || FALLBACKS[fallbackType] || FALLBACKS.Generic;

  if (!primary || errored) {
    return <img src={fallback} alt={alt || 'Representative image'} className={className} {...rest} />;
  }

  return <img src={primary} alt={alt || ''} className={className} onError={() => setErrored(true)} {...rest} />;
};

export default FallbackImage;
