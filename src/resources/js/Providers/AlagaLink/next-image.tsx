import React from 'react';

type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
};

export default function Image({ fill, style, ...props }: NextImageProps) {
    const resolvedStyle: React.CSSProperties = {
        ...(fill ? { width: '100%', height: '100%', position: 'absolute', inset: 0 } : null),
        ...(style || null),
    };

    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} style={resolvedStyle} />;
}
